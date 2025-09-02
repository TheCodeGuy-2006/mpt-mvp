/**
 * PlanningDataModel - Data management for planning campaigns
 * Implements Single Responsibility Principle - handles only data operations
 * Follows Observer pattern via EventBus for loose coupling
 */

import eventBus, { EVENTS } from '../utils/EventBus.js';

export class PlanningDataModel {
  constructor() {
    this.masterData = [];           // Complete dataset - source of truth
    this.filteredData = [];         // Currently filtered view
    this.deletedRows = new Set();   // Track deleted row IDs for soft delete
    this.pendingUpdates = new Map();
    this.updateQueue = [];
    this.changeLog = [];            // Track all changes for debugging
    this.queueTimer = null;
    
    // Subscribe to relevant events
    this.initializeEventListeners();
  }
  
  /**
   * Initialize event listeners
   * Private method following encapsulation principle
   */
  initializeEventListeners() {
    // Listen for data refresh requests
    eventBus.subscribe(EVENTS.PLANNING_DATA_REFRESH, () => {
      this.refreshData();
    });
  }
  
  /**
   * Set the master dataset (called when loading from server/file)
   * @param {Array} data - Array of campaign data objects
   */
  setData(data) {
    if (!Array.isArray(data)) {
      console.warn('PlanningDataModel.setData: Invalid data provided, expected array');
      data = [];
    }
    
    // Clear __modified on all rows when loading new data
    data.forEach(row => { 
      if (row && typeof row === 'object') {
        row.__modified = false;
        // Ensure each row has an ID
        if (!row.id) {
          row.id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      }
    });
    
    this.masterData = [...data];  // Deep copy to prevent external mutation
    this.filteredData = [...data];
    this.deletedRows.clear();
    this.changeLog = [];
    
    // Notify observers that data has been loaded
    eventBus.publish(EVENTS.DATA_LOADED, {
      source: 'planning',
      count: data.length
    });
  }
  
  /**
   * Get master dataset (unfiltered, including soft-deleted rows)
   * @returns {Array} Complete dataset
   */
  getMasterData() {
    return this.masterData;
  }
  
  /**
   * Get active dataset (master minus deleted rows)
   * @returns {Array} Active campaign data
   */
  getData() {
    return this.masterData.filter(row => !this.deletedRows.has(row.id));
  }
  
  /**
   * Get currently filtered data (for table display)
   * @returns {Array} Filtered campaign data
   */
  getFilteredData() {
    return this.filteredData;
  }
  
  /**
   * Add new row to master dataset
   * @param {Object} rowData - Campaign data object
   * @returns {Object} Added row with generated ID
   */
  addRow(rowData) {
    if (!rowData.id) {
      rowData.id = `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    rowData.__modified = true;
    this.masterData.push(rowData);
    
    this.logChange('add', rowData.id, rowData);
    
    // Notify observers
    eventBus.publish(EVENTS.PLANNING_CAMPAIGN_ADDED, rowData);
    eventBus.publish(EVENTS.DATA_UPDATED, {
      source: 'planning',
      action: 'add',
      rowId: rowData.id
    });
    
    return rowData;
  }
  
  /**
   * Update row in master dataset
   * @param {string} rowId - Row identifier
   * @param {Object} updates - Object containing fields to update
   * @returns {boolean} Success status
   */
  updateRow(rowId, updates) {
    const rowIndex = this.masterData.findIndex(r => r.id === rowId);
    if (rowIndex === -1) {
      console.warn(`Row not found in master dataset: ${rowId}`);
      return false;
    }
    
    const oldData = { ...this.masterData[rowIndex] };
    Object.assign(this.masterData[rowIndex], updates, { __modified: true });
    
    this.logChange('update', rowId, this.masterData[rowIndex], oldData);
    
    // Notify observers
    eventBus.publish(EVENTS.PLANNING_CAMPAIGN_UPDATED, {
      rowId,
      newData: this.masterData[rowIndex],
      oldData
    });
    eventBus.publish(EVENTS.DATA_UPDATED, {
      source: 'planning',
      action: 'update',
      rowId
    });
    
    return true;
  }
  
  /**
   * Soft delete row (keeps in master but marks as deleted)
   * @param {string} rowId - Row identifier
   * @returns {boolean} Success status
   */
  deleteRow(rowId) {
    const row = this.masterData.find(r => r.id === rowId);
    if (!row) {
      console.warn(`Row not found in master dataset for deletion: ${rowId}`);
      return false;
    }
    
    this.deletedRows.add(rowId);
    this.logChange('delete', rowId, row);
    
    // Notify observers
    eventBus.publish(EVENTS.PLANNING_CAMPAIGN_DELETED, {
      rowId,
      rowData: row,
      permanent: false
    });
    eventBus.publish(EVENTS.DATA_UPDATED, {
      source: 'planning',
      action: 'delete',
      rowId
    });
    
    return true;
  }
  
  /**
   * Hard delete row (permanently removes from master)
   * @param {string} rowId - Row identifier
   * @returns {boolean} Success status
   */
  permanentlyDeleteRow(rowId) {
    const rowIndex = this.masterData.findIndex(r => r.id === rowId);
    if (rowIndex === -1) {
      console.warn(`Row not found in master dataset for permanent deletion: ${rowId}`);
      return false;
    }
    
    const deletedRow = this.masterData.splice(rowIndex, 1)[0];
    this.deletedRows.delete(rowId);
    
    this.logChange('permanent_delete', rowId, deletedRow);
    
    // Notify observers
    eventBus.publish(EVENTS.PLANNING_CAMPAIGN_DELETED, {
      rowId,
      rowData: deletedRow,
      permanent: true
    });
    eventBus.publish(EVENTS.DATA_UPDATED, {
      source: 'planning',
      action: 'permanent_delete',
      rowId
    });
    
    return true;
  }
  
  /**
   * Restore soft-deleted row
   * @param {string} rowId - Row identifier
   * @returns {boolean} Success status
   */
  restoreRow(rowId) {
    if (!this.deletedRows.has(rowId)) {
      console.warn(`Row not in deleted set: ${rowId}`);
      return false;
    }
    
    this.deletedRows.delete(rowId);
    const row = this.masterData.find(r => r.id === rowId);
    
    this.logChange('restore', rowId, row);
    
    // Notify observers
    eventBus.publish(EVENTS.PLANNING_CAMPAIGN_ADDED, row); // Treat as re-added
    eventBus.publish(EVENTS.DATA_UPDATED, {
      source: 'planning',
      action: 'restore',
      rowId
    });
    
    return true;
  }
  
  /**
   * Get deleted rows (for recovery/undo functionality)
   * @returns {Array} Soft-deleted rows
   */
  getDeletedRows() {
    return this.masterData.filter(row => this.deletedRows.has(row.id));
  }
  
  /**
   * Clear all deleted rows permanently
   * @returns {number} Number of rows cleared
   */
  clearDeletedRows() {
    const deletedCount = this.deletedRows.size;
    this.masterData = this.masterData.filter(row => !this.deletedRows.has(row.id));
    this.deletedRows.clear();
    
    // Notify observers
    eventBus.publish(EVENTS.DATA_UPDATED, {
      source: 'planning',
      action: 'clear_deleted',
      count: deletedCount
    });
    
    return deletedCount;
  }
  
  /**
   * Queue updates to reduce immediate DOM operations
   * @param {string} rowId - Row identifier
   * @param {Object} updates - Updates to queue
   */
  queueUpdate(rowId, updates) {
    this.pendingUpdates.set(rowId, { ...this.pendingUpdates.get(rowId), ...updates });
    
    // Process queue after short delay
    clearTimeout(this.queueTimer);
    this.queueTimer = setTimeout(() => this.processUpdateQueue(), 100);
  }
  
  /**
   * Process queued updates
   * Private method for batch processing
   */
  processUpdateQueue() {
    if (this.pendingUpdates.size === 0) return;
    
    // Apply all pending updates to master dataset
    this.pendingUpdates.forEach((updates, rowId) => {
      this.updateRow(rowId, updates);
    });
    
    this.pendingUpdates.clear();
    
    // Notify that data should be refreshed
    eventBus.publish(EVENTS.PLANNING_DATA_REFRESH);
  }

  /**
   * Apply filters to the dataset
   * @param {Object} filters - Filter configuration
   * @returns {Array} Filtered data
   */
  applyFilters(filters) {
    const startTime = performance.now();
    
    // Early return optimization: if no filters are active, return all active data
    const hasActiveFilters = filters.digitalMotions || 
      (Array.isArray(filters.descriptionKeyword) && filters.descriptionKeyword.length > 0) ||
      ['region', 'quarter', 'status', 'programType', 'strategicPillars', 'owner', 'revenuePlay', 'country']
        .some(field => Array.isArray(filters[field]) && filters[field].length > 0);
    
    // Start with active data (master minus deleted)
    const activeData = this.getData();
    
    if (!hasActiveFilters) {
      this.filteredData = activeData;
      const duration = performance.now() - startTime;
      
      // Publish performance metrics
      eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
        operation: 'filter_planning_data',
        duration,
        recordCount: this.filteredData.length,
        hasFilters: false
      });
      
      return this.filteredData;
    }
    
    // Pre-compute filter optimizations
    const normalizedQuarterFilters = filters.quarter && Array.isArray(filters.quarter) 
      ? filters.quarter.map(this.normalizeQuarter) 
      : null;
    
    // Pre-compute case-insensitive filter sets for performance
    const programTypeFilters = filters.programType && Array.isArray(filters.programType)
      ? new Set(filters.programType.map(val => (val || '').toLowerCase().trim()))
      : null;
    
    const strategicPillarsFilters = filters.strategicPillars && Array.isArray(filters.strategicPillars)
      ? new Set(filters.strategicPillars.map(val => (val || '').toLowerCase().trim()))
      : null;
    
    // Pre-compute description keywords for case-insensitive matching
    const descriptionKeywords = Array.isArray(filters.descriptionKeyword) && filters.descriptionKeyword.length > 0
      ? filters.descriptionKeyword.map(kw => kw.toLowerCase())
      : null;
    
    this.filteredData = activeData.filter(row => {
      // Digital Motions filter (optimized boolean check)
      if (filters.digitalMotions && !(row.digitalMotions === true || row.digitalMotions === 'true')) {
        return false;
      }

      // Description keyword filter (optimized with pre-computed keywords)
      if (descriptionKeywords) {
        const desc = (row.description || '').toLowerCase();
        if (!descriptionKeywords.every(kw => desc.includes(kw))) {
          return false;
        }
      }

      // Multiselect filters - check if row value is in the selected array
      const multiselectFields = ['region', 'quarter', 'status', 'programType', 'strategicPillars', 'owner', 'revenuePlay', 'country'];
      for (const field of multiselectFields) {
        const filterValues = filters[field];
        if (filterValues && Array.isArray(filterValues) && filterValues.length > 0) {
          // Get the correct row value for this field
          let rowValue = row[field];

          // Apply field-specific optimizations
          if (field === 'quarter') {
            rowValue = this.normalizeQuarter(rowValue);
            if (!normalizedQuarterFilters.includes(rowValue)) {
              return false;
            }
          } else if (field === 'programType') {
            // Use pre-computed Set for faster lookup
            const rowValueLower = (rowValue || '').toLowerCase().trim();
            if (!programTypeFilters.has(rowValueLower)) {
              return false;
            }
          } else if (field === 'strategicPillars') {
            // Use pre-computed Set for faster lookup
            const rowValueLower = (rowValue || '').toLowerCase().trim();
            if (!strategicPillarsFilters.has(rowValueLower)) {
              return false;
            }
          } else {
            // Direct array includes for exact matches (fastest for other fields)
            if (!filterValues.includes(rowValue)) {
              return false;
            }
          }
        }
      }

      return true;
    });
    
    const duration = performance.now() - startTime;
    
    // Publish performance metrics and filter results
    eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
      operation: 'filter_planning_data',
      duration,
      recordCount: this.filteredData.length,
      hasFilters: true,
      filterCount: Object.keys(filters).length
    });
    
    if (duration > 50) {
      eventBus.publish(EVENTS.PERFORMANCE_WARNING, {
        operation: 'filter_planning_data',
        duration,
        threshold: 50,
        message: 'Planning data filtering took longer than expected'
      });
    }
    
    return this.filteredData;
  }
  
  /**
   * Normalize quarter values for consistent filtering
   * @param {string} quarter - Quarter value to normalize
   * @returns {string} Normalized quarter
   */
  normalizeQuarter(quarter) {
    if (!quarter) return '';
    const normalized = quarter.toString().trim().toLowerCase();
    if (normalized.startsWith('q')) return normalized;
    if (['1', '2', '3', '4'].includes(normalized)) return `q${normalized}`;
    return normalized;
  }
  
  /**
   * Clear all data (including deleted rows)
   */
  clearAllData() {
    this.masterData = [];
    this.filteredData = [];
    this.deletedRows.clear();
    this.pendingUpdates.clear();
    this.updateQueue = [];
    this.changeLog = [];
    
    // Notify observers
    eventBus.publish(EVENTS.DATA_UPDATED, {
      source: 'planning',
      action: 'clear_all'
    });
  }
  
  /**
   * Refresh data and notify observers
   */
  refreshData() {
    // Re-apply current filters to update filtered view
    // This would typically be called with the current filter state
    this.filteredData = [...this.getData()];
    
    eventBus.publish(EVENTS.DATA_UPDATED, {
      source: 'planning',
      action: 'refresh'
    });
  }
  
  /**
   * Log changes for debugging and potential undo functionality
   * @param {string} action - Type of change
   * @param {string} rowId - Row identifier
   * @param {Object} newData - New data state
   * @param {Object} oldData - Previous data state
   */
  logChange(action, rowId, newData, oldData = null) {
    this.changeLog.push({
      timestamp: new Date().toISOString(),
      action,
      rowId,
      newData: newData ? { ...newData } : null,
      oldData: oldData ? { ...oldData } : null
    });
    
    // Keep only last 100 changes to prevent memory bloat
    if (this.changeLog.length > 100) {
      this.changeLog.shift();
    }
  }
  
  /**
   * Get change history for debugging
   * @returns {Array} Change log entries
   */
  getChangeLog() {
    return this.changeLog;
  }
  
  /**
   * Get statistics about the dataset
   * @returns {Object} Dataset statistics
   */
  getStats() {
    return {
      masterDataCount: this.masterData.length,
      activeDataCount: this.getData().length,
      filteredDataCount: this.filteredData.length,
      deletedCount: this.deletedRows.size,
      pendingUpdates: this.pendingUpdates.size,
      changeLogEntries: this.changeLog.length
    };
  }
  
  /**
   * Clean up resources and event listeners
   */
  destroy() {
    // Clear all timers
    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
      this.queueTimer = null;
    }
    
    // Clear all data
    this.clearAllData();
    
    // Note: EventBus subscriptions are automatically cleaned up 
    // when the instance is destroyed due to closure scoping
  }
}

export default PlanningDataModel;
