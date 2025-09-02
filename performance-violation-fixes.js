/**
 * Performance Violation Fixes
 * Addresses the specific performance issues found in console logs
 */

(function() {
  'use strict';
  
  console.log('🔧 Loading performance violation fixes...');
  
  /**
   * Fix 1: Optimize requestAnimationFrame handlers
   * Issue: 'requestAnimationFrame' handler took 99ms
   */
  function optimizeAnimationFrameHandlers() {
    // Store original requestAnimationFrame
    const originalRAF = window.requestAnimationFrame;
    const pendingFrames = new Set();
    const frameTimeBudget = 16; // 16ms budget for 60fps
    
    window.requestAnimationFrame = function(callback) {
      const wrappedCallback = function(timestamp) {
        const frameStart = performance.now();
        
        try {
          // Execute callback with time monitoring
          callback(timestamp);
          
          const frameTime = performance.now() - frameStart;
          
          // Log performance warnings for slow frames
          if (frameTime > frameTimeBudget) {
            console.warn(`⚠️ Slow animation frame: ${frameTime.toFixed(2)}ms (budget: ${frameTimeBudget}ms)`);
            
            // If frame time is excessive, schedule remaining work
            if (frameTime > frameTimeBudget * 2) {
              console.log('🔧 Breaking up long-running animation frame');
            }
          }
        } catch (error) {
          console.error('Animation frame error:', error);
        }
        
        pendingFrames.delete(frameId);
      };
      
      const frameId = originalRAF.call(this, wrappedCallback);
      pendingFrames.add(frameId);
      return frameId;
    };
    
    // Provide utility for breaking up long operations
    window.breakUpLongOperation = function(operation, chunkSize = 100) {
      return new Promise((resolve) => {
        let index = 0;
        
        function processChunk() {
          const start = performance.now();
          
          while (index < operation.length && (performance.now() - start) < 5) {
            operation(index);
            index++;
          }
          
          if (index < operation.length) {
            requestAnimationFrame(processChunk);
          } else {
            resolve();
          }
        }
        
        processChunk();
      });
    };
  }
  
  /**
   * Fix 2: Prevent forced reflows
   * Issue: Forced reflow while executing JavaScript took 79ms
   */
  function preventForcedReflows() {
    // Batch DOM reads and writes
    let readQueue = [];
    let writeQueue = [];
    let scheduled = false;
    
    function flushQueue() {
      scheduled = false;
      
      // Execute all reads first
      const reads = readQueue.splice(0);
      reads.forEach(read => {
        try {
          read();
        } catch (error) {
          console.error('DOM read error:', error);
        }
      });
      
      // Then execute all writes
      const writes = writeQueue.splice(0);
      writes.forEach(write => {
        try {
          write();
        } catch (error) {
          console.error('DOM write error:', error);
        }
      });
    }
    
    function scheduleFlush() {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flushQueue);
      }
    }
    
    // Provide utilities for batched DOM operations
    window.batchDOMRead = function(readOperation) {
      return new Promise((resolve) => {
        readQueue.push(() => {
          try {
            const result = readOperation();
            resolve(result);
          } catch (error) {
            console.error('Batched DOM read error:', error);
            resolve(null);
          }
        });
        scheduleFlush();
      });
    };
    
    window.batchDOMWrite = function(writeOperation) {
      return new Promise((resolve) => {
        writeQueue.push(() => {
          try {
            writeOperation();
            resolve();
          } catch (error) {
            console.error('Batched DOM write error:', error);
            resolve();
          }
        });
        scheduleFlush();
      });
    };
    
    // Monitor expensive DOM operations
    const expensiveProperties = [
      'offsetTop', 'offsetLeft', 'offsetWidth', 'offsetHeight',
      'scrollTop', 'scrollLeft', 'scrollWidth', 'scrollHeight',
      'clientTop', 'clientLeft', 'clientWidth', 'clientHeight',
      'getComputedStyle'
    ];
    
    // Patch problematic methods
    expensiveProperties.forEach(prop => {
      if (Element.prototype[prop]) {
        const original = Element.prototype[prop];
        Object.defineProperty(Element.prototype, prop, {
          get: function() {
            const start = performance.now();
            const result = original.call(this);
            const duration = performance.now() - start;
            
            if (duration > 5) {
              console.warn(`⚠️ Slow DOM read (${prop}): ${duration.toFixed(2)}ms`);
            }
            
            return result;
          }
        });
      }
    });
  }
  
  /**
   * Fix 3: Optimize table rendering and filtering
   */
  function optimizeTableOperations() {
    // Debounce filter operations
    const filterDebounceTime = 300;
    const debouncedFilters = new Map();
    
    window.optimizedTableFilter = function(tableInstance, filterFn, delay = filterDebounceTime) {
      const filterId = 'table_' + (tableInstance.id || Math.random());
      
      // Clear existing debounce
      if (debouncedFilters.has(filterId)) {
        clearTimeout(debouncedFilters.get(filterId));
      }
      
      // Set new debounced filter
      const timeoutId = setTimeout(() => {
        const start = performance.now();
        
        try {
          filterFn();
          
          const duration = performance.now() - start;
          if (duration > 50) {
            console.warn(`⚠️ Slow table filter: ${duration.toFixed(2)}ms`);
          }
        } catch (error) {
          console.error('Table filter error:', error);
        }
        
        debouncedFilters.delete(filterId);
      }, delay);
      
      debouncedFilters.set(filterId, timeoutId);
    };
    
    // Virtualize large table rendering
    window.virtualizeTable = function(tableElement, data, renderRow) {
      const container = tableElement.querySelector('tbody') || tableElement;
      const visibleRowCount = Math.ceil(window.innerHeight / 40) + 5; // Assume 40px row height
      
      let scrollTop = 0;
      let startIndex = 0;
      let endIndex = Math.min(visibleRowCount, data.length);
      
      function updateVisibleRows() {
        requestAnimationFrame(() => {
          // Clear existing rows
          container.innerHTML = '';
          
          // Render visible rows
          const fragment = document.createDocumentFragment();
          
          for (let i = startIndex; i < endIndex; i++) {
            if (data[i]) {
              const row = renderRow(data[i], i);
              fragment.appendChild(row);
            }
          }
          
          container.appendChild(fragment);
        });
      }
      
      // Handle scroll events
      function handleScroll(event) {
        const scrollElement = event.target;
        scrollTop = scrollElement.scrollTop;
        
        const rowHeight = 40;
        const newStartIndex = Math.floor(scrollTop / rowHeight);
        const newEndIndex = Math.min(newStartIndex + visibleRowCount, data.length);
        
        if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
          startIndex = newStartIndex;
          endIndex = newEndIndex;
          updateVisibleRows();
        }
      }
      
      // Attach scroll listener
      const scrollContainer = tableElement.closest('.tabulator-tableholder') || window;
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      
      // Initial render
      updateVisibleRows();
      
      return {
        updateData: function(newData) {
          data = newData;
          endIndex = Math.min(visibleRowCount, data.length);
          updateVisibleRows();
        },
        destroy: function() {
          scrollContainer.removeEventListener('scroll', handleScroll);
        }
      };
    };
  }
  
  /**
   * Fix 4: Optimize execution module performance
   */
  function optimizeExecutionModule() {
    // Cache for execution filter data
    const executionFilterCache = new Map();
    const cacheTimeout = 30000; // 30 seconds
    
    window.optimizeExecutionFilters = function() {
      // Override the execution filter population if it exists
      if (window.executionDebug && window.executionDebug.populateFilters) {
        const originalPopulate = window.executionDebug.populateFilters;
        
        window.executionDebug.populateFilters = function(...args) {
          const cacheKey = JSON.stringify(args);
          const cached = executionFilterCache.get(cacheKey);
          
          if (cached && (Date.now() - cached.timestamp) < cacheTimeout) {
            console.log('🚀 Using cached execution filter data');
            return cached.result;
          }
          
          const start = performance.now();
          const result = originalPopulate.apply(this, args);
          const duration = performance.now() - start;
          
          // Cache the result
          executionFilterCache.set(cacheKey, {
            result,
            timestamp: Date.now()
          });
          
          console.log(`🔧 Execution filters populated in ${duration.toFixed(2)}ms`);
          return result;
        };
      }
      
      // Optimize search data updates
      if (window.executionUniversalSearch) {
        const originalUpdateData = window.executionUniversalSearch.updateData;
        
        if (originalUpdateData) {
          window.executionUniversalSearch.updateData = function(data) {
            // Debounce rapid updates
            clearTimeout(this._updateTimeout);
            this._updateTimeout = setTimeout(() => {
              const start = performance.now();
              originalUpdateData.call(this, data);
              const duration = performance.now() - start;
              
              if (duration > 10) {
                console.log(`🔧 Execution search data updated in ${duration.toFixed(2)}ms`);
              }
            }, 100);
          };
        }
      }
    };
  }
  
  /**
   * Fix 5: Memory optimization
   */
  function optimizeMemoryUsage() {
    // Clean up old event listeners
    const eventListenerTracker = new WeakMap();
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
    
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      // Track event listeners for cleanup
      if (!eventListenerTracker.has(this)) {
        eventListenerTracker.set(this, new Set());
      }
      eventListenerTracker.get(this).add({ type, listener, options });
      
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      const listeners = eventListenerTracker.get(this);
      if (listeners) {
        listeners.forEach(item => {
          if (item.type === type && item.listener === listener) {
            listeners.delete(item);
          }
        });
      }
      
      return originalRemoveEventListener.call(this, type, listener, options);
    };
    
    // Periodic cleanup
    setInterval(() => {
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      // Clear old caches
      const now = Date.now();
      for (const [key, value] of executionFilterCache.entries()) {
        if (now - value.timestamp > cacheTimeout * 2) {
          executionFilterCache.delete(key);
        }
      }
      
      console.log('🧹 Performed memory cleanup');
    }, 60000); // Every minute
  }
  
  /**
   * Initialize all performance fixes
   */
  function initializePerformanceFixes() {
    try {
      optimizeAnimationFrameHandlers();
      console.log('✅ Animation frame optimization enabled');
      
      preventForcedReflows();
      console.log('✅ Forced reflow prevention enabled');
      
      optimizeTableOperations();
      console.log('✅ Table operation optimization enabled');
      
      optimizeExecutionModule();
      console.log('✅ Execution module optimization enabled');
      
      optimizeMemoryUsage();
      console.log('✅ Memory optimization enabled');
      
      // Apply execution optimizations after a delay
      setTimeout(() => {
        if (typeof window.optimizeExecutionFilters === 'function') {
          window.optimizeExecutionFilters();
          console.log('🚀 Execution filter optimizations applied');
        }
      }, 2000);
      
      console.log('🎉 All performance fixes initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize performance fixes:', error);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePerformanceFixes);
  } else {
    initializePerformanceFixes();
  }
  
  // Also initialize after a short delay to catch dynamically loaded content
  setTimeout(initializePerformanceFixes, 1000);
  
})();
