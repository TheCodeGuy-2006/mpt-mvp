// Universal Search Filter Component
// Advanced search functionality with multi-select across all filter categories

class UniversalSearchFilter {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      placeholder: "Search across all filters (e.g., 'SA', 'April', 'Planning')...",
      debounceDelay: 300,
      maxResults: 50,
      minSearchLength: 1,
      ...options
    };
    
    this.searchData = [];
    this.selectedFilters = new Map(); // category -> Set of values
    this.onFilterChange = options.onFilterChange || (() => {});
    
    this.init();
  }
  
  init() {
    this.createHTML();
    this.bindEvents();
  }
  
  createHTML() {
    this.container.innerHTML = `
      <div class="universal-search-container">
        <div style="position: relative;">
          <i class="octicon octicon-search universal-search-icon" aria-hidden="true"></i>
          <input 
            type="text" 
            class="universal-search-input" 
            placeholder="${this.options.placeholder}"
            autocomplete="off"
          />
          <div class="universal-search-results">
            <!-- Results populated dynamically -->
          </div>
        </div>
        <div class="selected-search-filters">
          <!-- Selected filters shown here -->
        </div>
        <button class="search-clear-all" style="display: none;">
          <i class="octicon octicon-x" aria-hidden="true"></i>
          Clear All
        </button>
      </div>
    `;
    
    this.input = this.container.querySelector('.universal-search-input');
    this.resultsContainer = this.container.querySelector('.universal-search-results');
    this.selectedContainer = this.container.querySelector('.selected-search-filters');
    this.clearAllBtn = this.container.querySelector('.search-clear-all');
  }
  
  bindEvents() {
    // Debounced search input
    let searchTimeout;
    this.input.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value);
      }, this.options.debounceDelay);
    });
    
    // Show/hide results on focus/blur
    this.input.addEventListener('focus', () => {
      if (this.input.value.length >= this.options.minSearchLength) {
        this.showResults();
      }
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideResults();
      }
    });
    
    // Clear all filters
    this.clearAllBtn.addEventListener('click', () => {
      this.clearAllFilters();
    });
    
    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      this.handleKeyNavigation(e);
    });
  }
  
  setSearchData(data) {
    this.searchData = data;
  }
  
  performSearch(query) {
    if (query.length < this.options.minSearchLength) {
      this.hideResults();
      return;
    }
    
    const results = this.searchInData(query);
    this.displayResults(results, query);
    this.showResults();
  }
  
  searchInData(query) {
    const searchTerm = query.toLowerCase().trim();
    const results = new Map(); // category -> items
    
    this.searchData.forEach(item => {
      const { category, value, displayValue } = item;
      const searchableText = (displayValue || value).toLowerCase();
      
      if (searchableText.includes(searchTerm)) {
        if (!results.has(category)) {
          results.set(category, []);
        }
        results.get(category).push({
          ...item,
          isSelected: this.isFilterSelected(category, value)
        });
      }
    });
    
    // Sort categories and limit results
    const sortedResults = new Map();
    const categoryOrder = ['region', 'quarter', 'status', 'programType', 'strategicPillars', 'owner', 'country', 'revenuePlay'];
    
    categoryOrder.forEach(cat => {
      if (results.has(cat)) {
        const items = results.get(cat)
          .slice(0, Math.floor(this.options.maxResults / results.size))
          .sort((a, b) => {
            // Prioritize exact matches and selected items
            const aExact = (a.displayValue || a.value).toLowerCase() === searchTerm;
            const bExact = (b.displayValue || b.value).toLowerCase() === searchTerm;
            if (aExact !== bExact) return bExact - aExact;
            if (a.isSelected !== b.isSelected) return b.isSelected - a.isSelected;
            return (a.displayValue || a.value).localeCompare(b.displayValue || b.value);
          });
        sortedResults.set(cat, items);
      }
    });
    
    return sortedResults;
  }
  
  displayResults(results, query) {
    if (results.size === 0) {
      this.resultsContainer.innerHTML = `
        <div class="search-no-results">
          <i class="octicon octicon-search" aria-hidden="true"></i>
          No matches found for "${query}"
        </div>
      `;
      return;
    }
    
    let html = '';
    results.forEach((items, category) => {
      html += `
        <div class="search-category">
          <div class="search-category-header">
            ${this.getCategoryDisplayName(category)} (${items.length})
          </div>
          ${items.map(item => `
            <div class="search-result-item ${item.isSelected ? 'selected' : ''}" 
                 data-category="${category}" 
                 data-value="${item.value}">
              <div class="search-result-content">
                <div class="search-result-title">${this.highlightMatch(item.displayValue || item.value, query)}</div>
                <div class="search-result-category">${this.getCategoryDisplayName(category)}</div>
              </div>
              <div class="search-result-checkbox"></div>
            </div>
          `).join('')}
        </div>
      `;
    });
    
    this.resultsContainer.innerHTML = html;
    
    // Bind click events to result items
    this.resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const category = item.dataset.category;
        const value = item.dataset.value;
        this.toggleFilter(category, value);
        this.updateResultItem(item, category, value);
      });
    });
  }
  
  toggleFilter(category, value) {
    if (!this.selectedFilters.has(category)) {
      this.selectedFilters.set(category, new Set());
    }
    
    const categoryFilters = this.selectedFilters.get(category);
    
    if (categoryFilters.has(value)) {
      categoryFilters.delete(value);
      if (categoryFilters.size === 0) {
        this.selectedFilters.delete(category);
      }
    } else {
      categoryFilters.add(value);
    }
    
    this.updateSelectedDisplay();
    this.onFilterChange(this.getSelectedFilters());
  }
  
  updateResultItem(item, category, value) {
    const isSelected = this.isFilterSelected(category, value);
    item.classList.toggle('selected', isSelected);
  }
  
  isFilterSelected(category, value) {
    return this.selectedFilters.has(category) && 
           this.selectedFilters.get(category).has(value);
  }
  
  updateSelectedDisplay() {
    const hasFilters = this.selectedFilters.size > 0;
    this.clearAllBtn.style.display = hasFilters ? 'inline-block' : 'none';
    
    if (!hasFilters) {
      this.selectedContainer.innerHTML = '';
      return;
    }
    
    let html = '';
    this.selectedFilters.forEach((values, category) => {
      values.forEach(value => {
        const displayValue = this.getDisplayValue(category, value);
        html += `
          <div class="selected-search-filter-tag" data-category="${category}" data-value="${value}">
            <span class="selected-search-filter-category">${this.getCategoryDisplayName(category)}</span>
            <span>${displayValue}</span>
            <button class="selected-search-filter-remove" title="Remove filter">×</button>
          </div>
        `;
      });
    });
    
    this.selectedContainer.innerHTML = html;
    
    // Bind remove events
    this.selectedContainer.querySelectorAll('.selected-search-filter-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = btn.closest('.selected-search-filter-tag');
        const category = tag.dataset.category;
        const value = tag.dataset.value;
        this.toggleFilter(category, value);
        
        // Update any visible result items
        this.resultsContainer.querySelectorAll(`[data-category="${category}"][data-value="${value}"]`)
          .forEach(item => this.updateResultItem(item, category, value));
      });
    });
  }
  
  clearAllFilters() {
    this.selectedFilters.clear();
    this.updateSelectedDisplay();
    this.input.value = '';
    this.hideResults();
    this.onFilterChange(this.getSelectedFilters());
  }
  
  getSelectedFilters() {
    const filters = {};
    this.selectedFilters.forEach((values, category) => {
      filters[category] = Array.from(values);
    });
    return filters;
  }
  
  setSelectedFilters(filters) {
    this.selectedFilters.clear();
    Object.entries(filters).forEach(([category, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        this.selectedFilters.set(category, new Set(values));
      }
    });
    this.updateSelectedDisplay();
  }
  
  getCategoryDisplayName(category) {
    const displayNames = {
      region: 'Region',
      quarter: 'Quarter',
      status: 'Status',
      programType: 'Program Type',
      strategicPillars: 'Strategic Pillar',
      owner: 'Owner',
      country: 'Country',
      revenuePlay: 'Revenue Play'
    };
    return displayNames[category] || category;
  }
  
  getDisplayValue(category, value) {
    // Find the display value from search data
    const item = this.searchData.find(item => 
      item.category === category && item.value === value
    );
    return item ? (item.displayValue || item.value) : value;
  }
  
  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<strong style="background: #fff5b4; color: #24292e;">$1</strong>');
  }
  
  handleKeyNavigation(e) {
    const items = this.resultsContainer.querySelectorAll('.search-result-item');
    if (items.length === 0) return;
    
    let currentIndex = Array.from(items).findIndex(item => item.classList.contains('keyboard-focus'));
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          this.setKeyboardFocus(items, currentIndex + 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          this.setKeyboardFocus(items, currentIndex - 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0) {
          items[currentIndex].click();
        }
        break;
      case 'Escape':
        this.hideResults();
        this.input.blur();
        break;
    }
  }
  
  setKeyboardFocus(items, index) {
    items.forEach(item => item.classList.remove('keyboard-focus'));
    if (items[index]) {
      items[index].classList.add('keyboard-focus');
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }
  
  showResults() {
    this.resultsContainer.classList.add('show');
  }
  
  hideResults() {
    this.resultsContainer.classList.remove('show');
    this.resultsContainer.querySelectorAll('.keyboard-focus').forEach(item => {
      item.classList.remove('keyboard-focus');
    });
  }
  
  // Public API methods
  destroy() {
    this.container.innerHTML = '';
  }
  
  reset() {
    this.clearAllFilters();
  }
  
  updateData(newData) {
    this.setSearchData(newData);
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.UniversalSearchFilter = UniversalSearchFilter;
}
