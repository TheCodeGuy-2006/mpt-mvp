// backend-status.js - Backend Connection Status
console.log("backend-status.js loaded");

// Backend status checker
const BackendStatus = {
  isConnected: false,
  lastCheck: null,
  retryCount: 0,
  maxRetries: 3,
  
  // Check if backend is accessible
  async checkConnection() {
    const apiUrl = CONFIG.getApiUrl();
    const healthEndpoint = CONFIG.getEndpoint('/health');
    console.log('[Backend] Checking connection to:', apiUrl);
    console.log('[Backend] Health endpoint:', healthEndpoint);
    console.log('[Backend] Current frontend URL:', window.location.href);
    
    try {
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // Don't wait too long for health check
        signal: AbortSignal.timeout(5000)
      });
      
      this.isConnected = response.ok;
      this.lastCheck = new Date();
      this.retryCount = 0;
      
      console.log('[Backend] Connection status:', this.isConnected);
      console.log('[Backend] Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[Backend] Health data:', data);
      }
      this.updateStatusIndicator();
      return this.isConnected;
      
    } catch (error) {
      console.warn('[Backend] Connection failed:', error.message);
      console.warn('[Backend] Error type:', error.name);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('[Backend] This is likely a CORS issue or network connectivity problem');
        console.warn('[Backend] Ensure backend is running and CORS is configured for:', window.location.origin);
      }
      this.isConnected = false;
      this.lastCheck = new Date();
      this.retryCount++;
      this.updateStatusIndicator();
      return false;
    }
  },
  
  // Update visual status indicator
  updateStatusIndicator() {
    const indicator = document.getElementById('backend-status-indicator');
    if (!indicator) return;
    
    const statusText = document.getElementById('backend-status-text');
    
    if (this.isConnected) {
      indicator.className = 'status-indicator connected';
      if (statusText) statusText.textContent = 'Backend Connected';
    } else {
      indicator.className = 'status-indicator disconnected';
      if (statusText) statusText.textContent = CONFIG.isGitHubPages 
        ? 'Backend Offline (Read-only mode)' 
        : 'Backend Offline';
    }
  },
  
  // Try to save data with fallback
  async saveWithFallback(endpoint, data) {
    if (!this.isConnected && this.retryCount < this.maxRetries) {
      await this.checkConnection();
    }
    
    if (this.isConnected) {
      try {
        const response = await fetch(CONFIG.getEndpoint(endpoint), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
        
      } catch (error) {
        console.error('[Backend] Save failed:', error);
        this.isConnected = false;
        this.updateStatusIndicator();
        throw error;
      }
    } else {
      // Fallback to local storage for GitHub Pages
      if (CONFIG.isGitHubPages) {
        console.warn('[Backend] Saving to localStorage as fallback');
        localStorage.setItem(`mpt_${endpoint.replace('/', '_')}`, JSON.stringify(data));
        return { success: true, fallback: true };
      } else {
        throw new Error('Backend is not available and no fallback configured');
      }
    }
  }
};

// Add status indicator to page
function addBackendStatusIndicator() {
  // Check if already exists
  if (document.getElementById('backend-status-indicator')) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'backend-status-indicator';
  indicator.className = 'status-indicator checking';
  
  const statusText = document.createElement('span');
  statusText.id = 'backend-status-text';
  statusText.textContent = 'Checking backend...';
  
  indicator.appendChild(statusText);
  
  // Add to page header
  const header = document.querySelector('header') || document.body;
  header.appendChild(indicator);
}

// Initialize status checking
function initializeBackendStatus() {
  addBackendStatusIndicator();
  
  // Initial check
  BackendStatus.checkConnection();
  
  // Periodic checks every 30 seconds
  setInterval(() => {
    if (!BackendStatus.isConnected) {
      BackendStatus.checkConnection();
    }
  }, 30000);
}

// Export
window.BackendStatus = BackendStatus;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBackendStatus);
} else {
  initializeBackendStatus();
}
