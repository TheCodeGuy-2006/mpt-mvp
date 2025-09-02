/**
 * VirtualScrollingService - Efficient rendering of large datasets
 * Implements virtual scrolling to handle thousands of rows without performance degradation
 * 
 * SOLID Principle: Single Responsibility - handles only virtual scrolling
 * Performance Pattern: Virtualization, Windowing, Lazy Rendering
 */

import eventBus, { EVENTS } from '../utils/EventBus.js';

export class VirtualScrollingService {
  constructor(options = {}) {
    this.options = {
      itemHeight: 40,           // Height of each row in pixels
      bufferSize: 5,            // Extra items to render above/below viewport
      scrollDebounce: 16,       // Debounce scroll events (60fps)
      overscan: 3,              // Additional items to render for smooth scrolling
      ...options
    };
    
    this.viewport = null;
    this.container = null;
    this.scrollTop = 0;
    this.viewportHeight = 0;
    this.totalItems = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.renderedItems = new Map();
    this.scrollTimer = null;
    this.isScrolling = false;
    
    // Performance tracking
    this.renderCount = 0;
    this.lastRenderTime = 0;
  }
  
  /**
   * Initialize virtual scrolling for a container
   * @param {HTMLElement} viewport - Scrollable viewport element
   * @param {HTMLElement} container - Container for items
   * @param {Array} items - Data items to virtualize
   * @param {Function} renderItem - Function to render each item
   */
  initialize(viewport, container, items, renderItem) {
    this.viewport = viewport;
    this.container = container;
    this.totalItems = items.length;
    this.renderItem = renderItem;
    this.items = items;
    
    this.setupViewport();
    this.setupScrollHandler();
    this.calculateVisibleRange();
    this.renderVisibleItems();
    
    console.log(`🔄 Virtual scrolling initialized for ${items.length} items`);
  }
  
  /**
   * Setup viewport dimensions and styling
   * @private
   */
  setupViewport() {
    if (!this.viewport || !this.container) return;
    
    // Ensure viewport has relative positioning
    if (getComputedStyle(this.viewport).position === 'static') {
      this.viewport.style.position = 'relative';
    }
    
    // Set container height to accommodate all items
    const totalHeight = this.totalItems * this.options.itemHeight;
    this.container.style.height = `${totalHeight}px`;
    this.container.style.position = 'relative';
    
    // Get viewport dimensions
    this.viewportHeight = this.viewport.clientHeight;
    
    // Set up resize observer to handle viewport changes
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.viewport);
    }
  }
  
  /**
   * Setup optimized scroll event handling
   * @private
   */
  setupScrollHandler() {
    if (!this.viewport) return;
    
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    this.viewport.addEventListener('scroll', handleScroll, { passive: true });
    
    // Store reference for cleanup
    this.scrollHandler = handleScroll;
  }
  
  /**
   * Handle scroll events with debouncing and optimization
   * @private
   */
  handleScroll() {
    const newScrollTop = this.viewport.scrollTop;
    
    // Only update if scroll position actually changed
    if (Math.abs(newScrollTop - this.scrollTop) < 1) return;
    
    this.scrollTop = newScrollTop;
    this.isScrolling = true;
    
    // Clear existing scroll timer
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    
    // Calculate new visible range
    this.calculateVisibleRange();
    
    // Render visible items
    this.renderVisibleItems();
    
    // Mark scrolling as finished after debounce period
    this.scrollTimer = setTimeout(() => {
      this.isScrolling = false;
      this.optimizeRenderedItems();
    }, this.options.scrollDebounce * 2);
    
    // Publish scroll event for other components
    eventBus.publish(EVENTS.UI_FILTER_CHANGED, {
      source: 'virtual_scroll',
      scrollTop: this.scrollTop,
      visibleRange: [this.visibleStart, this.visibleEnd]
    });
  }
  
  /**
   * Calculate which items should be visible based on scroll position
   * @private
   */
  calculateVisibleRange() {
    const startIndex = Math.floor(this.scrollTop / this.options.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(this.viewportHeight / this.options.itemHeight),
      this.totalItems - 1
    );
    
    // Add buffer and overscan
    this.visibleStart = Math.max(0, startIndex - this.options.bufferSize - this.options.overscan);
    this.visibleEnd = Math.min(
      this.totalItems - 1,
      endIndex + this.options.bufferSize + this.options.overscan
    );
  }
  
  /**
   * Render only the visible items
   * @private
   */
  renderVisibleItems() {
    const startTime = performance.now();
    let newItemsRendered = 0;
    
    // Remove items that are no longer visible
    this.renderedItems.forEach((element, index) => {
      if (index < this.visibleStart || index > this.visibleEnd) {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        this.renderedItems.delete(index);
      }
    });
    
    // Render visible items that aren't already rendered
    for (let i = this.visibleStart; i <= this.visibleEnd; i++) {
      if (!this.renderedItems.has(i) && this.items[i]) {
        const element = this.createItemElement(i);
        if (element) {
          this.container.appendChild(element);
          this.renderedItems.set(i, element);
          newItemsRendered++;
        }
      }
    }
    
    const duration = performance.now() - startTime;
    this.renderCount++;
    this.lastRenderTime = duration;
    
    // Publish performance metrics for significant renders
    if (newItemsRendered > 10 || duration > 16) {
      eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
        operation: 'virtual_scroll_render',
        duration,
        itemsRendered: newItemsRendered,
        totalRendered: this.renderedItems.size,
        visibleRange: [this.visibleStart, this.visibleEnd]
      });
    }
    
    // Warn if rendering is too slow
    if (duration > 16) {
      eventBus.publish(EVENTS.PERFORMANCE_WARNING, {
        operation: 'virtual_scroll_render',
        duration,
        threshold: 16,
        message: `Virtual scroll rendering exceeded 16ms frame budget`
      });
    }
  }
  
  /**
   * Create DOM element for an item at specific index
   * @param {number} index - Item index
   * @returns {HTMLElement} Created element
   * @private
   */
  createItemElement(index) {
    if (!this.items[index] || !this.renderItem) return null;
    
    try {
      const element = this.renderItem(this.items[index], index);
      
      if (!element) return null;
      
      // Position the element absolutely
      element.style.position = 'absolute';
      element.style.top = `${index * this.options.itemHeight}px`;
      element.style.height = `${this.options.itemHeight}px`;
      element.style.left = '0';
      element.style.right = '0';
      
      // Add data attribute for debugging
      element.setAttribute('data-virtual-index', index);
      
      return element;
      
    } catch (error) {
      console.error(`Error rendering virtual scroll item ${index}:`, error);
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'virtual_scroll',
        error: error.message,
        operation: 'render_item',
        index
      });
      return null;
    }
  }
  
  /**
   * Update the dataset and refresh rendering
   * @param {Array} newItems - Updated items array
   */
  updateItems(newItems) {
    const oldCount = this.totalItems;
    this.items = newItems;
    this.totalItems = newItems.length;
    
    // Update container height
    const totalHeight = this.totalItems * this.options.itemHeight;
    this.container.style.height = `${totalHeight}px`;
    
    // Clear all rendered items if dataset changed significantly
    if (Math.abs(oldCount - this.totalItems) > 100) {
      this.clearRenderedItems();
    }
    
    // Recalculate visible range and re-render
    this.calculateVisibleRange();
    this.renderVisibleItems();
    
    console.log(`🔄 Virtual scroll updated: ${oldCount} → ${this.totalItems} items`);
  }
  
  /**
   * Scroll to a specific item
   * @param {number} index - Item index to scroll to
   * @param {string} behavior - Scroll behavior ('smooth' or 'auto')
   */
  scrollToItem(index, behavior = 'smooth') {
    if (index < 0 || index >= this.totalItems) return;
    
    const targetScrollTop = index * this.options.itemHeight;
    
    this.viewport.scrollTo({
      top: targetScrollTop,
      behavior
    });
  }
  
  /**
   * Scroll to ensure an item is visible
   * @param {number} index - Item index
   */
  scrollIntoView(index) {
    if (index < 0 || index >= this.totalItems) return;
    
    const itemTop = index * this.options.itemHeight;
    const itemBottom = itemTop + this.options.itemHeight;
    const viewportBottom = this.scrollTop + this.viewportHeight;
    
    if (itemTop < this.scrollTop) {
      // Item is above viewport
      this.scrollToItem(index, 'smooth');
    } else if (itemBottom > viewportBottom) {
      // Item is below viewport
      const targetIndex = Math.max(0, index - Math.floor(this.viewportHeight / this.options.itemHeight) + 1);
      this.scrollToItem(targetIndex, 'smooth');
    }
  }
  
  /**
   * Handle viewport resize
   * @private
   */
  handleResize() {
    const newViewportHeight = this.viewport.clientHeight;
    
    if (Math.abs(newViewportHeight - this.viewportHeight) > 10) {
      this.viewportHeight = newViewportHeight;
      this.calculateVisibleRange();
      this.renderVisibleItems();
      
      console.log(`📐 Virtual scroll viewport resized: ${this.viewportHeight}px`);
    }
  }
  
  /**
   * Optimize rendered items during idle time
   * @private
   */
  optimizeRenderedItems() {
    if (this.isScrolling) return;
    
    requestIdleCallback(() => {
      // Remove items that are far outside the visible range
      const cleanupThreshold = this.options.bufferSize * 3;
      
      this.renderedItems.forEach((element, index) => {
        const distanceFromVisible = Math.min(
          Math.abs(index - this.visibleStart),
          Math.abs(index - this.visibleEnd)
        );
        
        if (distanceFromVisible > cleanupThreshold) {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
          this.renderedItems.delete(index);
        }
      });
    });
  }
  
  /**
   * Clear all rendered items
   * @private
   */
  clearRenderedItems() {
    this.renderedItems.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.renderedItems.clear();
  }
  
  /**
   * Get performance statistics
   * @returns {Object} Performance metrics
   */
  getPerformanceStats() {
    return {
      totalItems: this.totalItems,
      renderedItems: this.renderedItems.size,
      visibleRange: [this.visibleStart, this.visibleEnd],
      renderCount: this.renderCount,
      lastRenderTime: this.lastRenderTime,
      averageRenderTime: this.renderCount > 0 ? this.lastRenderTime : 0,
      viewportHeight: this.viewportHeight,
      itemHeight: this.options.itemHeight,
      bufferSize: this.options.bufferSize
    };
  }
  
  /**
   * Clean up resources and event listeners
   */
  destroy() {
    // Remove scroll event listener
    if (this.viewport && this.scrollHandler) {
      this.viewport.removeEventListener('scroll', this.scrollHandler);
    }
    
    // Clean up resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Clear timers
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    
    // Clear rendered items
    this.clearRenderedItems();
    
    // Reset properties
    this.viewport = null;
    this.container = null;
    this.items = null;
    this.renderItem = null;
    
    console.log('🧹 Virtual scrolling service destroyed');
  }
}

export default VirtualScrollingService;
