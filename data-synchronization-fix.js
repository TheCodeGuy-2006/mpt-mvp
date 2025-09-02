/**
 * Data Synchronization & Loading Order Fix
 * Resolves race conditions between ROI, Planning, and Execution modules
 */

(function() {
  'use strict';
  
  console.log('🔄 Loading data synchronization fixes...');
  
  // Central data coordination system
  const DataCoordinator = {
    modules: new Map(),
    loadingPromises: new Map(),
    dataReadyCallbacks: new Map(),
    initialized: false,
    
    // Register a module with its data loading functions
    registerModule(name, config) {
      this.modules.set(name, {
        name,
        dataChecker: config.dataChecker,
        initializer: config.initializer,
        dependencies: config.dependencies || [],
        retryCount: 0,
        maxRetries: config.maxRetries || 5,
        isReady: false,
        data: null,
        ...config
      });
      
      console.log(`📦 Registered module: ${name}`);
    },
    
    // Check if a module's data is ready
    async isModuleDataReady(moduleName) {
      const module = this.modules.get(moduleName);
      if (!module) return false;
      
      try {
        const data = await module.dataChecker();
        const isReady = data && (Array.isArray(data) ? data.length > 0 : true);
        
        if (isReady) {
          module.isReady = true;
          module.data = data;
          console.log(`✅ Module data ready: ${moduleName} (${Array.isArray(data) ? data.length : 'object'} items)`);
        }
        
        return isReady;
      } catch (error) {
        console.warn(`⚠️ Error checking ${moduleName} data:`, error);
        return false;
      }
    },
    
    // Wait for specific modules to be ready
    async waitForModules(moduleNames, timeout = 10000) {
      const promises = moduleNames.map(name => this.waitForModule(name, timeout));
      return Promise.all(promises);
    },
    
    // Wait for a single module to be ready
    async waitForModule(moduleName, timeout = 10000) {
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        if (await this.isModuleDataReady(moduleName)) {
          return this.modules.get(moduleName).data;
        }
        
        // Progressive delay
        const elapsed = Date.now() - startTime;
        const delay = Math.min(100 + (elapsed / 10), 500);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      throw new Error(`Timeout waiting for module: ${moduleName}`);
    },
    
    // Initialize modules in dependency order
    async initializeModules() {
      if (this.initialized) return;
      
      console.log('🚀 Starting coordinated module initialization...');
      
      // Sort modules by dependency order
      const sortedModules = this.resolveDependencyOrder();
      
      for (const moduleName of sortedModules) {
        const module = this.modules.get(moduleName);
        
        try {
          // Wait for dependencies first
          if (module.dependencies.length > 0) {
            console.log(`⏳ Waiting for ${moduleName} dependencies: ${module.dependencies.join(', ')}`);
            await this.waitForModules(module.dependencies);
          }
          
          // Initialize the module
          if (module.initializer) {
            console.log(`🔧 Initializing module: ${moduleName}`);
            await module.initializer();
          }
          
          // Verify it's ready
          await this.waitForModule(moduleName, 5000);
          
        } catch (error) {
          console.error(`❌ Failed to initialize ${moduleName}:`, error);
          
          // Try fallback initialization if available
          if (module.fallbackInitializer) {
            try {
              console.log(`🔄 Trying fallback for ${moduleName}...`);
              await module.fallbackInitializer();
            } catch (fallbackError) {
              console.error(`❌ Fallback also failed for ${moduleName}:`, fallbackError);
            }
          }
        }
      }
      
      this.initialized = true;
      console.log('✅ All modules initialized');
      
      // Trigger ready callbacks
      this.triggerReadyCallbacks();
    },
    
    // Resolve dependency order using topological sort
    resolveDependencyOrder() {
      const visited = new Set();
      const visiting = new Set();
      const result = [];
      
      const visit = (moduleName) => {
        if (visiting.has(moduleName)) {
          throw new Error(`Circular dependency detected: ${moduleName}`);
        }
        
        if (visited.has(moduleName)) return;
        
        visiting.add(moduleName);
        
        const module = this.modules.get(moduleName);
        if (module) {
          for (const dep of module.dependencies) {
            if (this.modules.has(dep)) {
              visit(dep);
            }
          }
        }
        
        visiting.delete(moduleName);
        visited.add(moduleName);
        result.push(moduleName);
      };
      
      for (const moduleName of this.modules.keys()) {
        visit(moduleName);
      }
      
      return result;
    },
    
    // Add callback for when all modules are ready
    onReady(callback) {
      if (this.initialized) {
        callback();
      } else {
        if (!this.dataReadyCallbacks.has('global')) {
          this.dataReadyCallbacks.set('global', []);
        }
        this.dataReadyCallbacks.get('global').push(callback);
      }
    },
    
    // Trigger ready callbacks
    triggerReadyCallbacks() {
      const callbacks = this.dataReadyCallbacks.get('global') || [];
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Ready callback error:', error);
        }
      });
      this.dataReadyCallbacks.delete('global');
    }
  };
  
  // Register Planning Module
  DataCoordinator.registerModule('planning', {
    dataChecker: () => {
      // Check multiple sources for planning data
      if (window.planningController && typeof window.planningController.getData === 'function') {
        return window.planningController.getData();
      }
      
      if (window.planningDataStore && typeof window.planningDataStore.getData === 'function') {
        return window.planningDataStore.getData();
      }
      
      if (window.planningTableInstance && typeof window.planningTableInstance.getData === 'function') {
        return window.planningTableInstance.getData();
      }
      
      return [];
    },
    
    initializer: async () => {
      // Wait for planning system to be fully loaded
      let attempts = 0;
      while (attempts < 20) {
        if (window.planningController || window.planningDataStore || window.planningTableInstance) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    },
    
    maxRetries: 10
  });
  
  // Register Execution Module
  DataCoordinator.registerModule('execution', {
    dependencies: ['planning'],
    
    dataChecker: () => {
      // Check multiple sources for execution data
      if (window.executionDataStore && typeof window.executionDataStore.getData === 'function') {
        return window.executionDataStore.getData();
      }
      
      if (window.executionTableInstance && typeof window.executionTableInstance.getData === 'function') {
        return window.executionTableInstance.getData();
      }
      
      // Fallback to direct access
      if (window.executionData && Array.isArray(window.executionData)) {
        return window.executionData;
      }
      
      return [];
    },
    
    initializer: async () => {
      // Wait for execution system to be loaded
      let attempts = 0;
      while (attempts < 20) {
        if (window.executionDataStore || window.executionTableInstance) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    },
    
    maxRetries: 8
  });
  
  // Register ROI Module
  DataCoordinator.registerModule('roi', {
    dependencies: ['planning', 'execution'],
    
    dataChecker: () => {
      // ROI needs both planning and execution data
      const planningData = DataCoordinator.modules.get('planning')?.data || [];
      const executionData = DataCoordinator.modules.get('execution')?.data || [];
      
      return {
        planning: planningData,
        execution: executionData,
        hasData: planningData.length > 0 || executionData.length > 0
      };
    },
    
    initializer: async () => {
      // Initialize ROI only after dependencies are ready
      if (typeof window.initializeRoiFunctionality === 'function') {
        console.log('🔧 Initializing ROI with dependencies ready...');
        
        // Temporarily suppress data loading warnings
        const originalWarn = console.warn;
        const suppressedWarnings = [
          '[ROI] No execution data source available',
          '[ROI CHART] No planning data source available',
          '[ROI CHART] No execution data source available'
        ];
        
        console.warn = function(...args) {
          const message = args.join(' ');
          if (!suppressedWarnings.some(warning => message.includes(warning))) {
            originalWarn.apply(console, args);
          }
        };
        
        try {
          await window.initializeRoiFunctionality();
        } finally {
          // Restore console.warn after a delay
          setTimeout(() => {
            console.warn = originalWarn;
          }, 2000);
        }
      }
    },
    
    fallbackInitializer: async () => {
      console.log('🔄 ROI fallback initialization...');
      
      // Basic ROI initialization without full functionality
      if (document.getElementById('roiRegionFilter')) {
        // Populate basic filters if elements exist
        const filters = [
          'roiRegionFilter', 'roiQuarterFilter', 'roiCountryFilter',
          'roiOwnerFilter', 'roiStatusFilter', 'roiProgramTypeFilter'
        ];
        
        filters.forEach(filterId => {
          const element = document.getElementById(filterId);
          if (element && element.options.length <= 1) {
            // Add placeholder options
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Loading...';
            element.appendChild(option);
          }
        });
      }
    },
    
    maxRetries: 5
  });
  
  // Enhanced data checking functions for ROI module
  function createEnhancedDataGetters() {
    // Enhanced getPlanningData
    const originalGetPlanningData = window.getPlanningData;
    window.getPlanningData = function() {
      const planningModule = DataCoordinator.modules.get('planning');
      if (planningModule && planningModule.isReady && planningModule.data) {
        return planningModule.data;
      }
      
      // Fallback to original function
      if (originalGetPlanningData) {
        return originalGetPlanningData();
      }
      
      return [];
    };
    
    // Enhanced getExecutionData
    const originalGetExecutionData = window.getExecutionData;
    window.getExecutionData = function() {
      const executionModule = DataCoordinator.modules.get('execution');
      if (executionModule && executionModule.isReady && executionModule.data) {
        return executionModule.data;
      }
      
      // Fallback to original function
      if (originalGetExecutionData) {
        return originalGetExecutionData();
      }
      
      return [];
    };
  }
  
  // Enhanced checkForPlanningData for ROI
  function enhanceRoiDataChecking() {
    if (window.checkForPlanningData) {
      const originalCheckForPlanningData = window.checkForPlanningData;
      
      window.checkForPlanningData = async function() {
        try {
          // Use coordinated data checking
          const [planningReady, executionReady] = await Promise.allSettled([
            DataCoordinator.isModuleDataReady('planning'),
            DataCoordinator.isModuleDataReady('execution')
          ]);
          
          if (planningReady.value || executionReady.value) {
            console.log('✅ ROI data sources are ready via coordinator');
            
            // Proceed with original function logic
            if (originalCheckForPlanningData) {
              return originalCheckForPlanningData();
            }
          } else {
            // Wait a bit more and try again
            setTimeout(() => window.checkForPlanningData(), 500);
          }
        } catch (error) {
          console.warn('Enhanced data checking failed, using fallback:', error);
          if (originalCheckForPlanningData) {
            return originalCheckForPlanningData();
          }
        }
      };
    }
  }
  
  // Initialize the coordination system
  function initializeDataCoordination() {
    console.log('🚀 Initializing data coordination system...');
    
    // Create enhanced data getters
    createEnhancedDataGetters();
    
    // Start coordinated initialization after a short delay
    setTimeout(async () => {
      try {
        await DataCoordinator.initializeModules();
        
        // Enhance ROI data checking after coordination
        enhanceRoiDataChecking();
        
        console.log('✅ Data coordination system ready');
        
        // Trigger any pending initializations
        if (window.pendingRoiInit) {
          console.log('🔧 Running pending ROI initialization...');
          window.pendingRoiInit();
          window.pendingRoiInit = null;
        }
        
      } catch (error) {
        console.error('❌ Data coordination failed:', error);
      }
    }, 1000);
    
    // Also try initialization on route changes
    const originalRoute = window.route;
    if (originalRoute) {
      window.route = function(...args) {
        const result = originalRoute.apply(this, args);
        
        // Re-trigger coordination if needed
        setTimeout(() => {
          if (!DataCoordinator.initialized) {
            DataCoordinator.initializeModules();
          }
        }, 500);
        
        return result;
      };
    }
  }
  
  // Suppress repetitive warnings during initialization
  function suppressRepetitiveWarnings() {
    const warningCounts = new Map();
    const originalWarn = console.warn;
    const maxWarningCount = 3;
    
    console.warn = function(...args) {
      const message = args.join(' ');
      
      // Count warnings
      const count = warningCounts.get(message) || 0;
      warningCounts.set(message, count + 1);
      
      // Only show first few instances of repetitive warnings
      if (count < maxWarningCount) {
        originalWarn.apply(console, args);
      } else if (count === maxWarningCount) {
        originalWarn.call(console, `${message} (suppressing further instances)`);
      }
    };
    
    // Reset warning counts periodically
    setInterval(() => {
      warningCounts.clear();
    }, 30000);
  }
  
  // Initialize everything
  function initialize() {
    suppressRepetitiveWarnings();
    initializeDataCoordination();
    
    // Make DataCoordinator globally available for debugging
    window.DataCoordinator = DataCoordinator;
    
    console.log('✅ Data synchronization system loaded');
  }
  
  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
})();
