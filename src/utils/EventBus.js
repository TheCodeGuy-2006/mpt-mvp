/**
 * EventBus - Centralized event management system
 * Implements Observer pattern for loose coupling between components
 * 
 * SOLID Principle: Single Responsibility - Handles only event management
 * Pattern: Observer - Allows components to subscribe/publish events without direct references
 */
class EventBus {
    constructor() {
        this.events = new Map();
        this.isLogging = false; // Set to true for debugging
    }

    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is triggered
     * @param {Object} context - Optional context to bind the callback to
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const subscriber = {
            callback: context ? callback.bind(context) : callback,
            context
        };

        this.events.get(eventName).push(subscriber);

        if (this.isLogging) {
            console.log(`EventBus: Subscribed to '${eventName}'`);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(eventName, callback, context);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Original callback function
     * @param {Object} context - Original context
     */
    unsubscribe(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            return;
        }

        const subscribers = this.events.get(eventName);
        const index = subscribers.findIndex(sub => 
            sub.callback === (context ? callback.bind(context) : callback)
        );

        if (index !== -1) {
            subscribers.splice(index, 1);
            
            if (this.isLogging) {
                console.log(`EventBus: Unsubscribed from '${eventName}'`);
            }

            // Clean up empty event arrays
            if (subscribers.length === 0) {
                this.events.delete(eventName);
            }
        }
    }

    /**
     * Publish an event to all subscribers
     * @param {string} eventName - Name of the event to publish
     * @param {*} data - Data to pass to subscribers
     */
    publish(eventName, data = null) {
        if (!this.events.has(eventName)) {
            if (this.isLogging) {
                console.log(`EventBus: No subscribers for '${eventName}'`);
            }
            return;
        }

        const subscribers = this.events.get(eventName);
        
        if (this.isLogging) {
            console.log(`EventBus: Publishing '${eventName}' to ${subscribers.length} subscribers`);
        }

        // Create a copy of subscribers to prevent issues if callbacks modify the subscription list
        [...subscribers].forEach(subscriber => {
            try {
                subscriber.callback(data);
            } catch (error) {
                console.error(`EventBus: Error in subscriber for '${eventName}':`, error);
            }
        });
    }

    /**
     * Publish an event asynchronously
     * @param {string} eventName - Name of the event to publish
     * @param {*} data - Data to pass to subscribers
     */
    async publishAsync(eventName, data = null) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                this.publish(eventName, data);
                resolve();
            });
        });
    }

    /**
     * Subscribe to an event that will only fire once
     * @param {string} eventName - Name of the event
     * @param {Function} callback - Function to call
     * @param {Object} context - Optional context
     */
    once(eventName, callback, context = null) {
        const unsubscribe = this.subscribe(eventName, (...args) => {
            unsubscribe();
            callback(...args);
        }, context);

        return unsubscribe;
    }

    /**
     * Clear all subscribers for an event or all events
     * @param {string} eventName - Optional specific event to clear
     */
    clear(eventName = null) {
        if (eventName) {
            this.events.delete(eventName);
            if (this.isLogging) {
                console.log(`EventBus: Cleared all subscribers for '${eventName}'`);
            }
        } else {
            this.events.clear();
            if (this.isLogging) {
                console.log('EventBus: Cleared all subscribers');
            }
        }
    }

    /**
     * Get the number of subscribers for an event
     * @param {string} eventName - Name of the event
     * @returns {number} Number of subscribers
     */
    getSubscriberCount(eventName) {
        return this.events.has(eventName) ? this.events.get(eventName).length : 0;
    }

    /**
     * Get all registered event names
     * @returns {Array} Array of event names
     */
    getEventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * Enable/disable logging for debugging
     * @param {boolean} enabled - Whether to enable logging
     */
    setLogging(enabled) {
        this.isLogging = enabled;
    }
}

// Create singleton instance
const eventBus = new EventBus();

// Common event names to prevent typos
export const EVENTS = {
    // Data events
    DATA_LOADED: 'data:loaded',
    DATA_UPDATED: 'data:updated',
    DATA_ERROR: 'data:error',
    
    // Planning events
    PLANNING_CAMPAIGN_ADDED: 'planning:campaign:added',
    PLANNING_CAMPAIGN_UPDATED: 'planning:campaign:updated',
    PLANNING_CAMPAIGN_DELETED: 'planning:campaign:deleted',
    PLANNING_DATA_REFRESH: 'planning:data:refresh',
    
    // Execution events
    EXECUTION_DATA_SYNC: 'execution:data:sync',
    EXECUTION_FILTER_APPLIED: 'execution:filter:applied',
    EXECUTION_SEARCH_UPDATED: 'execution:search:updated',
    
    // ROI events
    ROI_CALCULATION_START: 'roi:calculation:start',
    ROI_CALCULATION_COMPLETE: 'roi:calculation:complete',
    ROI_DATA_UPDATED: 'roi:data:updated',
    
    // Chart events
    CHART_DATA_UPDATED: 'chart:data:updated',
    CHART_REFRESH_NEEDED: 'chart:refresh:needed',
    
    // UI events
    UI_FILTER_CHANGED: 'ui:filter:changed',
    UI_TAB_CHANGED: 'ui:tab:changed',
    UI_LOADING_START: 'ui:loading:start',
    UI_LOADING_END: 'ui:loading:end',
    
    // Performance events
    PERFORMANCE_MEASURE: 'performance:measure',
    PERFORMANCE_WARNING: 'performance:warning'
};

export default eventBus;
