/**
 * PlanningController - Manages planning operations and coordinates between model and views
 * Implements Single Responsibility Principle - handles only planning business logic
 * Follows Observer pattern via EventBus for loose coupling
 */

import eventBus, { EVENTS } from '../utils/EventBus.js';
import PlanningDataModel from '../models/PlanningDataModel.js';

export class PlanningController {
  constructor() {
    this.model = new PlanningDataModel();
    this.tableInstance = null;
    this.currentFilters = {};
    this.isInitialized = false;
    
    // Initialize event listeners
    this.initializeEventListeners();
  }
  
  /**
   * Initialize event listeners for coordinating between components
   */
  initializeEventListeners() {
    // Listen for data updates from the model
    eventBus.subscribe(EVENTS.DATA_UPDATED, (data) => {
      if (data.source === 'planning') {
        this.handleDataUpdate(data);
      }
    });
    
    // Listen for filter changes from UI
    eventBus.subscribe(EVENTS.UI_FILTER_CHANGED, (filterData) => {
      this.handleFilterChange(filterData);
    });
    
    // Listen for data refresh requests
    eventBus.subscribe(EVENTS.PLANNING_DATA_REFRESH, () => {
      this.refreshTableData();
    });
    
    // Listen for performance warnings
    eventBus.subscribe(EVENTS.PERFORMANCE_WARNING, (warning) => {
      if (warning.operation === 'filter_planning_data') {
        console.warn('Planning filter performance warning:', warning);
      }
    });
  }
  
  /**
   * Initialize the planning system with data and table instance
   * @param {Array} data - Initial planning data
   * @param {Object} tableInstance - Tabulator table instance
   */
  async initialize(data = [], tableInstance = null) {
    try {
      eventBus.publish(EVENTS.UI_LOADING_START, { component: 'planning' });
      
      // Set the data model
      this.model.setData(data);
      
      // Set table instance reference
      this.tableInstance = tableInstance;
      
      // Make globally available for backward compatibility
      if (typeof window !== 'undefined') {
        window.planningDataStore = this.model;
        window.planningController = this;
        if (tableInstance) {
          window.planningTableInstance = tableInstance;
        }
      }
      
      this.isInitialized = true;
      
      eventBus.publish(EVENTS.UI_LOADING_END, { component: 'planning' });
      
      console.log('Planning controller initialized with', data.length, 'records');
      
    } catch (error) {
      console.error('Failed to initialize planning controller:', error);
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'planning',
        error: error.message,
        operation: 'initialize'
      });
      throw error;
    }
  }
  
  /**
   * Load new data into the planning system
   * @param {Array} data - New planning data
   */
  async loadData(data) {
    try {
      eventBus.publish(EVENTS.UI_LOADING_START, { component: 'planning-data' });
      
      this.model.setData(data);
      await this.refreshTableData();
      
      eventBus.publish(EVENTS.UI_LOADING_END, { component: 'planning-data' });
      
    } catch (error) {
      console.error('Failed to load planning data:', error);
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'planning',
        error: error.message,
        operation: 'load_data'
      });
    }
  }
  
  /**
   * Apply filters to the planning data
   * @param {Object} filters - Filter configuration
   * @returns {Array} Filtered data
   */
  applyFilters(filters) {
    this.currentFilters = { ...filters };
    
    const startTime = performance.now();
    const filteredData = this.model.applyFilters(filters);
    const duration = performance.now() - startTime;
    
    // Update table if available
    if (this.tableInstance && typeof this.tableInstance.replaceData === 'function') {
      this.tableInstance.replaceData(filteredData);
    }
    
    // Publish filter applied event
    eventBus.publish(EVENTS.EXECUTION_FILTER_APPLIED, {
      source: 'planning',
      filters,
      resultCount: filteredData.length,
      duration
    });
    
    return filteredData;
  }
  
  /**
   * Add a new campaign
   * @param {Object} campaignData - Campaign data
   * @returns {Object} Created campaign
   */
  addCampaign(campaignData) {
    try {
      const campaign = this.model.addRow(campaignData);
      
      // Refresh table data to show the new campaign
      this.refreshTableData();
      
      return campaign;
    } catch (error) {
      console.error('Failed to add campaign:', error);
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'planning',
        error: error.message,
        operation: 'add_campaign'
      });
      throw error;
    }
  }
  
  /**
   * Update a campaign
   * @param {string} campaignId - Campaign ID
   * @param {Object} updates - Updates to apply
   * @returns {boolean} Success status
   */
  updateCampaign(campaignId, updates) {
    try {
      const success = this.model.updateRow(campaignId, updates);
      
      if (success) {
        // Refresh table data to show updates
        this.refreshTableData();
      }
      
      return success;
    } catch (error) {
      console.error('Failed to update campaign:', error);
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'planning',
        error: error.message,
        operation: 'update_campaign'
      });
      return false;
    }
  }
  
  /**
   * Delete a campaign (soft delete)
   * @param {string} campaignId - Campaign ID
   * @returns {boolean} Success status
   */
  deleteCampaign(campaignId) {
    try {
      const success = this.model.deleteRow(campaignId);
      
      if (success) {
        // Refresh table data to hide deleted campaign
        this.refreshTableData();
      }
      
      return success;
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'planning',
        error: error.message,
        operation: 'delete_campaign'
      });
      return false;
    }
  }
  
  /**
   * Restore a deleted campaign
   * @param {string} campaignId - Campaign ID
   * @returns {boolean} Success status
   */
  restoreCampaign(campaignId) {
    try {
      const success = this.model.restoreRow(campaignId);
      
      if (success) {
        // Refresh table data to show restored campaign
        this.refreshTableData();
      }
      
      return success;
    } catch (error) {
      console.error('Failed to restore campaign:', error);
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'planning',
        error: error.message,
        operation: 'restore_campaign'
      });
      return false;
    }
  }
  
  /**
   * Get planning data for other components (e.g., execution, ROI)
   * @param {boolean} includeDeleted - Whether to include soft-deleted rows
   * @returns {Array} Planning data
   */
  getData(includeDeleted = false) {
    return includeDeleted ? this.model.getMasterData() : this.model.getData();
  }
  
  /**
   * Get filtered data
   * @returns {Array} Currently filtered data
   */
  getFilteredData() {
    return this.model.getFilteredData();
  }
  
  /**
   * Get deleted campaigns
   * @returns {Array} Soft-deleted campaigns
   */
  getDeletedCampaigns() {
    return this.model.getDeletedRows();
  }
  
  /**
   * Search campaigns by description keywords
   * @param {string} searchTerm - Search term
   * @returns {Array} Matching campaigns
   */
  searchByDescription(searchTerm) {
    const keywords = searchTerm.trim().split(/\s+/).filter(Boolean);
    const filters = { ...this.currentFilters };
    
    if (keywords.length > 0) {
      filters.descriptionKeyword = keywords;
    } else {
      delete filters.descriptionKeyword;
    }
    
    return this.applyFilters(filters);
  }
  
  /**
   * Get unique values for a field (for filter options)
   * @param {string} fieldName - Field to get unique values for
   * @returns {Array} Unique values
   */
  getUniqueValues(fieldName) {
    const data = this.model.getData();
    const values = new Set();
    
    data.forEach(row => {
      const value = row[fieldName];
      if (value !== null && value !== undefined && value !== '') {
        values.add(value);
      }
    });
    
    return Array.from(values).sort();
  }
  
  /**
   * Get planning statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const modelStats = this.model.getStats();
    
    return {
      ...modelStats,
      isInitialized: this.isInitialized,
      hasTableInstance: !!this.tableInstance,
      currentFilterCount: Object.keys(this.currentFilters).length
    };
  }
  
  /**
   * Handle data updates from the model
   * @param {Object} updateData - Update information
   * @private
   */
  handleDataUpdate(updateData) {
    // Re-apply current filters when data changes
    if (Object.keys(this.currentFilters).length > 0) {
      this.applyFilters(this.currentFilters);
    } else {
      this.refreshTableData();
    }
    
    // Notify other components that planning data has changed
    eventBus.publish(EVENTS.CHART_REFRESH_NEEDED, {
      source: 'planning',
      reason: updateData.action
    });
  }
  
  /**
   * Handle filter changes from UI components
   * @param {Object} filterData - Filter change information
   * @private
   */
  handleFilterChange(filterData) {
    if (filterData.source === 'planning' || filterData.global) {
      this.applyFilters(filterData.filters);
    }
  }
  
  /**
   * Refresh table data with current filtered data
   * @private
   */
  async refreshTableData() {
    if (!this.tableInstance || typeof this.tableInstance.replaceData !== 'function') {
      return;
    }
    
    try {
      const data = this.model.getFilteredData();
      
      // Use requestAnimationFrame for smooth UI updates
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          this.tableInstance.replaceData(data);
          resolve();
        });
      });
      
    } catch (error) {
      console.error('Failed to refresh table data:', error);
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'planning',
        error: error.message,
        operation: 'refresh_table'
      });
    }
  }
  
  /**
   * Clear all planning data
   */
  clearData() {
    this.model.clearAllData();
    this.currentFilters = {};
    
    if (this.tableInstance) {
      this.tableInstance.clearData();
    }
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.model.destroy();
    this.tableInstance = null;
    this.currentFilters = {};
    this.isInitialized = false;
    
    // Clear global references
    if (typeof window !== 'undefined') {
      window.planningDataStore = null;
      window.planningController = null;
    }
  }
}

export default PlanningController;
