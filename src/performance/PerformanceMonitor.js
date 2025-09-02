/**
 * PerformanceMonitor - Real-time performance monitoring and optimization
 * Implements Observer pattern for performance tracking
 * 
 * SOLID Principle: Single Responsibility - handles only performance monitoring
 * Pattern: Observer, Strategy for different monitoring strategies
 */

import eventBus, { EVENTS } from '../utils/EventBus.js';

export class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableRealTimeMonitoring: true,
      performanceThresholds: {
        renderTime: 16,        // 60fps budget
        dataOperation: 50,     // Database operations
        networkRequest: 1000,  // Network requests
        memoryUsage: 50,       // MB
        domNodes: 1000         // DOM node count
      },
      sampleRate: 0.1,         // Sample 10% of operations
      maxHistoryEntries: 1000,
      enableMemoryMonitoring: true,
      enableNetworkMonitoring: true,
      enableDOMMonitoring: true,
      alertOnThresholdExceed: true,
      ...options
    };
    
    this.metrics = {
      operations: [],
      memory: [],
      network: [],
      dom: [],
      fps: [],
      errors: []
    };
    
    this.isMonitoring = false;
    this.perfObserver = null;
    this.memoryTimer = null;
    this.fpsCounter = null;
    
    this.initializeEventListeners();
  }
  
  /**
   * Initialize event listeners for performance monitoring
   * @private
   */
  initializeEventListeners() {
    // Listen for performance measurements from other components
    eventBus.subscribe(EVENTS.PERFORMANCE_MEASURE, (data) => {
      this.recordOperation(data);
    });
    
    // Listen for performance warnings
    eventBus.subscribe(EVENTS.PERFORMANCE_WARNING, (data) => {
      this.handlePerformanceWarning(data);
    });
    
    // Listen for errors
    eventBus.subscribe(EVENTS.DATA_ERROR, (data) => {
      this.recordError(data);
    });
  }
  
  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    if (this.options.enableRealTimeMonitoring) {
      this.startPerformanceObserver();
      
      if (this.options.enableMemoryMonitoring) {
        this.startMemoryMonitoring();
      }
      
      if (this.options.enableNetworkMonitoring) {
        this.startNetworkMonitoring();
      }
      
      if (this.options.enableDOMMonitoring) {
        this.startDOMMonitoring();
      }
      
      this.startFPSMonitoring();
    }
    
    console.log('🔍 Performance monitoring started');
    
    eventBus.publish(EVENTS.UI_LOADING_END, {
      component: 'performance_monitor',
      status: 'started'
    });
  }
  
  /**
   * Stop performance monitoring
   */
  stop() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.perfObserver) {
      this.perfObserver.disconnect();
      this.perfObserver = null;
    }
    
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = null;
    }
    
    if (this.fpsCounter) {
      this.fpsCounter.stop();
      this.fpsCounter = null;
    }
    
    console.log('🔍 Performance monitoring stopped');
  }
  
  /**
   * Start Performance Observer for browser metrics
   * @private
   */
  startPerformanceObserver() {
    if (!window.PerformanceObserver) {
      console.warn('PerformanceObserver not supported');
      return;
    }
    
    try {
      this.perfObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => this.processPerformanceEntry(entry));
      });
      
      // Observe different types of performance entries
      const entryTypes = ['measure', 'navigation', 'resource', 'paint'];
      
      entryTypes.forEach(type => {
        try {
          this.perfObserver.observe({ entryTypes: [type] });
        } catch (error) {
          console.warn(`Cannot observe ${type} entries:`, error);
        }
      });
      
    } catch (error) {
      console.warn('Failed to start PerformanceObserver:', error);
    }
  }
  
  /**
   * Process performance entry from browser
   * @param {PerformanceEntry} entry - Performance entry
   * @private
   */
  processPerformanceEntry(entry) {
    // Sample entries to avoid overwhelming the system
    if (Math.random() > this.options.sampleRate) return;
    
    const data = {
      name: entry.name,
      type: entry.entryType,
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: Date.now()
    };
    
    switch (entry.entryType) {
      case 'measure':
        this.recordOperation({
          operation: entry.name,
          duration: entry.duration,
          source: 'browser_measure'
        });
        break;
        
      case 'navigation':
        this.recordNetworkMetric({
          type: 'navigation',
          duration: entry.loadEventEnd - entry.navigationStart,
          details: {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
            domComplete: entry.domComplete - entry.navigationStart,
            loadComplete: entry.loadEventEnd - entry.navigationStart
          }
        });
        break;
        
      case 'resource':
        if (entry.duration > 100) { // Only track slow resources
          this.recordNetworkMetric({
            type: 'resource',
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0
          });
        }
        break;
        
      case 'paint':
        this.recordOperation({
          operation: `paint_${entry.name}`,
          duration: entry.startTime,
          source: 'browser_paint'
        });
        break;
    }
  }
  
  /**
   * Start memory usage monitoring
   * @private
   */
  startMemoryMonitoring() {
    if (!window.performance.memory) {
      console.warn('Memory monitoring not supported');
      return;
    }
    
    this.memoryTimer = setInterval(() => {
      const memory = window.performance.memory;
      const memoryData = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
        timestamp: Date.now()
      };
      
      this.recordMemoryMetric(memoryData);
      
      // Check for memory threshold
      if (memoryData.used > this.options.performanceThresholds.memoryUsage) {
        this.handlePerformanceWarning({
          operation: 'memory_usage',
          value: memoryData.used,
          threshold: this.options.performanceThresholds.memoryUsage,
          message: `Memory usage exceeded threshold: ${memoryData.used}MB`
        });
      }
    }, 5000); // Check every 5 seconds
  }
  
  /**
   * Start network monitoring
   * @private
   */
  startNetworkMonitoring() {
    // Override fetch to monitor network requests
    if (window.fetch && !window.fetch._monitored) {
      const originalFetch = window.fetch;
      
      window.fetch = async function(...args) {
        const startTime = performance.now();
        const url = args[0];
        
        try {
          const response = await originalFetch.apply(this, args);
          const duration = performance.now() - startTime;
          
          eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
            operation: 'network_request',
            duration,
            url: typeof url === 'string' ? url : url.url,
            status: response.status,
            source: 'network_monitor'
          });
          
          return response;
        } catch (error) {
          const duration = performance.now() - startTime;
          
          eventBus.publish(EVENTS.DATA_ERROR, {
            source: 'network_monitor',
            error: error.message,
            operation: 'fetch',
            url: typeof url === 'string' ? url : url.url,
            duration
          });
          
          throw error;
        }
      };
      
      window.fetch._monitored = true;
    }
  }
  
  /**
   * Start DOM monitoring
   * @private
   */
  startDOMMonitoring() {
    if (!window.MutationObserver) {
      console.warn('DOM monitoring not supported');
      return;
    }
    
    let domChangeCount = 0;
    let domTimer = null;
    
    const observer = new MutationObserver((mutations) => {
      domChangeCount += mutations.length;
      
      // Debounce DOM measurements
      clearTimeout(domTimer);
      domTimer = setTimeout(() => {
        const domMetrics = {
          nodeCount: document.querySelectorAll('*').length,
          changes: domChangeCount,
          timestamp: Date.now()
        };
        
        this.recordDOMMetric(domMetrics);
        
        // Check DOM node threshold
        if (domMetrics.nodeCount > this.options.performanceThresholds.domNodes) {
          this.handlePerformanceWarning({
            operation: 'dom_nodes',
            value: domMetrics.nodeCount,
            threshold: this.options.performanceThresholds.domNodes,
            message: `DOM node count exceeded threshold: ${domMetrics.nodeCount}`
          });
        }
        
        domChangeCount = 0;
      }, 1000);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
    
    this.domObserver = observer;
  }
  
  /**
   * Start FPS monitoring
   * @private
   */
  startFPSMonitoring() {
    let frames = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        
        this.recordFPSMetric({
          fps,
          timestamp: Date.now()
        });
        
        // Check FPS threshold (assuming 60fps target)
        if (fps < 30) {
          this.handlePerformanceWarning({
            operation: 'fps',
            value: fps,
            threshold: 30,
            message: `Low FPS detected: ${fps}fps`
          });
        }
        
        frames = 0;
        lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  /**
   * Record operation performance metric
   * @param {Object} data - Performance data
   */
  recordOperation(data) {
    const metric = {
      operation: data.operation,
      duration: data.duration,
      source: data.source || 'unknown',
      timestamp: data.timestamp || Date.now(),
      ...data
    };
    
    this.addMetric('operations', metric);
    
    // Check operation threshold
    if (data.duration > this.getThresholdForOperation(data.operation)) {
      this.handlePerformanceWarning({
        operation: data.operation,
        duration: data.duration,
        threshold: this.getThresholdForOperation(data.operation),
        message: `Operation '${data.operation}' exceeded threshold: ${data.duration.toFixed(2)}ms`
      });
    }
  }
  
  /**
   * Record memory metric
   * @param {Object} data - Memory data
   */
  recordMemoryMetric(data) {
    this.addMetric('memory', data);
  }
  
  /**
   * Record network metric
   * @param {Object} data - Network data
   */
  recordNetworkMetric(data) {
    this.addMetric('network', data);
  }
  
  /**
   * Record DOM metric
   * @param {Object} data - DOM data
   */
  recordDOMMetric(data) {
    this.addMetric('dom', data);
  }
  
  /**
   * Record FPS metric
   * @param {Object} data - FPS data
   */
  recordFPSMetric(data) {
    this.addMetric('fps', data);
  }
  
  /**
   * Record error
   * @param {Object} data - Error data
   */
  recordError(data) {
    const error = {
      source: data.source,
      error: data.error,
      operation: data.operation,
      timestamp: data.timestamp || Date.now(),
      ...data
    };
    
    this.addMetric('errors', error);
  }
  
  /**
   * Add metric to history with size management
   * @param {string} category - Metric category
   * @param {Object} data - Metric data
   * @private
   */
  addMetric(category, data) {
    if (!this.metrics[category]) {
      this.metrics[category] = [];
    }
    
    this.metrics[category].push(data);
    
    // Limit history size
    if (this.metrics[category].length > this.options.maxHistoryEntries) {
      this.metrics[category].shift();
    }
  }
  
  /**
   * Get performance threshold for operation
   * @param {string} operation - Operation name
   * @returns {number} Threshold value
   * @private
   */
  getThresholdForOperation(operation) {
    if (operation.includes('render') || operation.includes('paint')) {
      return this.options.performanceThresholds.renderTime;
    } else if (operation.includes('network') || operation.includes('fetch')) {
      return this.options.performanceThresholds.networkRequest;
    } else {
      return this.options.performanceThresholds.dataOperation;
    }
  }
  
  /**
   * Handle performance warning
   * @param {Object} warning - Warning data
   * @private
   */
  handlePerformanceWarning(warning) {
    console.warn('⚠️ Performance Warning:', warning);
    
    if (this.options.alertOnThresholdExceed) {
      eventBus.publish(EVENTS.PERFORMANCE_WARNING, warning);
    }
    
    // Record warning as error for tracking
    this.recordError({
      source: 'performance_monitor',
      error: warning.message,
      operation: warning.operation,
      severity: 'warning',
      threshold: warning.threshold,
      value: warning.value || warning.duration
    });
  }
  
  /**
   * Get performance statistics
   * @param {number} timeWindow - Time window in milliseconds (default: last hour)
   * @returns {Object} Performance statistics
   */
  getStatistics(timeWindow = 3600000) {
    const cutoffTime = Date.now() - timeWindow;
    
    const stats = {
      operations: this.getOperationStats(cutoffTime),
      memory: this.getMemoryStats(cutoffTime),
      network: this.getNetworkStats(cutoffTime),
      dom: this.getDOMStats(cutoffTime),
      fps: this.getFPSStats(cutoffTime),
      errors: this.getErrorStats(cutoffTime),
      summary: this.getSummaryStats(cutoffTime)
    };
    
    return stats;
  }
  
  /**
   * Get operation statistics
   * @param {number} cutoffTime - Cutoff timestamp
   * @returns {Object} Operation stats
   * @private
   */
  getOperationStats(cutoffTime) {
    const operations = this.metrics.operations.filter(op => op.timestamp >= cutoffTime);
    
    if (operations.length === 0) {
      return { count: 0, averageDuration: 0, slowestOperation: null };
    }
    
    const durations = operations.map(op => op.duration);
    const slowest = operations.reduce((slowest, op) => 
      op.duration > slowest.duration ? op : slowest);
    
    return {
      count: operations.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      slowestOperation: slowest,
      operationTypes: this.groupByField(operations, 'operation')
    };
  }
  
  /**
   * Get memory statistics
   * @param {number} cutoffTime - Cutoff timestamp
   * @returns {Object} Memory stats
   * @private
   */
  getMemoryStats(cutoffTime) {
    const memory = this.metrics.memory.filter(m => m.timestamp >= cutoffTime);
    
    if (memory.length === 0) {
      return { count: 0, averageUsage: 0, peakUsage: 0 };
    }
    
    const usages = memory.map(m => m.used);
    
    return {
      count: memory.length,
      averageUsage: usages.reduce((sum, u) => sum + u, 0) / usages.length,
      minUsage: Math.min(...usages),
      maxUsage: Math.max(...usages),
      peakUsage: Math.max(...usages),
      latest: memory[memory.length - 1]
    };
  }
  
  /**
   * Get network statistics
   * @param {number} cutoffTime - Cutoff timestamp
   * @returns {Object} Network stats
   * @private
   */
  getNetworkStats(cutoffTime) {
    const network = this.metrics.network.filter(n => n.timestamp >= cutoffTime);
    
    if (network.length === 0) {
      return { count: 0, averageDuration: 0, totalSize: 0 };
    }
    
    const durations = network.map(n => n.duration);
    const sizes = network.map(n => n.size || 0);
    
    return {
      count: network.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      totalSize: sizes.reduce((sum, s) => sum + s, 0),
      slowestRequest: network.reduce((slowest, req) => 
        req.duration > slowest.duration ? req : slowest)
    };
  }
  
  /**
   * Get DOM statistics
   * @param {number} cutoffTime - Cutoff timestamp
   * @returns {Object} DOM stats
   * @private
   */
  getDOMStats(cutoffTime) {
    const dom = this.metrics.dom.filter(d => d.timestamp >= cutoffTime);
    
    if (dom.length === 0) {
      return { count: 0, averageNodes: 0, totalChanges: 0 };
    }
    
    const nodes = dom.map(d => d.nodeCount);
    const changes = dom.map(d => d.changes);
    
    return {
      count: dom.length,
      averageNodes: nodes.reduce((sum, n) => sum + n, 0) / nodes.length,
      maxNodes: Math.max(...nodes),
      totalChanges: changes.reduce((sum, c) => sum + c, 0),
      latest: dom[dom.length - 1]
    };
  }
  
  /**
   * Get FPS statistics
   * @param {number} cutoffTime - Cutoff timestamp
   * @returns {Object} FPS stats
   * @private
   */
  getFPSStats(cutoffTime) {
    const fps = this.metrics.fps.filter(f => f.timestamp >= cutoffTime);
    
    if (fps.length === 0) {
      return { count: 0, averageFPS: 0, minFPS: 0 };
    }
    
    const fpsValues = fps.map(f => f.fps);
    
    return {
      count: fps.length,
      averageFPS: fpsValues.reduce((sum, f) => sum + f, 0) / fpsValues.length,
      minFPS: Math.min(...fpsValues),
      maxFPS: Math.max(...fpsValues),
      latest: fps[fps.length - 1]
    };
  }
  
  /**
   * Get error statistics
   * @param {number} cutoffTime - Cutoff timestamp
   * @returns {Object} Error stats
   * @private
   */
  getErrorStats(cutoffTime) {
    const errors = this.metrics.errors.filter(e => e.timestamp >= cutoffTime);
    
    return {
      count: errors.length,
      errorSources: this.groupByField(errors, 'source'),
      errorTypes: this.groupByField(errors, 'operation'),
      recentErrors: errors.slice(-10)
    };
  }
  
  /**
   * Get summary statistics
   * @param {number} cutoffTime - Cutoff timestamp
   * @returns {Object} Summary stats
   * @private
   */
  getSummaryStats(cutoffTime) {
    const operations = this.metrics.operations.filter(op => op.timestamp >= cutoffTime);
    const errors = this.metrics.errors.filter(e => e.timestamp >= cutoffTime);
    
    const slowOperations = operations.filter(op => 
      op.duration > this.getThresholdForOperation(op.operation));
    
    return {
      totalOperations: operations.length,
      slowOperations: slowOperations.length,
      slowOperationRate: operations.length > 0 ? 
        (slowOperations.length / operations.length) * 100 : 0,
      totalErrors: errors.length,
      errorRate: operations.length > 0 ? 
        (errors.length / operations.length) * 100 : 0,
      healthScore: this.calculateHealthScore(operations, errors)
    };
  }
  
  /**
   * Calculate system health score (0-100)
   * @param {Array} operations - Operations in time window
   * @param {Array} errors - Errors in time window
   * @returns {number} Health score
   * @private
   */
  calculateHealthScore(operations, errors) {
    if (operations.length === 0) return 100;
    
    const slowOperations = operations.filter(op => 
      op.duration > this.getThresholdForOperation(op.operation));
    
    const slowRate = slowOperations.length / operations.length;
    const errorRate = errors.length / operations.length;
    
    // Score based on performance and error rates
    const performanceScore = Math.max(0, 100 - (slowRate * 100));
    const reliabilityScore = Math.max(0, 100 - (errorRate * 200));
    
    return Math.round((performanceScore + reliabilityScore) / 2);
  }
  
  /**
   * Group array by field
   * @param {Array} array - Array to group
   * @param {string} field - Field to group by
   * @returns {Object} Grouped data
   * @private
   */
  groupByField(array, field) {
    return array.reduce((groups, item) => {
      const key = item[field] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics() {
    Object.keys(this.metrics).forEach(category => {
      this.metrics[category] = [];
    });
    
    console.log('🧹 Performance metrics cleared');
  }
  
  /**
   * Export metrics to JSON
   * @param {number} timeWindow - Time window to export
   * @returns {string} JSON string
   */
  exportMetrics(timeWindow = 3600000) {
    const cutoffTime = Date.now() - timeWindow;
    
    const exportData = {
      timestamp: Date.now(),
      timeWindow,
      metrics: {},
      statistics: this.getStatistics(timeWindow)
    };
    
    Object.entries(this.metrics).forEach(([category, data]) => {
      exportData.metrics[category] = data.filter(item => item.timestamp >= cutoffTime);
    });
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }
    
    this.clearMetrics();
    
    console.log('🧹 Performance monitor destroyed');
  }
}

export default PerformanceMonitor;
