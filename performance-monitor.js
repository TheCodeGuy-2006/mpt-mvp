// Performance Monitor Utility
console.log("Performance monitor loaded");

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.setupObservers();
    this.setupTabulatorOptimizations();
    
    console.log("📊 Performance Monitor initialized");
  }
  
  // Setup Tabulator-specific performance optimizations
  setupTabulatorOptimizations() {
    // Override default Tabulator event handlers to be passive when possible
    if (typeof Tabulator !== 'undefined') {
      console.log("🚀 Applying Tabulator performance optimizations...");
      
      // Disable some expensive Tabulator features globally
      const originalDefaults = Tabulator.prototype.defaultOptions;
      if (originalDefaults) {
        // Apply performance defaults
        Object.assign(originalDefaults, {
          invalidOptionWarnings: false,
          debugInvalidOptions: false,
          tooltips: false, // Disable tooltips for better performance
          downloadRowRange: "visible", // Only download visible rows
        });
        
        console.log("✅ Tabulator defaults optimized for performance");
      }
    }
    
    // Add passive event listeners for better scroll performance
    document.addEventListener('wheel', this.handleWheel.bind(this), { passive: true });
    document.addEventListener('touchstart', this.handleTouch.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleTouch.bind(this), { passive: true });
  }
  
  // Handle wheel events passively
  handleWheel(event) {
    // This is a passive handler - no preventDefault
    // Just monitor for performance if needed
  }
  
  // Handle touch events passively
  handleTouch(event) {
    // This is a passive handler - no preventDefault
    // Just monitor for performance if needed
  }
  
  // Setup performance observers
  setupObservers() {
    // Observe long tasks (>50ms)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
              
              // Show user notification for very long tasks
              if (entry.duration > 200) {
                this.showPerformanceWarning(`Slow operation detected (${entry.duration.toFixed(0)}ms)`);
              }
            }
          });
        });
        
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.log("Long task observer not supported");
      }
      
      // Observe layout shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.value > 0.1) {
              console.warn(`⚠️ Layout shift detected: ${entry.value}`, entry);
            }
          });
        });
        
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        console.log("Layout shift observer not supported");
      }
    }
  }
  
  // Track operation performance
  startTracking(operationName) {
    const startTime = performance.now();
    this.metrics.set(operationName, { startTime, samples: [] });
    
    return {
      end: () => this.endTracking(operationName)
    };
  }
  
  endTracking(operationName) {
    const metric = this.metrics.get(operationName);
    if (!metric) return;
    
    const duration = performance.now() - metric.startTime;
    metric.samples.push(duration);
    
    // Keep only last 10 samples
    if (metric.samples.length > 10) {
      metric.samples = metric.samples.slice(-10);
    }
    
    // Calculate average
    const avg = metric.samples.reduce((a, b) => a + b, 0) / metric.samples.length;
    
    console.log(`📊 ${operationName}: ${duration.toFixed(2)}ms (avg: ${avg.toFixed(2)}ms)`);
    
    // Warn about slow operations
    if (duration > 100) {
      console.warn(`⚠️ Slow ${operationName}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  // Get performance statistics
  getStats() {
    const stats = {};
    this.metrics.forEach((metric, name) => {
      if (metric.samples.length > 0) {
        const avg = metric.samples.reduce((a, b) => a + b, 0) / metric.samples.length;
        const max = Math.max(...metric.samples);
        const min = Math.min(...metric.samples);
        
        stats[name] = { avg, max, min, samples: metric.samples.length };
      }
    });
    
    return stats;
  }
  
  // Monitor memory usage
  getMemoryStats() {
    if (performance.memory) {
      const memory = performance.memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // %
      };
    }
    return null;
  }
  
  // Show performance warning to user
  showPerformanceWarning(message) {
    const existing = document.getElementById("performanceWarning");
    if (existing) return; // Don't spam warnings
    
    const warning = document.createElement("div");
    warning.id = "performanceWarning";
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff9800;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10001;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
    `;
    warning.textContent = `⚠️ ${message}`;
    document.body.appendChild(warning);
    
    setTimeout(() => {
      if (warning.parentNode) {
        warning.remove();
      }
    }, 3000);
  }
  
  // Log performance report
  logReport() {
    console.group("📊 Performance Report");
    
    const stats = this.getStats();
    console.table(stats);
    
    const memory = this.getMemoryStats();
    if (memory) {
      console.log("💾 Memory Usage:", memory);
      
      if (memory.usage > 80) {
        console.warn("⚠️ High memory usage detected");
      }
    }
    
    console.groupEnd();
  }
  
  // Auto-report every 30 seconds
  startAutoReporting() {
    setInterval(() => {
      this.logReport();
    }, 30000);
  }
  
  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create global performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Start auto-reporting
window.performanceMonitor.startAutoReporting();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.performanceMonitor) {
    window.performanceMonitor.cleanup();
  }
});

console.log("✅ Performance monitor ready");
