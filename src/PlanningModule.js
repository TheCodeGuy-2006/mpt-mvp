/**
 * Planning Module Integration
 * Connects the new modular architecture with existing code
 * Provides backward compatibility during transition period
 */

import eventBus, { EVENTS } from './utils/EventBus.js';
import PlanningController from './controllers/PlanningController.js';
import PlanningService from './services/PlanningService.js';

// Global planning module instance
let planningModule = null;

/**
 * Initialize the planning module with new architecture
 * @param {Array} initialData - Initial planning data
 * @param {Object} tableInstance - Tabulator instance
 * @returns {Object} Planning module interface
 */
export async function initializePlanningModule(initialData = [], tableInstance = null) {
  try {
    console.log('Initializing planning module with new architecture...');
    
    // Create service and controller instances
    const service = new PlanningService();
    const controller = new PlanningController();
    
    // Initialize controller with data
    await controller.initialize(initialData, tableInstance);
    
    // Create module interface
    planningModule = {
      controller,
      service,
      
      // Public API methods for backward compatibility
      async loadData(options) {
        const data = await service.loadData(options);
        await controller.loadData(data);
        return data;
      },
      
      getData(includeDeleted = false) {
        return controller.getData(includeDeleted);
      },
      
      getFilteredData() {
        return controller.getFilteredData();
      },
      
      applyFilters(filters) {
        return controller.applyFilters(filters);
      },
      
      addCampaign(campaignData) {
        return controller.addCampaign(campaignData);
      },
      
      updateCampaign(campaignId, updates) {
        return controller.updateCampaign(campaignId, updates);
      },
      
      deleteCampaign(campaignId) {
        return controller.deleteCampaign(campaignId);
      },
      
      restoreCampaign(campaignId) {
        return controller.restoreCampaign(campaignId);
      },
      
      searchByDescription(searchTerm) {
        return controller.searchByDescription(searchTerm);
      },
      
      getUniqueValues(fieldName) {
        return controller.getUniqueValues(fieldName);
      },
      
      exportToCSV(options) {
        const data = controller.getFilteredData();
        return service.exportToCSV(data, options);
      },
      
      async importFromCSV(csvData, options) {
        const data = service.importFromCSV(csvData, options);
        await controller.loadData(data);
        return data;
      },
      
      getStats() {
        return controller.getStats();
      },
      
      // Legacy compatibility methods
      getDeletedRows() {
        return controller.getDeletedCampaigns();
      },
      
      deleteRow(rowId) {
        return controller.deleteCampaign(rowId);
      },
      
      restoreRow(rowId) {
        return controller.restoreCampaign(rowId);
      },
      
      permanentlyDeleteRow(rowId) {
        return controller.model.permanentlyDeleteRow(rowId);
      },
      
      addRow(rowData) {
        return controller.addCampaign(rowData);
      },
      
      updateRow(rowId, updates) {
        return controller.updateCampaign(rowId, updates);
      },
      
      clearAllData() {
        controller.clearData();
      },
      
      setData(data) {
        return controller.loadData(data);
      }
    };
    
    // Make globally available for backward compatibility
    if (typeof window !== 'undefined') {
      window.planningModule = planningModule;
      window.planningDataStore = controller.model;
      window.planningController = controller;
      window.planningService = service;
    }
    
    // Set up event logging for debugging (can be disabled in production)
    if (typeof window !== 'undefined' && window.DEBUG_PLANNING) {
      eventBus.setLogging(true);
    }
    
    console.log('Planning module initialized successfully');
    return planningModule;
    
  } catch (error) {
    console.error('Failed to initialize planning module:', error);
    throw error;
  }
}

/**
 * Get the current planning module instance
 * @returns {Object|null} Planning module instance
 */
export function getPlanningModule() {
  return planningModule;
}

/**
 * Legacy initialization function for backward compatibility
 * @param {Array} data - Planning data
 * @param {Object} tableInstance - Table instance
 */
export function initializeLegacyPlanningDataStore(data, tableInstance) {
  console.warn('Using legacy initialization. Consider migrating to initializePlanningModule()');
  return initializePlanningModule(data, tableInstance);
}

/**
 * Helper function to pre-populate planning filters
 * Maintains compatibility with existing code
 */
export function prePopulatePlanningFilters() {
  if (!planningModule) {
    console.warn('Planning module not initialized');
    return;
  }
  
  try {
    const uniqueValues = {
      regions: planningModule.getUniqueValues('region'),
      quarters: planningModule.getUniqueValues('quarter'),
      statuses: planningModule.getUniqueValues('status'),
      programTypes: planningModule.getUniqueValues('programType'),
      strategicPillars: planningModule.getUniqueValues('strategicPillars'),
      owners: planningModule.getUniqueValues('owner'),
      revenuePlays: planningModule.getUniqueValues('revenuePlay'),
      countries: planningModule.getUniqueValues('country')
    };
    
    // Publish event for UI components to update filter options
    eventBus.publish(EVENTS.UI_FILTER_CHANGED, {
      source: 'planning',
      action: 'populate_options',
      uniqueValues
    });
    
    return uniqueValues;
    
  } catch (error) {
    console.error('Failed to pre-populate planning filters:', error);
    return null;
  }
}

/**
 * Migration helper - convert old PlanningDataStore usage to new architecture
 * This function helps during the transition period
 */
export function migrateLegacyCode() {
  if (typeof window === 'undefined') return;
  
  console.log('Setting up legacy compatibility layer...');
  
  // Ensure global references are available
  if (!window.planningDataStore && planningModule) {
    window.planningDataStore = planningModule.controller.model;
  }
  
  // Add legacy methods to window for backward compatibility
  window.initializePlanningDataStore = initializeLegacyPlanningDataStore;
  window.prePopulatePlanningFilters = prePopulatePlanningFilters;
  
  console.log('Legacy compatibility layer ready');
}

// Auto-migrate if we're in a browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', migrateLegacyCode);
  } else {
    migrateLegacyCode();
  }
}

export default {
  initializePlanningModule,
  getPlanningModule,
  prePopulatePlanningFilters,
  migrateLegacyCode,
  eventBus,
  EVENTS
};
