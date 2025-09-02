/**
 * DataOptimizationService - Advanced data structure optimization
 * Implements efficient indexing and caching for large datasets
 * 
 * SOLID Principle: Single Responsibility - handles only data optimization
 * Performance Pattern: Indexing, Caching, Memoization
 */

import eventBus, { EVENTS } from '../utils/EventBus.js';

export class DataOptimizationService {
  constructor() {
    this.cache = new Map();
    this.indexes = new Map();
    this.memoizedResults = new Map();
    this.maxCacheSize = 1000;
    this.hitCount = 0;
    this.missCount = 0;
  }
  
  /**
   * Create optimized indexes for O(1) lookups instead of O(n) Array.find()
   * @param {Array} data - Dataset to index
   * @param {Array} indexFields - Fields to create indexes for
   */
  createIndexes(data, indexFields = ['id', 'region', 'quarter', 'status', 'owner']) {
    const startTime = performance.now();
    
    // Clear existing indexes
    this.indexes.clear();
    
    // Initialize index maps
    indexFields.forEach(field => {
      this.indexes.set(field, new Map());
      this.indexes.set(`${field}_list`, new Map()); // For multi-value lookups
    });
    
    // Build indexes
    data.forEach((item, index) => {
      indexFields.forEach(field => {
        const value = item[field];
        const fieldIndex = this.indexes.get(field);
        const listIndex = this.indexes.get(`${field}_list`);
        
        // Single value index (last occurrence wins)
        if (value !== null && value !== undefined) {
          fieldIndex.set(value, item);
          
          // Multi-value index (collect all items with this value)
          if (!listIndex.has(value)) {
            listIndex.set(value, []);
          }
          listIndex.get(value).push(item);
        }
      });
    });
    
    const duration = performance.now() - startTime;
    
    // Publish performance metrics
    eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
      operation: 'create_indexes',
      duration,
      recordCount: data.length,
      indexCount: indexFields.length,
      message: `Created ${indexFields.length} indexes for ${data.length} records`
    });
    
    console.log(`📊 Created indexes for ${data.length} records in ${duration.toFixed(2)}ms`);
    
    return this.indexes;
  }
  
  /**
   * Fast lookup by field value using index (O(1) instead of O(n))
   * @param {string} field - Field name
   * @param {*} value - Value to find
   * @returns {Object|null} Found item
   */
  findByField(field, value) {
    const fieldIndex = this.indexes.get(field);
    
    if (!fieldIndex) {
      this.missCount++;
      console.warn(`No index found for field: ${field}`);
      return null;
    }
    
    const result = fieldIndex.get(value);
    
    if (result) {
      this.hitCount++;
      return result;
    } else {
      this.missCount++;
      return null;
    }
  }
  
  /**
   * Fast lookup for multiple items by field value
   * @param {string} field - Field name
   * @param {*} value - Value to find
   * @returns {Array} Found items
   */
  findAllByField(field, value) {
    const listIndex = this.indexes.get(`${field}_list`);
    
    if (!listIndex) {
      this.missCount++;
      console.warn(`No list index found for field: ${field}`);
      return [];
    }
    
    const result = listIndex.get(value) || [];
    
    if (result.length > 0) {
      this.hitCount++;
    } else {
      this.missCount++;
    }
    
    return result;
  }
  
  /**
   * Optimized filtering using indexes when possible
   * @param {Array} data - Original dataset
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered results
   */
  optimizedFilter(data, filters) {
    const startTime = performance.now();
    let results = data;
    
    // Use indexes for single-value filters
    Object.entries(filters).forEach(([field, filterValue]) => {
      if (Array.isArray(filterValue) && filterValue.length === 1) {
        // Single value - use index if available
        const indexed = this.findAllByField(field, filterValue[0]);
        if (indexed.length > 0) {
          results = results.filter(item => indexed.includes(item));
          return;
        }
      }
      
      // Fall back to traditional filtering for complex cases
      if (Array.isArray(filterValue) && filterValue.length > 0) {
        results = results.filter(item => filterValue.includes(item[field]));
      } else if (filterValue !== null && filterValue !== undefined) {
        results = results.filter(item => item[field] === filterValue);
      }
    });
    
    const duration = performance.now() - startTime;
    
    // Cache result if it's significant
    if (results.length > 10) {
      const cacheKey = this.generateCacheKey('filter', filters);
      this.setCache(cacheKey, results);
    }
    
    eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
      operation: 'optimized_filter',
      duration,
      inputCount: data.length,
      outputCount: results.length,
      filterCount: Object.keys(filters).length
    });
    
    return results;
  }
  
  /**
   * Memoized expensive calculations
   * @param {string} operation - Operation name
   * @param {Function} calculationFn - Function to memoize
   * @param {Array} args - Arguments for the function
   * @returns {*} Calculation result
   */
  memoize(operation, calculationFn, ...args) {
    const cacheKey = this.generateCacheKey(operation, args);
    
    if (this.memoizedResults.has(cacheKey)) {
      this.hitCount++;
      return this.memoizedResults.get(cacheKey);
    }
    
    const startTime = performance.now();
    const result = calculationFn(...args);
    const duration = performance.now() - startTime;
    
    // Store in memoization cache
    this.memoizedResults.set(cacheKey, result);
    this.missCount++;
    
    // Cleanup cache if it gets too large
    if (this.memoizedResults.size > this.maxCacheSize) {
      const firstKey = this.memoizedResults.keys().next().value;
      this.memoizedResults.delete(firstKey);
    }
    
    if (duration > 10) {
      eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
        operation: `memoized_${operation}`,
        duration,
        cached: false,
        message: `Expensive calculation cached: ${operation}`
      });
    }
    
    return result;
  }
  
  /**
   * Batch processing for large operations
   * @param {Array} items - Items to process
   * @param {Function} processor - Processing function
   * @param {number} batchSize - Items per batch
   * @returns {Promise<Array>} Processed results
   */
  async batchProcess(items, processor, batchSize = 100) {
    const results = [];
    const totalBatches = Math.ceil(items.length / batchSize);
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      // Process batch
      const batchResults = await new Promise(resolve => {
        requestIdleCallback(() => {
          const processed = batch.map(processor);
          resolve(processed);
        }, { timeout: 100 });
      });
      
      results.push(...batchResults);
      
      // Update progress
      eventBus.publish(EVENTS.UI_LOADING_START, {
        component: 'batch_processing',
        progress: (batchNumber / totalBatches) * 100,
        message: `Processing batch ${batchNumber}/${totalBatches}`
      });
      
      // Yield control to prevent blocking
      if (batchNumber < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    eventBus.publish(EVENTS.UI_LOADING_END, { component: 'batch_processing' });
    
    return results;
  }
  
  /**
   * Get unique values efficiently using sets
   * @param {Array} data - Dataset
   * @param {string} field - Field to get unique values for
   * @returns {Array} Unique values
   */
  getUniqueValues(data, field) {
    const cacheKey = this.generateCacheKey('unique_values', [field, data.length]);
    
    if (this.cache.has(cacheKey)) {
      this.hitCount++;
      return this.cache.get(cacheKey);
    }
    
    const startTime = performance.now();
    const uniqueSet = new Set();
    
    // Use index if available
    const listIndex = this.indexes.get(`${field}_list`);
    if (listIndex) {
      listIndex.keys().forEach(key => uniqueSet.add(key));
    } else {
      // Fall back to manual collection
      data.forEach(item => {
        const value = item[field];
        if (value !== null && value !== undefined && value !== '') {
          uniqueSet.add(value);
        }
      });
    }
    
    const result = Array.from(uniqueSet).sort();
    const duration = performance.now() - startTime;
    
    // Cache the result
    this.setCache(cacheKey, result);
    this.missCount++;
    
    eventBus.publish(EVENTS.PERFORMANCE_MEASURE, {
      operation: 'get_unique_values',
      duration,
      recordCount: data.length,
      uniqueCount: result.length,
      field
    });
    
    return result;
  }
  
  /**
   * Generate cache key from operation and parameters
   * @param {string} operation - Operation name
   * @param {*} params - Parameters
   * @returns {string} Cache key
   */
  generateCacheKey(operation, params) {
    try {
      return `${operation}:${JSON.stringify(params)}`;
    } catch (error) {
      // Fallback for non-serializable objects
      return `${operation}:${String(params)}:${Date.now()}`;
    }
  }
  
  /**
   * Set cache with size management
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   */
  setCache(key, value) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache performance metrics
   */
  getCacheStats() {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;
    
    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      totalRequests,
      hitRate: hitRate.toFixed(2) + '%',
      cacheSize: this.cache.size,
      memoizedSize: this.memoizedResults.size,
      indexCount: this.indexes.size / 2, // Divide by 2 because we have both single and list indexes
      maxCacheSize: this.maxCacheSize
    };
  }
  
  /**
   * Clear all caches and indexes
   */
  clearAll() {
    this.cache.clear();
    this.indexes.clear();
    this.memoizedResults.clear();
    this.hitCount = 0;
    this.missCount = 0;
    
    console.log('🧹 All caches and indexes cleared');
  }
  
  /**
   * Optimize cache settings based on usage patterns
   */
  optimizeCache() {
    const stats = this.getCacheStats();
    
    // Increase cache size if hit rate is low
    if (parseFloat(stats.hitRate) < 70 && this.maxCacheSize < 2000) {
      this.maxCacheSize = Math.min(this.maxCacheSize * 1.5, 2000);
      console.log(`📈 Increased cache size to ${this.maxCacheSize} due to low hit rate`);
    }
    
    // Decrease cache size if memory usage is high and hit rate is good
    if (parseFloat(stats.hitRate) > 90 && this.maxCacheSize > 500) {
      this.maxCacheSize = Math.max(this.maxCacheSize * 0.8, 500);
      console.log(`📉 Decreased cache size to ${this.maxCacheSize} due to high hit rate`);
    }
  }
}

export default DataOptimizationService;
