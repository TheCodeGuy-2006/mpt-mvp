/**
 * Final Console Log Cleanup for Production
 * Removes remaining debug logs while preserving essential error handling
 */

// Debug mode control
window.DEBUG_MODE = window.DEBUG_MODE || false;

// Conditional logging function
window.debugLog = function(...args) {
  if (window.DEBUG_MODE) {
    console.log(...args);
  }
};

// Production-ready logging setup
(function setupProductionLogging() {
  // Only run in production mode
  if (window.DEBUG_MODE) return;
  
  // Store original console methods
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Filter out development-only logs
  const debugPatterns = [
    /🚀.*DEBUG/,
    /✅.*DEBUG/,
    /🔧.*DEBUG/,
    /📊.*Phase 3/,
    /🧪.*test/i,
    /🔍.*search.*initialized/,
    /✅.*system.*integrated/,
    /⚡.*module.*loaded/,
    /🎯.*TabManager/,
    /🔄.*sync/i
  ];
  
  // Override console.log to filter debug messages
  console.log = function(...args) {
    const message = args.join(' ');
    const isDebugMessage = debugPatterns.some(pattern => pattern.test(message));
    
    if (!isDebugMessage) {
      originalLog.apply(console, args);
    }
  };
  
  // Keep warnings and errors (they're important!)
  console.warn = originalWarn;
  console.error = originalError;
  
  // Add method to restore full logging for debugging
  window.enableDebugMode = function() {
    window.DEBUG_MODE = true;
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.log('🔧 Debug mode enabled - full logging restored');
  };
  
  console.log('🎯 Production logging mode active');
})();

export { debugLog };
