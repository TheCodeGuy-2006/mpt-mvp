// config.js - Environment Configuration
const CONFIG = {
  // Detect if we're running on GitHub Pages
  isGitHubPages: window.location.hostname.includes('github.io'),
  
  // Backend API URL - update this with your deployed backend URL
  getApiUrl() {
    if (this.isGitHubPages) {
      // TODO: Replace with your actual backend URL once deployed
      // Examples for different platforms:
      // Railway: 'https://your-app-name.railway.app'
      // Vercel: 'https://your-app-name.vercel.app'
      // Heroku: 'https://your-app-name.herokuapp.com'
      // Render: 'https://your-app-name.onrender.com'
      return 'https://your-backend-url.railway.app';
    } else {
      // Local development
      return 'http://localhost:3000';
    }
  },
  
  // Get full API endpoint
  getEndpoint(path) {
    return `${this.getApiUrl()}${path}`;
  },
  
  // Auto-detect and log current environment
  logEnvironment() {
    console.log('=== MPT Environment Configuration ===');
    console.log('Current URL:', window.location.href);
    console.log('Is GitHub Pages:', this.isGitHubPages);
    console.log('Backend API URL:', this.getApiUrl());
    console.log('======================================');
  }
};

// Export for use in other modules
window.CONFIG = CONFIG;

// Auto-log environment on load
CONFIG.logEnvironment();
