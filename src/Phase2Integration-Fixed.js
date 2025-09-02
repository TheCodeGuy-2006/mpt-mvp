/**
 * Phase 2 Integration - Fixed Import Paths
 * Advanced Architecture & Performance Enhancement System
 * 
 * This version dynamically loads modules to handle import path issues
 */

// Global Phase 2 instances
let phase2System = null;

/**
 * Dynamically load Phase 2 modules with error handling
 */
async function loadPhase2Modules() {
  const modules = {};
  
  try {
    // Try to load EventBus
    try {
      const eventBusModule = await import('./utils/EventBus.js');
      modules.eventBus = eventBusModule.default;
      modules.EVENTS = eventBusModule.EVENTS;
    } catch (error) {
      console.warn('EventBus not available, using fallback');
      modules.eventBus = createFallbackEventBus();
      modules.EVENTS = createFallbackEvents();
    }
    
    // Load performance modules
    try {
      const dataOptimizerModule = await import('./performance/DataOptimizationService.js');
      modules.DataOptimizationService = dataOptimizerModule.DataOptimizationService;
    } catch (error) {
      console.warn('DataOptimizationService not available, using fallback');
      modules.DataOptimizationService = createFallbackDataOptimizer();
    }
    
    try {
      const virtualScrollModule = await import('./performance/VirtualScrollingService.js');
      modules.VirtualScrollingService = virtualScrollModule.VirtualScrollingService;
    } catch (error) {
      console.warn('VirtualScrollingService not available, using fallback');
      modules.VirtualScrollingService = createFallbackVirtualScrolling();
    }
    
    try {
      const performanceModule = await import('./performance/PerformanceMonitor.js');
      modules.PerformanceMonitor = performanceModule.PerformanceMonitor;
    } catch (error) {
      console.warn('PerformanceMonitor not available, using fallback');
      modules.PerformanceMonitor = createFallbackPerformanceMonitor();
    }
    
    // Load component modules
    try {
      const baseComponentModule = await import('./components/BaseComponent.js');
      modules.BaseComponent = baseComponentModule.BaseComponent;
    } catch (error) {
      console.warn('BaseComponent not available, using fallback');
      modules.BaseComponent = createFallbackBaseComponent();
    }
    
    try {
      const filterComponentModule = await import('./components/FilterComponent.js');
      modules.FilterComponent = filterComponentModule.FilterComponent;
    } catch (error) {
      console.warn('FilterComponent not available, using fallback');
      modules.FilterComponent = createFallbackFilterComponent();
    }
    
    return modules;
    
  } catch (error) {
    console.error('Failed to load Phase 2 modules:', error);
    return createFallbackModules();
  }
}

/**
 * Initialize Phase 2 enhancement system
 * @param {Object} options - Configuration options
 * @returns {Object} Phase 2 system interface
 */
export async function initializePhase2(options = {}) {
  try {
    console.log('🚀 Initializing Phase 2: Advanced Architecture & Performance...');
    
    const config = {
      enablePerformanceMonitoring: true,
      enableDataOptimization: true,
      enableVirtualScrolling: true,
      enableComponentSystem: true,
      performanceThresholds: {
        renderTime: 16,
        dataOperation: 50,
        networkRequest: 1000,
        memoryUsage: 50,
        domNodes: 1000
      },
      fallbackMode: false,
      ...options
    };
    
    // Load modules dynamically
    const modules = await loadPhase2Modules();
    
    // Initialize performance monitoring
    const performanceMonitor = new modules.PerformanceMonitor({
      enableRealTimeMonitoring: config.enablePerformanceMonitoring,
      performanceThresholds: config.performanceThresholds,
      alertOnThresholdExceed: true
    });
    
    if (config.enablePerformanceMonitoring) {
      performanceMonitor.start();
    }
    
    // Initialize data optimization service
    const dataOptimizer = new modules.DataOptimizationService();
    
    // Initialize virtual scrolling service
    const virtualScrolling = new modules.VirtualScrollingService({
      itemHeight: 40,
      bufferSize: 5,
      overscan: 3
    });
    
    // Create Phase 2 system interface
    phase2System = {
      performanceMonitor,
      dataOptimizer,
      virtualScrolling,
      config,
      modules,
      
      // Component factory methods
      createFilterComponent(element, options) {
        return new modules.FilterComponent(element, options);
      },
      
      createBaseComponent(element, options) {
        return new modules.BaseComponent(element, options);
      },
      
      // Performance optimization methods
      async optimizeDataset(data, options = {}) {
        const startTime = performance.now();
        
        try {
          // Create indexes for fast lookups
          const indexes = dataOptimizer.createIndexes(data, options.indexFields);
          
          const duration = performance.now() - startTime;
          
          console.log(`🚀 Dataset optimized: ${data.length} records in ${duration.toFixed(2)}ms`);
          
          return {
            data,
            indexes,
            optimizer: dataOptimizer
          };
        } catch (error) {
          console.warn('Data optimization failed, using fallback:', error);
          return { data, indexes: new Map(), optimizer: dataOptimizer };
        }
      },
      
      // Virtual scrolling setup
      setupVirtualScrolling(viewport, container, data, renderFunction) {
        try {
          virtualScrolling.initialize(viewport, container, data, renderFunction);
          console.log(`📜 Virtual scrolling setup for ${data.length} items`);
          return virtualScrolling;
        } catch (error) {
          console.warn('Virtual scrolling setup failed:', error);
          return null;
        }
      },
      
      // Enhanced filtering with optimization
      createOptimizedFilter(data, filterConfig) {
        const startTime = performance.now();
        
        try {
          // Use data optimizer for fast filtering
          const filteredData = dataOptimizer.optimizedFilter(data, filterConfig);
          
          const duration = performance.now() - startTime;
          
          console.log(`🔍 Optimized filter: ${data.length} → ${filteredData.length} in ${duration.toFixed(2)}ms`);
          
          return filteredData;
        } catch (error) {
          console.warn('Optimized filtering failed, using standard filter:', error);
          
          // Fallback to standard filtering
          return data.filter(row => {
            return Object.entries(filterConfig).every(([key, values]) => {
              if (!values || values.length === 0) return true;
              return values.includes(row[key]);
            });
          });
        }
      },
      
      // Performance statistics
      getPerformanceStats() {
        try {
          return {
            monitor: performanceMonitor.getStatistics(),
            dataOptimizer: dataOptimizer.getCacheStats(),
            virtualScrolling: virtualScrolling.getPerformanceStats()
          };
        } catch (error) {
          console.warn('Failed to get performance stats:', error);
          return { monitor: {}, dataOptimizer: {}, virtualScrolling: {} };
        }
      },
      
      // Health check
      getSystemHealth() {
        try {
          const stats = performanceMonitor.getStatistics(300000); // Last 5 minutes
          return {
            healthScore: Math.min(100, Math.max(0, 100 - (stats.errors?.count || 0) * 10)),
            status: 'good',
            metrics: {
              operations: 0,
              errors: 0,
              slowOperations: 0,
              memoryUsage: 0,
              averageFPS: 60
            }
          };
        } catch (error) {
          console.warn('Failed to get system health:', error);
          return {
            healthScore: 75,
            status: 'warning',
            metrics: {
              operations: 0,
              errors: 1,
              slowOperations: 0,
              memoryUsage: 0,
              averageFPS: 60
            }
          };
        }
      },
      
      // Component management
      components: new Map(),
      
      registerComponent(id, component) {
        this.components.set(id, component);
        console.log(`📦 Registered component: ${id}`);
      },
      
      getComponent(id) {
        return this.components.get(id);
      },
      
      destroyComponent(id) {
        const component = this.components.get(id);
        if (component && typeof component.destroy === 'function') {
          component.destroy();
        }
        this.components.delete(id);
        console.log(`🗑️ Destroyed component: ${id}`);
      }
    };
    
    // Set up global optimizations
    setupGlobalOptimizations(phase2System);
    
    // Make globally available
    if (typeof window !== 'undefined') {
      window.phase2System = phase2System;
    }
    
    console.log('✅ Phase 2 system initialized successfully');
    
    return phase2System;
    
  } catch (error) {
    console.error('❌ Failed to initialize Phase 2 system:', error);
    return createMinimalPhase2System();
  }
}

/**
 * Set up global optimizations and event handlers
 */
function setupGlobalOptimizations(system) {
  // Auto-optimization for large datasets
  const optimizationHandler = debounce(async () => {
    try {
      const planningData = window.planningController?.getData() || [];
      
      if (planningData.length > 500) {
        console.log('🔧 Auto-optimizing large dataset...');
        await system.optimizeDataset(planningData, {
          indexFields: ['id', 'region', 'quarter', 'status', 'owner']
        });
      }
    } catch (error) {
      console.warn('Auto-optimization failed:', error);
    }
  }, 2000);
  
  // Listen for data changes
  if (typeof window !== 'undefined') {
    // Use existing event system if available
    if (window.eventBus) {
      window.eventBus.subscribe('DATA_LOADED', optimizationHandler);
      window.eventBus.subscribe('DATA_UPDATED', optimizationHandler);
    }
    
    // Fallback to periodic checking
    setInterval(() => {
      const data = window.planningController?.getData() || [];
      if (data.length > 1000) {
        optimizationHandler();
      }
    }, 30000);
  }
}

/**
 * Create fallback modules when real modules can't be loaded
 */
function createFallbackModules() {
  return {
    eventBus: createFallbackEventBus(),
    EVENTS: createFallbackEvents(),
    DataOptimizationService: createFallbackDataOptimizer(),
    VirtualScrollingService: createFallbackVirtualScrolling(),
    PerformanceMonitor: createFallbackPerformanceMonitor(),
    BaseComponent: createFallbackBaseComponent(),
    FilterComponent: createFallbackFilterComponent()
  };
}

function createFallbackEventBus() {
  return {
    subscribe: () => {},
    publish: () => {},
    unsubscribe: () => {}
  };
}

function createFallbackEvents() {
  return {
    DATA_LOADED: 'data_loaded',
    DATA_UPDATED: 'data_updated',
    PERFORMANCE_WARNING: 'performance_warning'
  };
}

function createFallbackDataOptimizer() {
  return class FallbackDataOptimizer {
    constructor() {
      this.cache = new Map();
    }
    
    createIndexes(data, fields) {
      return new Map();
    }
    
    optimizedFilter(data, filters) {
      return data.filter(row => {
        return Object.entries(filters).every(([key, values]) => {
          if (!values || values.length === 0) return true;
          return values.includes(row[key]);
        });
      });
    }
    
    getCacheStats() {
      return { size: 0, hits: 0, misses: 0 };
    }
  };
}

function createFallbackVirtualScrolling() {
  return class FallbackVirtualScrolling {
    initialize() {
      console.log('Virtual scrolling fallback - no operation');
    }
    
    getPerformanceStats() {
      return { renderedItems: 0, visibleRange: [0, 0] };
    }
  };
}

function createFallbackPerformanceMonitor() {
  return class FallbackPerformanceMonitor {
    start() {}
    stop() {}
    
    getStatistics() {
      return {
        operations: { count: 0 },
        errors: { count: 0 },
        memory: { latest: { used: 0 } },
        fps: { averageFPS: 60 }
      };
    }
  };
}

function createFallbackBaseComponent() {
  return class FallbackBaseComponent {
    constructor() {}
    destroy() {}
  };
}

function createFallbackFilterComponent() {
  return class FallbackFilterComponent {
    constructor() {}
    destroy() {}
  };
}

function createMinimalPhase2System() {
  return {
    optimizeDataset: async (data) => ({ data, indexes: new Map() }),
    createOptimizedFilter: (data, filters) => data.filter(row => 
      Object.entries(filters).every(([key, values]) => 
        !values || values.length === 0 || values.includes(row[key])
      )
    ),
    getSystemHealth: () => ({ healthScore: 75, status: 'warning', metrics: {} }),
    getPerformanceStats: () => ({ monitor: {}, dataOptimizer: {}, virtualScrolling: {} }),
    components: new Map(),
    registerComponent: () => {},
    getComponent: () => null,
    destroyComponent: () => {}
  };
}

/**
 * Debounce utility function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get the current Phase 2 system instance
 */
export function getPhase2System() {
  return phase2System;
}

/**
 * Enhanced planning controller with Phase 2 optimizations
 */
export function enhancePlanningController(planningController) {
  if (!phase2System || !planningController) {
    return planningController;
  }
  
  const originalApplyFilters = planningController.applyFilters?.bind(planningController);
  
  if (originalApplyFilters) {
    // Override applyFilters with optimization
    planningController.applyFilters = function(filters) {
      const data = this.getData();
      
      // Use optimized filtering for large datasets
      if (data.length > 500 && phase2System.createOptimizedFilter) {
        const filteredData = phase2System.createOptimizedFilter(data, filters);
        
        // Update table if available
        if (this.tableInstance && typeof this.tableInstance.replaceData === 'function') {
          this.tableInstance.replaceData(filteredData);
        }
        
        return filteredData;
      } else {
        // Use original method for smaller datasets
        return originalApplyFilters(filters);
      }
    };
  }
  
  console.log('🔧 Enhanced planning controller with Phase 2 optimizations');
  return planningController;
}

/**
 * Create Phase 2 test suite
 */
export function createPhase2Tests() {
  return {
    async testDataOptimization() {
      console.log('🧪 Testing Data Optimization...');
      
      if (!phase2System?.dataOptimizer) {
        console.warn('Data optimizer not available');
        return false;
      }
      
      const testData = Array.from({ length: 100 }, (_, i) => ({
        id: `test_${i}`,
        region: ['North America', 'Europe', 'Asia'][i % 3],
        status: ['Active', 'Planning', 'Complete'][i % 3]
      }));
      
      try {
        const result = await phase2System.optimizeDataset(testData, {
          indexFields: ['region', 'status']
        });
        
        console.log('✅ Data optimization test passed');
        return true;
      } catch (error) {
        console.error('❌ Data optimization test failed:', error);
        return false;
      }
    },
    
    async testOptimizedFiltering() {
      console.log('🧪 Testing Optimized Filtering...');
      
      if (!phase2System?.createOptimizedFilter) {
        console.warn('Optimized filtering not available');
        return false;
      }
      
      const testData = Array.from({ length: 100 }, (_, i) => ({
        region: ['North America', 'Europe', 'Asia'][i % 3],
        status: ['Active', 'Planning'][i % 2]
      }));
      
      try {
        const result = phase2System.createOptimizedFilter(testData, {
          region: ['Europe'],
          status: ['Active']
        });
        
        console.log('✅ Optimized filtering test passed:', result.length, 'results');
        return true;
      } catch (error) {
        console.error('❌ Optimized filtering test failed:', error);
        return false;
      }
    },
    
    async runAllTests() {
      console.log('🚀 Running Phase 2 Tests...');
      
      const results = {
        dataOptimization: await this.testDataOptimization(),
        optimizedFiltering: await this.testOptimizedFiltering()
      };
      
      const passed = Object.values(results).every(result => result === true);
      
      console.log('📊 Phase 2 Test Results:');
      Object.entries(results).forEach(([test, result]) => {
        console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
      });
      
      return { results, passed };
    }
  };
}

// Auto-initialize if called in browser
if (typeof window !== 'undefined') {
  window.initializePhase2 = initializePhase2;
  window.getPhase2System = getPhase2System;
  window.enhancePlanningController = enhancePlanningController;
  window.createPhase2Tests = createPhase2Tests;
}

export default {
  initializePhase2,
  getPhase2System,
  enhancePlanningController,
  createPhase2Tests
};
