/**
 * Phase 2 Startup Script
 * Automatically initializes Phase 2 when the page loads
 */

(function() {
  'use strict';
  
  console.log('🚀 Phase 2 Startup Script loaded');
  
  let initializationAttempts = 0;
  const maxAttempts = 10;
  
  /**
   * Wait for Phase 2 system to be available and initialize
   */
  async function waitForPhase2AndInitialize() {
    initializationAttempts++;
    
    // Check if Phase 2 is available
    if (window.Phase2Integration && window.planningController) {
      try {
        console.log('🎯 Phase 2 modules detected, starting automatic initialization...');
        
        // Initialize Phase 2 if not already done
        if (!window.phase2System) {
          const phase2System = await window.Phase2Integration.initializePhase2({
            enablePerformanceMonitoring: true,
            enableDataOptimization: true,
            enableVirtualScrolling: true,
            enableComponentSystem: true,
            performanceThresholds: {
              renderTime: 16,
              dataOperation: 50,
              networkRequest: 1000,
              memoryUsage: 50,
              domNodes: 1000
            }
          });
          
          // Store globally
          window.phase2System = phase2System;
          
          // Enhance planning controller
          window.planningController = window.Phase2Integration.enhancePlanningController(window.planningController);
          
          console.log('✅ Phase 2 automatic initialization completed');
          
          // Setup auto-optimization for large datasets
          setupAutoOptimization();
          
          // Add UI indicators
          addPhase2StatusIndicator();
          
          return true;
        } else {
          console.log('✅ Phase 2 system already initialized');
          return true;
        }
        
      } catch (error) {
        console.error('❌ Phase 2 automatic initialization failed:', error);
        return false;
      }
    }
    
    // Retry if not available yet
    if (initializationAttempts < maxAttempts) {
      console.log(`⏳ Waiting for Phase 2 modules... (attempt ${initializationAttempts}/${maxAttempts})`);
      setTimeout(waitForPhase2AndInitialize, 1000);
    } else {
      console.warn('⚠️ Phase 2 modules not available after maximum attempts');
    }
  }
  
  /**
   * Setup automatic optimization based on data size
   */
  function setupAutoOptimization() {
    if (!window.phase2System) return;
    
    // Monitor data changes and auto-optimize large datasets
    let optimizationTimer = null;
    
    function scheduleOptimization() {
      clearTimeout(optimizationTimer);
      optimizationTimer = setTimeout(async () => {
        try {
          const planningData = window.planningController?.getData() || [];
          
          if (planningData.length > 500) {
            console.log('🔧 Auto-optimizing large dataset...');
            
            await window.phase2System.optimizeDataset(planningData, {
              indexFields: ['id', 'region', 'quarter', 'status', 'owner', 'revenuePlay', 'country'],
              precomputeAggregations: true
            });
            
            console.log('✅ Auto-optimization completed');
          }
        } catch (error) {
          console.warn('⚠️ Auto-optimization failed:', error);
        }
      }, 2000);
    }
    
    // Listen for data changes
    if (window.eventBus) {
      window.eventBus.subscribe('DATA_LOADED', scheduleOptimization);
      window.eventBus.subscribe('DATA_UPDATED', scheduleOptimization);
    }
    
    // Also check periodically
    setInterval(() => {
      const data = window.planningController?.getData() || [];
      if (data.length > 1000) {
        scheduleOptimization();
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Add Phase 2 status indicator to the UI
   */
  function addPhase2StatusIndicator() {
    // Only add once
    if (document.getElementById('phase2-status-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'phase2-status-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        cursor: pointer;
        transition: all 0.3s ease;
      " title="Click for Phase 2 system information">
        🚀 Phase 2 Active
      </div>
    `;
    
    // Add click handler to show system info
    indicator.addEventListener('click', showPhase2SystemInfo);
    
    // Add hover effects
    const statusDiv = indicator.firstElementChild;
    statusDiv.addEventListener('mouseenter', () => {
      statusDiv.style.transform = 'scale(1.05)';
      statusDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    });
    
    statusDiv.addEventListener('mouseleave', () => {
      statusDiv.style.transform = 'scale(1)';
      statusDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    });
    
    document.body.appendChild(indicator);
    
    // Auto-hide after 5 seconds, then show minimized version
    setTimeout(() => {
      statusDiv.style.transform = 'scale(0.8)';
      statusDiv.style.opacity = '0.7';
      statusDiv.innerHTML = '🚀';
      statusDiv.style.padding = '6px';
    }, 5000);
  }
  
  /**
   * Show Phase 2 system information modal
   */
  function showPhase2SystemInfo() {
    if (!window.phase2System) return;
    
    const modal = document.createElement('div');
    modal.id = 'phase2-info-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: white;
          border-radius: 12px;
          padding: 20px;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
          ">
            <h2 style="margin: 0; color: #333;">🚀 Phase 2 System Status</h2>
            <button id="close-phase2-modal" style="
              background: #ff4444;
              color: white;
              border: none;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              cursor: pointer;
              font-size: 16px;
            ">&times;</button>
          </div>
          <div id="phase2-system-details">
            <p>Loading system information...</p>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button handler
    document.getElementById('close-phase2-modal').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Load system information
    loadPhase2SystemDetails();
  }
  
  /**
   * Load and display Phase 2 system details
   */
  async function loadPhase2SystemDetails() {
    const detailsContainer = document.getElementById('phase2-system-details');
    if (!detailsContainer || !window.phase2System) return;
    
    try {
      const health = window.phase2System.getSystemHealth();
      const stats = window.phase2System.getPerformanceStats();
      const data = window.planningController?.getData() || [];
      
      detailsContainer.innerHTML = `
        <div style="display: grid; gap: 15px;">
          <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">System Health</h3>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">${health.status === 'good' ? '✅' : health.status === 'warning' ? '⚠️' : '❌'}</span>
              <span style="font-weight: bold;">${health.status.toUpperCase()}</span>
              <span style="color: #666;">(Score: ${health.healthScore}/100)</span>
            </div>
          </div>
          
          <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Performance Metrics</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
              <div>📊 Operations: ${health.metrics.operations || 0}</div>
              <div>⚡ Average FPS: ${health.metrics.averageFPS?.toFixed(1) || 'N/A'}</div>
              <div>🐌 Slow Operations: ${health.metrics.slowOperations || 0}</div>
              <div>🧠 Memory Usage: ${(health.metrics.memoryUsage / 1024 / 1024).toFixed(1)} MB</div>
            </div>
          </div>
          
          <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Data Optimization</h3>
            <div style="font-size: 14px;">
              <div>📈 Dataset Size: ${data.length.toLocaleString()} records</div>
              <div>🚀 Optimization: ${data.length > 500 ? 'Active' : 'Standby'}</div>
              <div>📜 Virtual Scrolling: ${data.length > 1000 ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
          
          <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Available Actions</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <button onclick="window.planningDebug?.testPhase2System()" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">🧪 Run Tests</button>
              <button onclick="window.planningDebug?.testOptimizedFiltering()" style="
                background: #2196F3;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">🔍 Test Filtering</button>
              <button onclick="console.log(window.phase2System.getPerformanceStats())" style="
                background: #FF9800;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              ">📊 Show Stats</button>
            </div>
          </div>
        </div>
      `;
      
    } catch (error) {
      detailsContainer.innerHTML = `
        <div style="color: #d32f2f; padding: 15px; background: #ffebee; border-radius: 8px;">
          <strong>Error loading system information:</strong><br>
          ${error.message}
        </div>
      `;
    }
  }
  
  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForPhase2AndInitialize);
  } else {
    // DOM already loaded
    setTimeout(waitForPhase2AndInitialize, 100);
  }
  
  // Also try after window load
  window.addEventListener('load', () => {
    setTimeout(waitForPhase2AndInitialize, 500);
  });
  
  console.log('🎯 Phase 2 startup script initialized');
  
})();
