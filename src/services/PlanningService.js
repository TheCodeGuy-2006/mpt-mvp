/**
 * PlanningService - Handles data persistence and external operations
 * Implements Single Responsibility Principle - handles only data service operations
 * Follows Dependency Inversion - abstracts data source operations
 */

import eventBus, { EVENTS } from '../utils/EventBus.js';

export class PlanningService {
  constructor() {
    this.baseUrl = '/api/planning'; // Configure based on environment
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }
  
  /**
   * Load planning data from server or file
   * @param {Object} options - Load options
   * @returns {Promise<Array>} Planning data
   */
  async loadData(options = {}) {
    try {
      eventBus.publish(EVENTS.UI_LOADING_START, { component: 'planning-service' });
      
      let data = [];
      
      // Check if data is provided directly (e.g., from file upload)
      if (options.data) {
        data = this.processRawData(options.data);
      }
      // Load from CSV file
      else if (options.file) {
        data = await this.loadFromFile(options.file);
      }
      // Load from server API
      else if (options.url || !options.offline) {
        data = await this.loadFromServer(options.url);
      }
      // Load from local storage
      else {
        data = this.loadFromLocalStorage();
      }
      
      // Cache the loaded data
      this.cache.set('planning_data', data);
      
      eventBus.publish(EVENTS.UI_LOADING_END, { component: 'planning-service' });
      eventBus.publish(EVENTS.DATA_LOADED, {
        source: 'planning',
        count: data.length,
        loadedFrom: this.getLoadSource(options)
      });
      
      return data;
      
    } catch (error) {
      eventBus.publish(EVENTS.UI_LOADING_END, { component: 'planning-service' });
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'planning',
        error: error.message,
        operation: 'load_data'
      });
      
      console.error('Failed to load planning data:', error);
      throw error;
    }
  }
  
  /**
   * Save planning data
   * @param {Array} data - Data to save
   * @param {Object} options - Save options
   * @returns {Promise<boolean>} Success status
   */
  async saveData(data, options = {}) {
    try {
      eventBus.publish(EVENTS.UI_LOADING_START, { component: 'planning-save' });
      
      let success = false;
      
      // Save to server
      if (options.url || !options.offline) {
        success = await this.saveToServer(data, options.url);
      }
      // Save to local storage
      else {
        success = this.saveToLocalStorage(data);
      }
      
      // Update cache
      if (success) {
        this.cache.set('planning_data', data);
      }
      
      eventBus.publish(EVENTS.UI_LOADING_END, { component: 'planning-save' });
      
      if (success) {
        eventBus.publish(EVENTS.DATA_UPDATED, {
          source: 'planning',
          action: 'save',
          count: data.length
        });
      }
      
      return success;
      
    } catch (error) {
      eventBus.publish(EVENTS.UI_LOADING_END, { component: 'planning-save' });
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: 'planning',
        error: error.message,
        operation: 'save_data'
      });
      
      console.error('Failed to save planning data:', error);
      throw error;
    }
  }
  
  /**
   * Export data to CSV format
   * @param {Array} data - Data to export
   * @param {Object} options - Export options
   * @returns {string} CSV string
   */
  exportToCSV(data, options = {}) {
    try {
      const {
        includeHeaders = true,
        columns = null,
        delimiter = ',',
        lineBreak = '\n'
      } = options;
      
      if (!Array.isArray(data) || data.length === 0) {
        return '';
      }
      
      // Determine columns to export
      const exportColumns = columns || Object.keys(data[0]);
      
      let csv = '';
      
      // Add headers
      if (includeHeaders) {
        csv += exportColumns.map(col => this.escapeCsvValue(col)).join(delimiter) + lineBreak;
      }
      
      // Add data rows
      data.forEach(row => {
        const values = exportColumns.map(col => {
          const value = row[col];
          return this.escapeCsvValue(value);
        });
        csv += values.join(delimiter) + lineBreak;
      });
      
      return csv;
      
    } catch (error) {
      console.error('Failed to export data to CSV:', error);
      throw error;
    }
  }
  
  /**
   * Import data from CSV format
   * @param {string} csvData - CSV string
   * @param {Object} options - Import options
   * @returns {Array} Parsed data
   */
  importFromCSV(csvData, options = {}) {
    try {
      const {
        hasHeaders = true,
        delimiter = ',',
        skipEmptyLines = true
      } = options;
      
      const lines = csvData.split(/\r?\n/);
      
      if (lines.length === 0) {
        return [];
      }
      
      let headers = null;
      let dataLines = lines;
      
      // Extract headers
      if (hasHeaders && lines.length > 0) {
        headers = this.parseCsvLine(lines[0], delimiter);
        dataLines = lines.slice(1);
      }
      
      // Parse data lines
      const data = [];
      
      dataLines.forEach((line, index) => {
        if (skipEmptyLines && line.trim() === '') {
          return;
        }
        
        const values = this.parseCsvLine(line, delimiter);
        
        if (headers) {
          const row = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          data.push(row);
        } else {
          data.push(values);
        }
      });
      
      return this.processRawData(data);
      
    } catch (error) {
      console.error('Failed to import data from CSV:', error);
      throw error;
    }
  }
  
  /**
   * Load data from a file
   * @param {File} file - File object
   * @returns {Promise<Array>} Parsed data
   * @private
   */
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          let data = [];
          
          if (file.name.toLowerCase().endsWith('.csv')) {
            data = this.importFromCSV(content);
          } else if (file.name.toLowerCase().endsWith('.json')) {
            data = JSON.parse(content);
            data = this.processRawData(data);
          } else {
            throw new Error('Unsupported file format. Please use CSV or JSON.');
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  /**
   * Load data from server
   * @param {string} url - API URL
   * @returns {Promise<Array>} Planning data
   * @private
   */
  async loadFromServer(url = this.baseUrl) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return this.processRawData(data);
  }
  
  /**
   * Save data to server
   * @param {Array} data - Data to save
   * @param {string} url - API URL
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async saveToServer(data, url = this.baseUrl) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    return true;
  }
  
  /**
   * Load data from local storage
   * @returns {Array} Planning data
   * @private
   */
  loadFromLocalStorage() {
    try {
      const storedData = localStorage.getItem('planning_data');
      if (storedData) {
        const data = JSON.parse(storedData);
        return this.processRawData(data);
      }
    } catch (error) {
      console.warn('Failed to load data from local storage:', error);
    }
    
    return [];
  }
  
  /**
   * Save data to local storage
   * @param {Array} data - Data to save
   * @returns {boolean} Success status
   * @private
   */
  saveToLocalStorage(data) {
    try {
      localStorage.setItem('planning_data', JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('Failed to save data to local storage:', error);
      return false;
    }
  }
  
  /**
   * Process raw data to ensure consistency
   * @param {Array} rawData - Raw data array
   * @returns {Array} Processed data
   * @private
   */
  processRawData(rawData) {
    if (!Array.isArray(rawData)) {
      console.warn('Expected array data, got:', typeof rawData);
      return [];
    }
    
    return rawData.map((row, index) => {
      // Ensure each row is an object
      if (typeof row !== 'object' || row === null) {
        console.warn(`Row ${index} is not an object:`, row);
        return {};
      }
      
      // Ensure each row has an ID
      if (!row.id) {
        row.id = `row_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Initialize tracking fields
      row.__modified = false;
      
      // Clean up and validate data types
      Object.keys(row).forEach(key => {
        const value = row[key];
        
        // Convert strings to appropriate types
        if (typeof value === 'string') {
          // Convert boolean strings
          if (value.toLowerCase() === 'true') {
            row[key] = true;
          } else if (value.toLowerCase() === 'false') {
            row[key] = false;
          }
          // Convert number strings (but preserve IDs and text fields)
          else if (!key.toLowerCase().includes('id') && 
                   !key.toLowerCase().includes('name') &&
                   !key.toLowerCase().includes('description') &&
                   /^\d+\.?\d*$/.test(value.trim())) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
              row[key] = num;
            }
          }
        }
      });
      
      return row;
    });
  }
  
  /**
   * Parse a CSV line respecting quoted values
   * @param {string} line - CSV line
   * @param {string} delimiter - Field delimiter
   * @returns {Array} Parsed values
   * @private
   */
  parseCsvLine(line, delimiter = ',') {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    return values;
  }
  
  /**
   * Escape a value for CSV output
   * @param {*} value - Value to escape
   * @returns {string} Escaped value
   * @private
   */
  escapeCsvValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    // Escape if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }
  
  /**
   * Get the source type for loading operation
   * @param {Object} options - Load options
   * @returns {string} Source type
   * @private
   */
  getLoadSource(options) {
    if (options.data) return 'direct';
    if (options.file) return 'file';
    if (options.url || !options.offline) return 'server';
    return 'localStorage';
  }
  
  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
  }
  
  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {*} Cached data
   */
  getCached(key) {
    return this.cache.get(key);
  }
}

export default PlanningService;
