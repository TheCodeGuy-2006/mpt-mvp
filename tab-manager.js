// Tab Management Utility for Performance Optimization
console.log("Tab manager loaded");

class TabManager {
  constructor() {
    this.currentTab = null;
    this.tabStates = new Map();
    this.cleanupCallbacks = new Map();
    this.initCallbacks = new Map();
    this.isTransitioning = false;
    
    this.setupTabListeners();
    console.log("🎯 TabManager initialized");
  }
  
  // Register tab with initialization and cleanup callbacks
  registerTab(tabId, initCallback, cleanupCallback) {
    this.initCallbacks.set(tabId, initCallback);
    this.cleanupCallbacks.set(tabId, cleanupCallback);
    this.tabStates.set(tabId, { initialized: false, data: null });
    console.log(`📋 Registered tab: ${tabId}`);
  }
  
  // Setup event listeners for tab switching
  setupTabListeners() {
    // Listen for tab button clicks
    document.addEventListener('click', (e) => {
      const tabButton = e.target.closest('[data-tab]');
      if (tabButton && !this.isTransitioning) {
        e.preventDefault();
        const tabId = tabButton.getAttribute('data-tab');
        this.switchToTab(tabId);
      }
    });
    
    // Listen for browser tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseCurrentTab();
      } else {
        this.resumeCurrentTab();
      }
    });
  }
  
  // Switch to a specific tab with performance optimizations
  async switchToTab(tabId) {
    if (this.currentTab === tabId || this.isTransitioning) {
      return;
    }
    
    console.log(`🔄 Switching to tab: ${tabId}`);
    this.isTransitioning = true;
    
    // Start performance tracking
    const perfTracker = window.performanceMonitor?.startTracking(`tab-switch-${tabId}`);
    
    try {
      // Immediately hide current tab for instant visual feedback
      if (this.currentTab) {
        this.hideTab(this.currentTab);
      }
      
      // Show new tab immediately (even if not loaded)
      this.showTab(tabId);
      this.currentTab = tabId;
      
      // Update URL immediately
      if (window.history && window.history.pushState) {
        window.history.pushState({ tab: tabId }, '', `#${tabId}`);
      }
      
      // Show minimal loading indicator
      this.showTabLoadingIndicator(`Loading ${tabId}...`);
      
      // Cleanup previous tab in background
      requestAnimationFrame(async () => {
        if (this.currentTab === tabId) { // Make sure user hasn't switched again
          try {
            // Initialize new tab
            await this.initializeTab(tabId);
            console.log(`✅ Successfully switched to tab: ${tabId}`);
          } catch (error) {
            console.error(`❌ Error initializing tab ${tabId}:`, error);
          } finally {
            this.hideTabLoadingIndicator();
          }
        }
      });
      
    } catch (error) {
      console.error(`❌ Error switching to tab ${tabId}:`, error);
      alert(`Failed to load ${tabId} tab. Please try again.`);
    } finally {
      this.isTransitioning = false;
      perfTracker?.end();
    }
  }
  
  // Initialize a tab with lazy loading
  async initializeTab(tabId) {
    const tabState = this.tabStates.get(tabId);
    if (!tabState) {
      throw new Error(`Tab ${tabId} not registered`);
    }
    
    if (tabState.initialized) {
      console.log(`📋 Tab ${tabId} already initialized, skipping...`);
      return;
    }
    
    const initCallback = this.initCallbacks.get(tabId);
    if (initCallback) {
      console.log(`🚀 Initializing tab: ${tabId}`);
      await initCallback();
      tabState.initialized = true;
    }
  }
  
  // Cleanup a tab to free memory
  async cleanupTab(tabId) {
    const cleanupCallback = this.cleanupCallbacks.get(tabId);
    if (cleanupCallback) {
      console.log(`🧹 Cleaning up tab: ${tabId}`);
      await cleanupCallback();
      
      // Mark as not initialized so it can be re-initialized later
      const tabState = this.tabStates.get(tabId);
      if (tabState) {
        tabState.initialized = false;
      }
    }
  }
  
  // Show tab content
  showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.style.display = 'none';
    });
    
    // Show target tab
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
      targetTab.style.display = 'block';
    }
    
    // Update tab button states
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }
  
  // Hide tab content
  hideTab(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
      tab.style.display = 'none';
    }
  }
  
  // Pause current tab (when browser tab becomes inactive)
  pauseCurrentTab() {
    if (this.currentTab) {
      console.log(`⏸️ Pausing tab: ${this.currentTab}`);
      // Add any pause logic here (stop animations, timers, etc.)
    }
  }
  
  // Resume current tab (when browser tab becomes active)
  resumeCurrentTab() {
    if (this.currentTab) {
      console.log(`▶️ Resuming tab: ${this.currentTab}`);
      // Add any resume logic here
    }
  }
  
  // Show loading indicator for tab transitions
  showTabLoadingIndicator(message = "Loading...") {
    const existing = document.getElementById("tabLoadingIndicator");
    if (existing) existing.remove();
    
    const indicator = document.createElement("div");
    indicator.id = "tabLoadingIndicator";
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-size: 18px;
      font-weight: bold;
      color: #1976d2;
    `;
    
    indicator.innerHTML = `
      <div style="text-align: center;">
        <div style="
          width: 40px;
          height: 40px;
          border: 4px solid #e3f2fd;
          border-top: 4px solid #1976d2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        "></div>
        ${message}
      </div>
    `;
    
    document.body.appendChild(indicator);
  }
  
  // Hide loading indicator
  hideTabLoadingIndicator() {
    const indicator = document.getElementById("tabLoadingIndicator");
    if (indicator) indicator.remove();
  }
  
  // Get current tab info
  getCurrentTab() {
    return this.currentTab;
  }
  
  // Check if tab is initialized
  isTabInitialized(tabId) {
    const tabState = this.tabStates.get(tabId);
    return tabState ? tabState.initialized : false;
  }
  
  // Force cleanup all tabs (useful for page unload)
  async cleanupAllTabs() {
    console.log("🧹 Cleaning up all tabs...");
    for (const [tabId, cleanupCallback] of this.cleanupCallbacks) {
      try {
        await cleanupCallback();
      } catch (error) {
        console.warn(`⚠️ Error cleaning up tab ${tabId}:`, error);
      }
    }
  }
}

// Create global tab manager instance
window.tabManager = new TabManager();

// Handle page unload to cleanup resources
window.addEventListener('beforeunload', () => {
  if (window.tabManager) {
    window.tabManager.cleanupAllTabs();
  }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.tab && window.tabManager) {
    window.tabManager.switchToTab(e.state.tab);
  }
});

console.log("✅ Tab manager ready");
