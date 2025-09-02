/**
 * FilterComponent - Manages filter UI and interactions
 * Implements Component pattern with advanced filtering capabilities
 * 
 * SOLID Principle: Single Responsibility - handles only filter UI
 * Component Pattern: Encapsulated filter management with events
 */

import BaseComponent from './BaseComponent.js';
import { EVENTS } from '../utils/EventBus.js';

export class FilterComponent extends BaseComponent {
  constructor(element, options = {}) {
    super(element, options);
    
    this.filters = new Map();
    this.activeFilters = {};
    this.filterElements = new Map();
    this.isApplying = false;
  }
  
  /**
   * Get default options specific to FilterComponent
   */
  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      autoApply: true,           // Apply filters immediately on change
      debounceDelay: 300,        // Debounce delay for text inputs
      showClearButton: true,     // Show clear all filters button
      showFilterCount: true,     // Show active filter count
      enablePresets: true,       // Enable filter presets
      multiSelect: true,         // Allow multiple selections
      caseSensitive: false,      // Case sensitive text filtering
      className: 'filter-component',
      placeholder: 'Search...'
    };
  }
  
  /**
   * Setup DOM structure for filters
   */
  setupDOM() {
    super.setupDOM();
    
    if (!this.element) return;
    
    // Create main filter container
    this.filterContainer = document.createElement('div');
    this.filterContainer.className = 'filter-container';
    
    // Create filter controls
    this.createFilterControls();
    
    // Append to element
    this.element.appendChild(this.filterContainer);
  }
  
  /**
   * Create filter control elements
   * @private
   */
  createFilterControls() {
    // Create header with title and controls
    const header = document.createElement('div');
    header.className = 'filter-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Filters';
    title.className = 'filter-title';
    
    header.appendChild(title);
    
    // Add filter count if enabled
    if (this.options.showFilterCount) {
      this.filterCount = document.createElement('span');
      this.filterCount.className = 'filter-count';
      this.filterCount.textContent = '0 active';
      header.appendChild(this.filterCount);
    }
    
    // Add clear button if enabled
    if (this.options.showClearButton) {
      const clearButton = document.createElement('button');
      clearButton.className = 'filter-clear-btn';
      clearButton.textContent = 'Clear All';
      clearButton.addEventListener('click', () => this.clearAllFilters());
      header.appendChild(clearButton);
    }
    
    this.filterContainer.appendChild(header);
    
    // Create filters container
    this.filtersElement = document.createElement('div');
    this.filtersElement.className = 'filters-list';
    this.filterContainer.appendChild(this.filtersElement);
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    super.setupEventListeners();
    
    // Listen for external filter updates
    this.subscribe(EVENTS.UI_FILTER_CHANGED, (data) => {
      if (data.source !== this.componentId) {
        this.updateFromExternal(data.filters);
      }
    });
    
    // Listen for data updates that might affect filter options
    this.subscribe(EVENTS.DATA_UPDATED, (data) => {
      this.refreshFilterOptions(data);
    });
  }
  
  /**
   * Add a filter to the component
   * @param {string} name - Filter name/key
   * @param {Object} config - Filter configuration
   */
  addFilter(name, config) {
    const filterConfig = {
      type: 'text',           // 'text', 'select', 'multiselect', 'checkbox', 'date', 'range'
      label: name,
      placeholder: this.options.placeholder,
      options: [],            // For select/multiselect
      defaultValue: null,
      required: false,
      validation: null,       // Validation function
      ...config
    };
    
    this.filters.set(name, filterConfig);
    
    // Create UI element for filter
    const filterElement = this.createFilterElement(name, filterConfig);
    this.filterElements.set(name, filterElement);
    this.filtersElement.appendChild(filterElement);
    
    this.log(`Added filter: ${name} (${filterConfig.type})`);
  }
  
  /**
   * Create UI element for a specific filter
   * @param {string} name - Filter name
   * @param {Object} config - Filter configuration
   * @returns {HTMLElement} Filter element
   * @private
   */
  createFilterElement(name, config) {
    const container = document.createElement('div');
    container.className = `filter-item filter-${config.type}`;
    container.setAttribute('data-filter-name', name);
    
    // Create label
    const label = document.createElement('label');
    label.textContent = config.label;
    label.className = 'filter-label';
    if (config.required) {
      label.classList.add('required');
    }
    container.appendChild(label);
    
    // Create input element based on type
    let input;
    
    switch (config.type) {
      case 'text':
        input = this.createTextInput(name, config);
        break;
      case 'select':
        input = this.createSelectInput(name, config);
        break;
      case 'multiselect':
        input = this.createMultiSelectInput(name, config);
        break;
      case 'checkbox':
        input = this.createCheckboxInput(name, config);
        break;
      case 'date':
        input = this.createDateInput(name, config);
        break;
      case 'range':
        input = this.createRangeInput(name, config);
        break;
      default:
        input = this.createTextInput(name, config);
    }
    
    container.appendChild(input);
    
    // Add validation message element
    const validationMsg = document.createElement('div');
    validationMsg.className = 'filter-validation';
    container.appendChild(validationMsg);
    
    return container;
  }
  
  /**
   * Create text input element
   * @param {string} name - Filter name
   * @param {Object} config - Filter configuration
   * @returns {HTMLElement} Input element
   * @private
   */
  createTextInput(name, config) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'filter-input filter-text';
    input.placeholder = config.placeholder;
    input.value = config.defaultValue || '';
    
    let debounceTimer;
    
    const handleInput = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.updateFilter(name, input.value.trim());
      }, this.options.debounceDelay);
    };
    
    input.addEventListener('input', handleInput);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(debounceTimer);
        this.updateFilter(name, input.value.trim());
      }
    });
    
    return input;
  }
  
  /**
   * Create select input element
   * @param {string} name - Filter name
   * @param {Object} config - Filter configuration
   * @returns {HTMLElement} Select element
   * @private
   */
  createSelectInput(name, config) {
    const select = document.createElement('select');
    select.className = 'filter-input filter-select';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = `Select ${config.label}...`;
    select.appendChild(defaultOption);
    
    // Add options
    config.options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value || option;
      optionElement.textContent = option.label || option;
      select.appendChild(optionElement);
    });
    
    select.value = config.defaultValue || '';
    
    select.addEventListener('change', () => {
      this.updateFilter(name, select.value);
    });
    
    return select;
  }
  
  /**
   * Create multi-select input element
   * @param {string} name - Filter name
   * @param {Object} config - Filter configuration
   * @returns {HTMLElement} Multi-select container
   * @private
   */
  createMultiSelectInput(name, config) {
    const container = document.createElement('div');
    container.className = 'filter-multiselect';
    
    const selectedDisplay = document.createElement('div');
    selectedDisplay.className = 'multiselect-display';
    selectedDisplay.textContent = `Select ${config.label}...`;
    container.appendChild(selectedDisplay);
    
    const dropdown = document.createElement('div');
    dropdown.className = 'multiselect-dropdown';
    dropdown.style.display = 'none';
    
    const selectedValues = new Set();
    
    // Add options
    config.options.forEach(option => {
      const optionElement = document.createElement('label');
      optionElement.className = 'multiselect-option';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = option.value || option;
      
      const label = document.createElement('span');
      label.textContent = option.label || option;
      
      optionElement.appendChild(checkbox);
      optionElement.appendChild(label);
      dropdown.appendChild(optionElement);
      
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedValues.add(checkbox.value);
        } else {
          selectedValues.delete(checkbox.value);
        }
        
        this.updateMultiSelectDisplay(selectedDisplay, selectedValues, config.label);
        this.updateFilter(name, Array.from(selectedValues));
      });
    });
    
    container.appendChild(dropdown);
    
    // Toggle dropdown
    selectedDisplay.addEventListener('click', () => {
      const isVisible = dropdown.style.display !== 'none';
      dropdown.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
    
    return container;
  }
  
  /**
   * Create checkbox input element
   * @param {string} name - Filter name
   * @param {Object} config - Filter configuration
   * @returns {HTMLElement} Checkbox element
   * @private
   */
  createCheckboxInput(name, config) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'filter-input filter-checkbox';
    checkbox.checked = config.defaultValue || false;
    
    checkbox.addEventListener('change', () => {
      this.updateFilter(name, checkbox.checked);
    });
    
    return checkbox;
  }
  
  /**
   * Create date input element
   * @param {string} name - Filter name
   * @param {Object} config - Filter configuration
   * @returns {HTMLElement} Date input element
   * @private
   */
  createDateInput(name, config) {
    const input = document.createElement('input');
    input.type = 'date';
    input.className = 'filter-input filter-date';
    input.value = config.defaultValue || '';
    
    input.addEventListener('change', () => {
      this.updateFilter(name, input.value);
    });
    
    return input;
  }
  
  /**
   * Create range input element
   * @param {string} name - Filter name
   * @param {Object} config - Filter configuration
   * @returns {HTMLElement} Range container
   * @private
   */
  createRangeInput(name, config) {
    const container = document.createElement('div');
    container.className = 'filter-range';
    
    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.className = 'filter-input filter-range-min';
    minInput.placeholder = 'Min';
    minInput.value = config.defaultValue?.min || '';
    
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.className = 'filter-input filter-range-max';
    maxInput.placeholder = 'Max';
    maxInput.value = config.defaultValue?.max || '';
    
    const separator = document.createElement('span');
    separator.textContent = ' - ';
    separator.className = 'range-separator';
    
    container.appendChild(minInput);
    container.appendChild(separator);
    container.appendChild(maxInput);
    
    const updateRange = () => {
      const min = minInput.value ? parseFloat(minInput.value) : null;
      const max = maxInput.value ? parseFloat(maxInput.value) : null;
      
      if (min !== null || max !== null) {
        this.updateFilter(name, { min, max });
      } else {
        this.updateFilter(name, null);
      }
    };
    
    minInput.addEventListener('change', updateRange);
    maxInput.addEventListener('change', updateRange);
    
    return container;
  }
  
  /**
   * Update multi-select display text
   * @param {HTMLElement} display - Display element
   * @param {Set} selectedValues - Selected values
   * @param {string} label - Filter label
   * @private
   */
  updateMultiSelectDisplay(display, selectedValues, label) {
    if (selectedValues.size === 0) {
      display.textContent = `Select ${label}...`;
    } else if (selectedValues.size === 1) {
      display.textContent = Array.from(selectedValues)[0];
    } else {
      display.textContent = `${selectedValues.size} selected`;
    }
  }
  
  /**
   * Update a specific filter value
   * @param {string} name - Filter name
   * @param {*} value - Filter value
   */
  updateFilter(name, value) {
    if (this.isApplying) return;
    
    // Validate filter value
    const config = this.filters.get(name);
    if (config && config.validation) {
      const validation = config.validation(value);
      if (!validation.valid) {
        this.showValidationError(name, validation.message);
        return;
      }
    }
    
    // Clear validation error
    this.clearValidationError(name);
    
    // Update active filters
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      delete this.activeFilters[name];
    } else {
      this.activeFilters[name] = value;
    }
    
    // Update filter count display
    this.updateFilterCount();
    
    // Apply filters if auto-apply is enabled
    if (this.options.autoApply) {
      this.applyFilters();
    }
    
    this.log(`Filter updated: ${name} = ${JSON.stringify(value)}`);
  }
  
  /**
   * Apply all active filters
   */
  applyFilters() {
    if (this.isApplying) return;
    
    this.isApplying = true;
    
    try {
      // Publish filter change event
      this.publish(EVENTS.UI_FILTER_CHANGED, {
        source: this.componentId,
        filters: { ...this.activeFilters },
        timestamp: Date.now()
      });
      
      this.log(`Applied ${Object.keys(this.activeFilters).length} filters`);
      
    } finally {
      this.isApplying = false;
    }
  }
  
  /**
   * Clear all filters
   */
  clearAllFilters() {
    this.activeFilters = {};
    
    // Reset all filter UI elements
    this.filterElements.forEach((element, name) => {
      this.resetFilterElement(element, name);
    });
    
    this.updateFilterCount();
    
    if (this.options.autoApply) {
      this.applyFilters();
    }
    
    this.log('All filters cleared');
  }
  
  /**
   * Reset a specific filter element to default state
   * @param {HTMLElement} element - Filter element
   * @param {string} name - Filter name
   * @private
   */
  resetFilterElement(element, name) {
    const config = this.filters.get(name);
    const input = element.querySelector('.filter-input');
    
    if (!input || !config) return;
    
    switch (config.type) {
      case 'text':
      case 'date':
        input.value = '';
        break;
      case 'select':
        input.selectedIndex = 0;
        break;
      case 'checkbox':
        input.checked = false;
        break;
      case 'multiselect':
        const checkboxes = element.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        const display = element.querySelector('.multiselect-display');
        if (display) {
          display.textContent = `Select ${config.label}...`;
        }
        break;
      case 'range':
        const minInput = element.querySelector('.filter-range-min');
        const maxInput = element.querySelector('.filter-range-max');
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
        break;
    }
  }
  
  /**
   * Update filter count display
   * @private
   */
  updateFilterCount() {
    if (this.filterCount) {
      const count = Object.keys(this.activeFilters).length;
      this.filterCount.textContent = `${count} active`;
      this.filterCount.className = `filter-count ${count > 0 ? 'has-filters' : ''}`;
    }
  }
  
  /**
   * Show validation error for a filter
   * @param {string} name - Filter name
   * @param {string} message - Error message
   * @private
   */
  showValidationError(name, message) {
    const element = this.filterElements.get(name);
    if (!element) return;
    
    const validationElement = element.querySelector('.filter-validation');
    if (validationElement) {
      validationElement.textContent = message;
      validationElement.className = 'filter-validation error';
    }
    
    element.classList.add('has-error');
  }
  
  /**
   * Clear validation error for a filter
   * @param {string} name - Filter name
   * @private
   */
  clearValidationError(name) {
    const element = this.filterElements.get(name);
    if (!element) return;
    
    const validationElement = element.querySelector('.filter-validation');
    if (validationElement) {
      validationElement.textContent = '';
      validationElement.className = 'filter-validation';
    }
    
    element.classList.remove('has-error');
  }
  
  /**
   * Update filter options (for select/multiselect filters)
   * @param {string} name - Filter name
   * @param {Array} options - New options
   */
  updateFilterOptions(name, options) {
    const config = this.filters.get(name);
    const element = this.filterElements.get(name);
    
    if (!config || !element) return;
    
    config.options = options;
    
    if (config.type === 'select') {
      const select = element.querySelector('select');
      if (select) {
        // Keep first option (placeholder)
        const firstOption = select.children[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        // Add new options
        options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option.value || option;
          optionElement.textContent = option.label || option;
          select.appendChild(optionElement);
        });
      }
    } else if (config.type === 'multiselect') {
      const dropdown = element.querySelector('.multiselect-dropdown');
      if (dropdown) {
        dropdown.innerHTML = '';
        
        // Recreate options
        options.forEach(option => {
          const optionElement = document.createElement('label');
          optionElement.className = 'multiselect-option';
          
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.value = option.value || option;
          
          const label = document.createElement('span');
          label.textContent = option.label || option;
          
          optionElement.appendChild(checkbox);
          optionElement.appendChild(label);
          dropdown.appendChild(optionElement);
          
          // Re-attach event listener
          checkbox.addEventListener('change', () => {
            const selectedValues = new Set();
            dropdown.querySelectorAll('input:checked').forEach(cb => {
              selectedValues.add(cb.value);
            });
            
            const display = element.querySelector('.multiselect-display');
            this.updateMultiSelectDisplay(display, selectedValues, config.label);
            this.updateFilter(name, Array.from(selectedValues));
          });
        });
      }
    }
    
    this.log(`Updated options for filter: ${name}`);
  }
  
  /**
   * Update filters from external source
   * @param {Object} filters - External filter values
   * @private
   */
  updateFromExternal(filters) {
    // Update internal state without triggering events
    this.activeFilters = { ...filters };
    
    // Update UI elements to match external state
    Object.entries(filters).forEach(([name, value]) => {
      const element = this.filterElements.get(name);
      if (element) {
        this.setFilterElementValue(element, name, value);
      }
    });
    
    this.updateFilterCount();
  }
  
  /**
   * Set filter element value programmatically
   * @param {HTMLElement} element - Filter element
   * @param {string} name - Filter name
   * @param {*} value - Value to set
   * @private
   */
  setFilterElementValue(element, name, value) {
    const config = this.filters.get(name);
    const input = element.querySelector('.filter-input');
    
    if (!input || !config) return;
    
    switch (config.type) {
      case 'text':
      case 'date':
        input.value = value || '';
        break;
      case 'select':
        input.value = value || '';
        break;
      case 'checkbox':
        input.checked = Boolean(value);
        break;
      case 'multiselect':
        const checkboxes = element.querySelectorAll('input[type="checkbox"]');
        const selectedSet = new Set(Array.isArray(value) ? value : [value]);
        
        checkboxes.forEach(cb => {
          cb.checked = selectedSet.has(cb.value);
        });
        
        const display = element.querySelector('.multiselect-display');
        if (display) {
          this.updateMultiSelectDisplay(display, selectedSet, config.label);
        }
        break;
      case 'range':
        if (value && typeof value === 'object') {
          const minInput = element.querySelector('.filter-range-min');
          const maxInput = element.querySelector('.filter-range-max');
          if (minInput) minInput.value = value.min || '';
          if (maxInput) maxInput.value = value.max || '';
        }
        break;
    }
  }
  
  /**
   * Refresh filter options based on data updates
   * @param {Object} data - Data update information
   * @private
   */
  refreshFilterOptions(data) {
    if (data.source === 'planning' && data.action === 'load_data') {
      // Request updated filter options
      this.publish(EVENTS.DATA_LOADED, {
        source: this.componentId,
        request: 'filter_options'
      });
    }
  }
  
  /**
   * Get current filter values
   * @returns {Object} Active filters
   */
  getFilters() {
    return { ...this.activeFilters };
  }
  
  /**
   * Set filter values programmatically
   * @param {Object} filters - Filters to set
   */
  setFilters(filters) {
    this.updateFromExternal(filters);
    
    if (this.options.autoApply) {
      this.applyFilters();
    }
  }
  
  /**
   * Remove a filter from the component
   * @param {string} name - Filter name to remove
   */
  removeFilter(name) {
    if (this.filters.has(name)) {
      this.filters.delete(name);
      
      const element = this.filterElements.get(name);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.filterElements.delete(name);
      
      delete this.activeFilters[name];
      this.updateFilterCount();
      
      if (this.options.autoApply) {
        this.applyFilters();
      }
      
      this.log(`Removed filter: ${name}`);
    }
  }
  
  /**
   * Get component state including filter values
   */
  getState() {
    return {
      ...super.getState(),
      filterCount: this.filters.size,
      activeFilterCount: Object.keys(this.activeFilters).length,
      activeFilters: { ...this.activeFilters },
      autoApply: this.options.autoApply
    };
  }
  
  /**
   * Clean up filter-specific resources
   */
  beforeDestroy() {
    super.beforeDestroy();
    
    // Clear any pending debounce timers
    this.filterElements.forEach(element => {
      const input = element.querySelector('.filter-input');
      if (input && input._debounceTimer) {
        clearTimeout(input._debounceTimer);
      }
    });
  }
}

export default FilterComponent;
