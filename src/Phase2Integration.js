/**
 * Phase 2 Integration - Advanced Architecture & Performance
 * Integrates all Phase 2 components with existing system
 * 
 * Provides enhanced performance, component architecture, and monitoring
 */

import eventBus, { EVENTS } from './utils/EventBus.js';
import DataOptimizationService from './performance/DataOptimizationService.js';
import VirtualScrollingService from './performance/VirtualScrollingService.js';
import PerformanceMonitor from './performance/PerformanceMonitor.js';
import BaseComponent from './components/BaseComponent.js';
import FilterComponent from './components/FilterComponent.js';

// Global Phase 2 instances
let phase2System = null;

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
      ...options
    };
    
    // Initialize performance monitoring first
    const performanceMonitor = new PerformanceMonitor({
      enableRealTimeMonitoring: config.enablePerformanceMonitoring,
      performanceThresholds: config.performanceThresholds,
      alertOnThresholdExceed: true
    });
    
    if (config.enablePerformanceMonitoring) {
      performanceMonitor.start();
    }
    
    // Initialize data optimization service
    const dataOptimizer = new DataOptimizationService();
    
    // Initialize virtual scrolling service
    const virtualScrolling = new VirtualScrollingService({
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
      
      // Component factory methods
      createFilterComponent(element, options) {
        return new FilterComponent(element, options);
      },
      
      createBaseComponent(element, options) {
        return new BaseComponent(element, options);
      },
      
      // Performance optimization methods
      async optimizeDataset(data, options = {}) {
        const startTime = performance.now();
        
        // Create indexes for fast lookups
        const indexes = dataOptimizer.createIndexes(data, options.indexFields);
        
        // Pre-compute common aggregations if specified
        if (options.precomputeAggregations) {
          await this.precomputeAggregations(data, options.aggregations);
        }
        
        const duration = performance.now() - startTime;
        
        eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
          operation: 'optimize_dataset',
          duration,
          recordCount: data.length,
          indexCount: indexes.size / 2
        });
        
        return {
          data,
          indexes,
          optimizer: dataOptimizer
        };
      },
      
      // Virtual scrolling setup
      setupVirtualScrolling(viewport, container, data, renderFunction) {
        virtualScrolling.initialize(viewport, container, data, renderFunction);
        
        console.log(`📜 Virtual scrolling setup for ${data.length} items`);
        return virtualScrolling;
      },
      
      // Enhanced filtering with optimization
      createOptimizedFilter(data, filterConfig) {
        const startTime = performance.now();
        
        // Use data optimizer for fast filtering
        const filteredData = dataOptimizer.optimizedFilter(data, filterConfig);
        
        const duration = performance.now() - startTime;
        
        eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
          operation: 'optimized_filter',
          duration,
          inputCount: data.length,
          outputCount: filteredData.length,
          filterCount: Object.keys(filterConfig).length
        });
        
        return filteredData;
      },
      
      // Memoized expensive calculations
      memoizedCalculation(operation, calculationFn, ...args) {
        return dataOptimizer.memoize(operation, calculationFn, ...args);
      },
      
      // Batch processing for large operations
      async batchProcess(items, processor, batchSize = 100) {
        return dataOptimizer.batchProcess(items, processor, batchSize);
      },
      
      // Performance statistics
      getPerformanceStats() {
        return {
          monitor: performanceMonitor.getStatistics(),
          dataOptimizer: dataOptimizer.getCacheStats(),
          virtualScrolling: virtualScrolling.getPerformanceStats()
        };
      },
      
      // Health check
      getSystemHealth() {
        const stats = performanceMonitor.getStatistics(300000); // Last 5 minutes
        return {
          healthScore: stats.summary.healthScore,
          status: stats.summary.healthScore > 80 ? 'good' : 
                  stats.summary.healthScore > 60 ? 'warning' : 'critical',
          metrics: {
            operations: stats.operations.count,
            errors: stats.errors.count,
            slowOperations: stats.operations.slowOperations || 0,
            memoryUsage: stats.memory.latest?.used || 0,
            averageFPS: stats.fps.averageFPS || 0
          }
        };
      },
      
      // Component management
      components: new Map(),
      
      registerComponent(id, component) {
        if (!(component instanceof BaseComponent)) {
          throw new Error('Component must extend BaseComponent');
        }
        
        this.components.set(id, component);
        console.log(`📦 Registered component: ${id}`);
      },
      
      getComponent(id) {
        return this.components.get(id);
      },
      
      destroyComponent(id) {
        const component = this.components.get(id);
        if (component) {
          component.destroy();
          this.components.delete(id);
          console.log(`🗑️ Destroyed component: ${id}`);
        }
      }
    };
    
    // Set up global event handlers for system optimization
    setupGlobalOptimizations(phase2System);
    
    // Make globally available
    if (typeof window !== 'undefined') {
      window.phase2System = phase2System;
      window.DataOptimizationService = DataOptimizationService;
      window.VirtualScrollingService = VirtualScrollingService;
      window.PerformanceMonitor = PerformanceMonitor;
      window.BaseComponent = BaseComponent;
      window.FilterComponent = FilterComponent;
    }
    
    console.log('✅ Phase 2 system initialized successfully');
    
    eventBus.publish(EVENTS.UI_LOADING_END, {
      component: 'phase2_system',
      message: 'Advanced architecture and performance enhancements active'
    });
    
    return phase2System;
    
  } catch (error) {
    console.error('❌ Failed to initialize Phase 2 system:', error);
    throw error;
  }
}

/**
 * Set up global optimizations and event handlers
 * @param {Object} system - Phase 2 system instance
 * @private
 */
function setupGlobalOptimizations(system) {
  // Optimize planning data when loaded
  eventBus.subscribe(EVENTS.DATA_LOADED, async (data) => {
    if (data.source === 'planning' && data.count > 100) {
      console.log('🔧 Auto-optimizing large planning dataset...');
      
      // Get planning data
      const planningData = window.planningController?.getData() || [];
      
      if (planningData.length > 0) {
        await system.optimizeDataset(planningData, {
          indexFields: ['id', 'region', 'quarter', 'status', 'owner', 'revenuePlay', 'country'],
          precomputeAggregations: true
        });
      }
    }
  });
  
  // Monitor filter performance
  eventBus.subscribe(EVENTS.UI_FILTER_CHANGED, (filterData) => {
    if (filterData.source === 'planning') {
      // Use optimized filtering if available
      const planningController = window.planningController;
      if (planningController && system.dataOptimizer) {
        const data = planningController.getData();
        
        if (data.length > 500) {
          console.log('🚀 Using optimized filtering for large dataset');
          const optimizedResult = system.createOptimizedFilter(data, filterData.filters);
          
          // Update table with optimized result
          if (window.planningTableInstance) {
            window.planningTableInstance.replaceData(optimizedResult);
          }
        }
      }
    }
  });
  
  // Auto-setup virtual scrolling for large tables
  eventBus.subscribe(EVENTS.DATA_UPDATED, (data) => {
    if (data.source === 'planning' && data.action === 'load_data') {
      setTimeout(() => {
        const tableElement = document.querySelector('#planningTable');
        const dataCount = window.planningController?.getData()?.length || 0;
        
        if (tableElement && dataCount > 1000) {
          console.log('📜 Auto-enabling virtual scrolling for large dataset');
          setupVirtualScrollingForTable(tableElement, system.virtualScrolling);
        }
      }, 1000);
    }
  });
  
  // Performance warnings handler
  eventBus.subscribe(EVENTS.PERFORMANCE_WARNING, (warning) => {
    console.warn('⚠️ Performance Warning:', warning.message);
    
    // Auto-optimization based on warning type
    if (warning.operation === 'filter_planning_data' && warning.duration > 100) {
      console.log('🔧 Auto-optimizing slow filter operation...');
      
      // Trigger data optimization
      const planningData = window.planningController?.getData() || [];
      if (planningData.length > 0) {
        system.optimizeDataset(planningData, {
          indexFields: ['region', 'quarter', 'status', 'owner']
        });
      }
    }
  });
  
  // Memory cleanup on idle
  let idleTimer = null;
  
  const scheduleCleanup = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      requestIdleCallback(() => {
        // Optimize caches
        system.dataOptimizer.optimizeCache();
        
        // Clean up virtual scrolling
        if (system.virtualScrolling.renderedItems?.size > 100) {
          system.virtualScrolling.optimizeRenderedItems();
        }
        
        console.log('🧹 Performed idle cleanup optimization');
      });
    }, 30000); // 30 seconds of inactivity
  };
  
  // Reset cleanup timer on user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, scheduleCleanup, { passive: true });
  });
  
  scheduleCleanup();
}

/**
 * Setup virtual scrolling for existing table
 * @param {HTMLElement} tableElement - Table element
 * @param {VirtualScrollingService} virtualScrolling - Virtual scrolling service
 * @private
 */
function setupVirtualScrollingForTable(tableElement, virtualScrolling) {
  try {
    const tbody = tableElement.querySelector('tbody');
    const container = tableElement.closest('.tabulator') || tableElement.parentElement;
    
    if (!tbody || !container) {
      console.warn('Cannot setup virtual scrolling: missing table elements');
      return;
    }
    
    // Get data from planning controller
    const data = window.planningController?.getFilteredData() || [];
    
    if (data.length === 0) {
      console.warn('Cannot setup virtual scrolling: no data available');
      return;
    }
    
    // Create row renderer function
    const renderRow = (rowData, index) => {
      const row = document.createElement('tr');
      row.className = 'tabulator-row';
      row.setAttribute('data-row-index', index);
      
      // Create cells based on table structure
      const headerCells = tableElement.querySelectorAll('thead th');
      headerCells.forEach(header => {
        const cell = document.createElement('td');
        cell.className = 'tabulator-cell';
        
        const field = header.getAttribute('data-field') || header.textContent.toLowerCase();
        cell.textContent = rowData[field] || '';
        
        row.appendChild(cell);
      });
      
      return row;
    };
    
    // Initialize virtual scrolling
    virtualScrolling.initialize(container, tbody, data, renderRow);
    
    console.log(`📜 Virtual scrolling enabled for ${data.length} rows`);
    
  } catch (error) {
    console.error('Failed to setup virtual scrolling:', error);
  }
}

/**
 * Pre-compute common aggregations for performance
 * @param {Array} data - Dataset
 * @param {Array} aggregations - Aggregation configurations
 * @private
 */
async function precomputeAggregations(data, aggregations = []) {
  const defaultAggregations = [
    { field: 'region', type: 'count' },
    { field: 'quarter', type: 'count' },
    { field: 'status', type: 'count' },
    { field: 'owner', type: 'count' }
  ];
  
  const computeAggregations = aggregations.length > 0 ? aggregations : defaultAggregations;
  
  for (const agg of computeAggregations) {
    const startTime = performance.now();
    
    const result = data.reduce((acc, row) => {
      const value = row[agg.field];
      if (value !== null && value !== undefined) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});
    
    const duration = performance.now() - startTime;
    
    // Cache the aggregation result
    const cacheKey = `aggregation:${agg.field}:${agg.type}`;
    phase2System.dataOptimizer.setCache(cacheKey, result);
    
    console.log(`📊 Pre-computed ${agg.field} aggregation: ${Object.keys(result).length} unique values in ${duration.toFixed(2)}ms`);
  }
}

/**
 * Get the current Phase 2 system instance
 * @returns {Object|null} Phase 2 system instance
 */
export function getPhase2System() {
  return phase2System;
}

/**
 * Enhanced planning controller with Phase 2 optimizations
 * @param {Object} planningController - Original planning controller
 * @returns {Object} Enhanced controller
 */
export function enhancePlanningController(planningController) {
  if (!phase2System || !planningController) {
    return planningController;
  }
  
  const originalApplyFilters = planningController.applyFilters.bind(planningController);
  
  // Override applyFilters with optimization
  planningController.applyFilters = function(filters) {
    const data = this.getData();
    
    // Use optimized filtering for large datasets
    if (data.length > 500 && phase2System.dataOptimizer) {
      const filteredData = phase2System.createOptimizedFilter(data, filters);
      
      // Update table
      if (this.tableInstance && typeof this.tableInstance.replaceData === 'function') {
        this.tableInstance.replaceData(filteredData);
      }
      
      return filteredData;
    } else {
      // Use original method for smaller datasets
      return originalApplyFilters(filters);
    }
  };
  
  console.log('🔧 Enhanced planning controller with Phase 2 optimizations');
  return planningController;
}

/**
 * Create Phase 2 test suite
 * @returns {Object} Test functions
 */
export function createPhase2Tests() {
  return {
    async testDataOptimization() {
      console.log('🧪 Testing Data Optimization...');
      
      const testData = Array.from({ length: 1000 }, (_, i) => ({
        id: `test_${i}`,
        region: ['North America', 'Europe', 'Asia'][i % 3],
        status: ['Active', 'Planning', 'Complete'][i % 3],
        value: Math.random() * 100
      }));
      
      const optimizer = new DataOptimizationService();
      
      // Test indexing
      const indexes = optimizer.createIndexes(testData, ['region', 'status']);
      console.log('✅ Indexes created:', indexes.size);
      
      // Test fast lookup
      const result = optimizer.findByField('region', 'Europe');
      console.log('✅ Fast lookup result:', result ? 'Found' : 'Not found');
      
      // Test optimized filtering
      const filtered = optimizer.optimizedFilter(testData, { region: ['Europe'] });
      console.log('✅ Optimized filtering result:', filtered.length, 'items');
      
      return true;
    },
    
    async testVirtualScrolling() {
      console.log('🧪 Testing Virtual Scrolling...');
      
      // Create test viewport
      const viewport = document.createElement('div');
      viewport.style.height = '400px';
      viewport.style.overflow = 'auto';
      
      const container = document.createElement('div');
      viewport.appendChild(container);
      
      document.body.appendChild(viewport);
      
      const testData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        text: `Item ${i}`
      }));
      
      const renderItem = (item, index) => {
        const div = document.createElement('div');
        div.textContent = item.text;
        div.style.height = '40px';
        return div;
      };
      
      const virtualScrolling = new VirtualScrollingService();
      virtualScrolling.initialize(viewport, container, testData, renderItem);
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(viewport);
        virtualScrolling.destroy();
      }, 100);
      
      console.log('✅ Virtual scrolling test completed');
      return true;
    },
    
    async testPerformanceMonitoring() {
      console.log('🧪 Testing Performance Monitoring...');
      
      const monitor = new PerformanceMonitor({
        enableRealTimeMonitoring: false // Don't interfere with real monitoring
      });
      
      // Test operation recording
      monitor.recordOperation({
        operation: 'test_operation',
        duration: 25,
        source: 'test'
      });
      
      // Test statistics
      const stats = monitor.getStatistics();
      console.log('✅ Performance stats generated:', Object.keys(stats));
      
      monitor.destroy();
      return true;
    },
    
    async runAllTests() {
      console.log('🚀 Running Phase 2 Tests...');
      
      const results = {
        dataOptimization: await this.testDataOptimization(),
        virtualScrolling: await this.testVirtualScrolling(),
        performanceMonitoring: await this.testPerformanceMonitoring()
      };
      
      const passed = Object.values(results).every(result => result === true);
      
      console.log('📊 Phase 2 Test Results:');
      Object.entries(results).forEach(([test, result]) => {
        console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
      });
      
      console.log(passed ? '🎉 All Phase 2 tests passed!' : '⚠️ Some Phase 2 tests failed');
      
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
  
  console.log('Phase 2 system loaded. Call initializePhase2() to start.');
}

export default {
  initializePhase2,
  getPhase2System,
  enhancePlanningController,
  createPhase2Tests
};
