/**
 * BaseComponent - Abstract base class for all UI components
 * Implements Component pattern with lifecycle management
 * 
 * SOLID Principle: Single Responsibility + Template Method Pattern
 * Provides consistent lifecycle and event handling for all components
 */

import eventBus, { EVENTS } from '../utils/EventBus.js';

export class BaseComponent {
  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...this.getDefaultOptions(), ...options };
    this.isInitialized = false;
    this.isDestroyed = false;
    this.eventSubscriptions = [];
    this.childComponents = [];
    
    // Unique component ID for debugging
    this.componentId = `${this.constructor.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Auto-initialize if element is provided
    if (this.element) {
      this.initialize();
    }
  }
  
  /**
   * Get default options for the component
   * Override in subclasses to provide component-specific defaults
   * @returns {Object} Default options
   */
  getDefaultOptions() {
    return {
      autoDestroy: true,
      debugMode: false,
      className: '',
      attributes: {}
    };
  }
  
  /**
   * Initialize the component
   * Template method - calls lifecycle hooks in order
   */
  async initialize() {
    if (this.isInitialized || this.isDestroyed) return;
    
    try {
      this.log('Initializing component...');
      
      // Pre-initialization hook
      await this.beforeInit();
      
      // Setup DOM
      this.setupDOM();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup child components
      await this.setupChildComponents();
      
      // Post-initialization hook
      await this.afterInit();
      
      this.isInitialized = true;
      this.log('Component initialized successfully');
      
      // Publish initialization event
      eventBus.publish(EVENTS.UI_LOADING_END, {
        component: this.componentId,
        type: this.constructor.name
      });
      
    } catch (error) {
      console.error(`Failed to initialize ${this.constructor.name}:`, error);
      eventBus.publish(EVENTS.DATA_ERROR, {
        source: this.componentId,
        error: error.message,
        operation: 'initialize'
      });
      throw error;
    }
  }
  
  /**
   * Pre-initialization hook
   * Override in subclasses for custom setup
   */
  async beforeInit() {
    // Default: no-op
  }
  
  /**
   * Setup DOM structure and styling
   * Override in subclasses for component-specific DOM setup
   */
  setupDOM() {
    if (!this.element) return;
    
    // Add component class
    if (this.options.className) {
      this.element.classList.add(this.options.className);
    }
    
    // Add component-specific class
    const componentClass = this.constructor.name.toLowerCase().replace('component', '');
    this.element.classList.add(`${componentClass}-component`);
    
    // Set attributes
    Object.entries(this.options.attributes).forEach(([key, value]) => {
      this.element.setAttribute(key, value);
    });
    
    // Add component ID for debugging
    if (this.options.debugMode) {
      this.element.setAttribute('data-component-id', this.componentId);
    }
  }
  
  /**
   * Setup event listeners
   * Override in subclasses for component-specific events
   */
  setupEventListeners() {
    // Default: no-op
    // Subclasses should override this method
  }
  
  /**
   * Setup child components
   * Override in subclasses to initialize child components
   */
  async setupChildComponents() {
    // Default: no-op
    // Subclasses should override this method
  }
  
  /**
   * Post-initialization hook
   * Override in subclasses for final setup steps
   */
  async afterInit() {
    // Default: no-op
  }
  
  /**
   * Subscribe to EventBus events with automatic cleanup
   * @param {string} eventName - Event name
   * @param {Function} callback - Event callback
   * @param {Object} context - Optional context for callback
   */
  subscribe(eventName, callback, context = null) {
    const unsubscribe = eventBus.subscribe(eventName, callback, context);
    this.eventSubscriptions.push(unsubscribe);
    return unsubscribe;
  }
  
  /**
   * Publish event through EventBus
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  publish(eventName, data) {
    eventBus.publish(eventName, data);
  }
  
  /**
   * Add child component with automatic lifecycle management
   * @param {BaseComponent} component - Child component
   */
  addChild(component) {
    if (!(component instanceof BaseComponent)) {
      throw new Error('Child must be an instance of BaseComponent');
    }
    
    this.childComponents.push(component);
    
    // Initialize child if parent is already initialized
    if (this.isInitialized && !component.isInitialized) {
      component.initialize();
    }
  }
  
  /**
   * Remove child component
   * @param {BaseComponent} component - Child component to remove
   */
  removeChild(component) {
    const index = this.childComponents.indexOf(component);
    if (index !== -1) {
      this.childComponents.splice(index, 1);
      component.destroy();
    }
  }
  
  /**
   * Update component with new options
   * @param {Object} newOptions - New options to merge
   */
  update(newOptions = {}) {
    if (this.isDestroyed) return;
    
    this.log('Updating component...');
    
    // Merge new options
    this.options = { ...this.options, ...newOptions };
    
    // Call update hook
    this.onUpdate(newOptions);
    
    this.log('Component updated');
  }
  
  /**
   * Update hook for subclasses
   * @param {Object} newOptions - New options
   */
  onUpdate(newOptions) {
    // Default: no-op
    // Subclasses should override this method
  }
  
  /**
   * Show the component
   */
  show() {
    if (this.element && this.element.style) {
      this.element.style.display = '';
      this.element.classList.remove('hidden');
    }
    this.onShow();
  }
  
  /**
   * Hide the component
   */
  hide() {
    if (this.element && this.element.style) {
      this.element.style.display = 'none';
      this.element.classList.add('hidden');
    }
    this.onHide();
  }
  
  /**
   * Show hook for subclasses
   */
  onShow() {
    // Default: no-op
  }
  
  /**
   * Hide hook for subclasses
   */
  onHide() {
    // Default: no-op
  }
  
  /**
   * Enable the component
   */
  enable() {
    if (this.element) {
      this.element.classList.remove('disabled');
      if (this.element.disabled !== undefined) {
        this.element.disabled = false;
      }
    }
    this.onEnable();
  }
  
  /**
   * Disable the component
   */
  disable() {
    if (this.element) {
      this.element.classList.add('disabled');
      if (this.element.disabled !== undefined) {
        this.element.disabled = true;
      }
    }
    this.onDisable();
  }
  
  /**
   * Enable hook for subclasses
   */
  onEnable() {
    // Default: no-op
  }
  
  /**
   * Disable hook for subclasses
   */
  onDisable() {
    // Default: no-op
  }
  
  /**
   * Get component state
   * @returns {Object} Component state
   */
  getState() {
    return {
      componentId: this.componentId,
      isInitialized: this.isInitialized,
      isDestroyed: this.isDestroyed,
      isVisible: this.element ? this.element.style.display !== 'none' : false,
      isEnabled: this.element ? !this.element.classList.contains('disabled') : true,
      childCount: this.childComponents.length,
      subscriptionCount: this.eventSubscriptions.length
    };
  }
  
  /**
   * Validate component state
   * @returns {boolean} True if component is in valid state
   */
  validate() {
    if (this.isDestroyed) {
      this.log('Component is destroyed', 'warn');
      return false;
    }
    
    if (!this.isInitialized) {
      this.log('Component is not initialized', 'warn');
      return false;
    }
    
    if (!this.element) {
      this.log('Component has no DOM element', 'warn');
      return false;
    }
    
    return true;
  }
  
  /**
   * Find child component by type or ID
   * @param {string|Function} typeOrId - Component type or ID
   * @returns {BaseComponent|null} Found component
   */
  findChild(typeOrId) {
    return this.childComponents.find(child => {
      if (typeof typeOrId === 'string') {
        return child.componentId === typeOrId;
      } else if (typeof typeOrId === 'function') {
        return child instanceof typeOrId;
      }
      return false;
    });
  }
  
  /**
   * Find all child components by type
   * @param {Function} ComponentType - Component class
   * @returns {Array} Found components
   */
  findChildrenByType(ComponentType) {
    return this.childComponents.filter(child => child instanceof ComponentType);
  }
  
  /**
   * Log messages with component context
   * @param {string} message - Log message
   * @param {string} level - Log level ('log', 'warn', 'error')
   */
  log(message, level = 'log') {
    if (this.options.debugMode || level !== 'log') {
      const prefix = `[${this.constructor.name}:${this.componentId.slice(-8)}]`;
      console[level](`${prefix} ${message}`);
    }
  }
  
  /**
   * Destroy the component and clean up resources
   */
  destroy() {
    if (this.isDestroyed) return;
    
    this.log('Destroying component...');
    
    try {
      // Call pre-destroy hook
      this.beforeDestroy();
      
      // Destroy child components
      this.childComponents.forEach(child => child.destroy());
      this.childComponents = [];
      
      // Unsubscribe from all events
      this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
      this.eventSubscriptions = [];
      
      // Clean up DOM
      this.cleanupDOM();
      
      // Call post-destroy hook
      this.afterDestroy();
      
      this.isDestroyed = true;
      this.log('Component destroyed successfully');
      
    } catch (error) {
      console.error(`Error destroying ${this.constructor.name}:`, error);
    }
  }
  
  /**
   * Pre-destroy hook
   * Override in subclasses for cleanup
   */
  beforeDestroy() {
    // Default: no-op
  }
  
  /**
   * Clean up DOM elements and event listeners
   */
  cleanupDOM() {
    if (this.element) {
      // Remove component-specific classes
      const componentClass = this.constructor.name.toLowerCase().replace('component', '');
      this.element.classList.remove(`${componentClass}-component`);
      
      if (this.options.className) {
        this.element.classList.remove(this.options.className);
      }
      
      // Remove component ID
      this.element.removeAttribute('data-component-id');
    }
  }
  
  /**
   * Post-destroy hook
   * Override in subclasses for final cleanup
   */
  afterDestroy() {
    // Default: no-op
  }
}

export default BaseComponent;
