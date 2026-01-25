/**
 * Slide Framework - Navigation Module
 *
 * Handles slide navigation, keyboard controls, and page counter.
 *
 * @example
 * import { SlideNavigation } from './core/navigation.js';
 *
 * const nav = new SlideNavigation({
 *   container: '.sf-slides',
 *   onSlideChange: (current, total) => console.log(`Slide ${current + 1} of ${total}`)
 * });
 */

export class SlideNavigation {
  /**
   * @param {Object} options - Configuration options
   * @param {string} [options.container='.sf-slides'] - Selector for slides container
   * @param {string} [options.slideSelector='.sf-slide'] - Selector for individual slides
   * @param {string} [options.activeClass='active'] - Class name for active slide
   * @param {boolean} [options.wrapAround=true] - Whether to loop from last to first
   * @param {boolean} [options.keyboard=true] - Enable keyboard navigation
   * @param {boolean} [options.touch=true] - Enable touch/swipe navigation
   * @param {Function} [options.onSlideChange] - Callback when slide changes
   */
  constructor(options = {}) {
    this.options = {
      container: '.sf-slides',
      slideSelector: '.sf-slide',
      activeClass: 'active',
      wrapAround: true,
      keyboard: true,
      touch: true,
      onSlideChange: null,
      ...options
    };

    this.container = document.querySelector(this.options.container);
    if (!this.container) {
      console.warn(`SlideNavigation: Container "${this.options.container}" not found`);
      return;
    }

    this.slides = Array.from(this.container.querySelectorAll(this.options.slideSelector));
    this.current = 0;
    this.touchStartX = 0;
    this.touchEndX = 0;

    this._init();
  }

  /**
   * Initialize the navigation system
   * @private
   */
  _init() {
    // Find initially active slide
    const activeIndex = this.slides.findIndex(s => s.classList.contains(this.options.activeClass));
    if (activeIndex >= 0) {
      this.current = activeIndex;
    } else if (this.slides.length > 0) {
      this.slides[0].classList.add(this.options.activeClass);
    }

    // Setup keyboard navigation
    if (this.options.keyboard) {
      this._setupKeyboard();
    }

    // Setup touch navigation
    if (this.options.touch) {
      this._setupTouch();
    }

    // Trigger initial callback
    this._triggerCallback();
  }

  /**
   * Setup keyboard event listeners
   * @private
   */
  _setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          this.next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prev();
          break;
        case 'Home':
          e.preventDefault();
          this.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          this.goTo(this.slides.length - 1);
          break;
      }
    });
  }

  /**
   * Setup touch/swipe event listeners
   * @private
   */
  _setupTouch() {
    this.container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this._handleSwipe();
    }, { passive: true });
  }

  /**
   * Handle swipe gesture
   * @private
   */
  _handleSwipe() {
    const threshold = 50; // Minimum swipe distance
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.next(); // Swipe left = next
      } else {
        this.prev(); // Swipe right = prev
      }
    }
  }

  /**
   * Trigger the onSlideChange callback
   * @private
   */
  _triggerCallback() {
    if (typeof this.options.onSlideChange === 'function') {
      this.options.onSlideChange(this.current, this.slides.length, this.slides[this.current]);
    }
  }

  /**
   * Show a specific slide by index
   * @param {number} n - Slide index (0-based)
   */
  showSlide(n) {
    if (this.slides.length === 0) return;

    // Remove active class from current slide
    this.slides[this.current].classList.remove(this.options.activeClass);

    // Handle wrap-around or clamping
    if (this.options.wrapAround) {
      if (n < 0) {
        this.current = this.slides.length - 1;
      } else if (n >= this.slides.length) {
        this.current = 0;
      } else {
        this.current = n;
      }
    } else {
      this.current = Math.max(0, Math.min(n, this.slides.length - 1));
    }

    // Add active class to new slide
    this.slides[this.current].classList.add(this.options.activeClass);

    // Scroll to top of the page/container
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Also scroll the container to top if it's scrollable
    if (this.container.scrollTop > 0) {
      this.container.scrollTop = 0;
    }

    // Trigger callback
    this._triggerCallback();
  }

  /**
   * Go to next slide
   */
  next() {
    this.showSlide(this.current + 1);
  }

  /**
   * Go to previous slide
   */
  prev() {
    this.showSlide(this.current - 1);
  }

  /**
   * Go to specific slide
   * @param {number} n - Slide index (0-based)
   */
  goTo(n) {
    this.showSlide(n);
  }

  /**
   * Get current slide index
   * @returns {number}
   */
  getCurrentIndex() {
    return this.current;
  }

  /**
   * Get total number of slides
   * @returns {number}
   */
  getTotal() {
    return this.slides.length;
  }

  /**
   * Get current slide element
   * @returns {HTMLElement}
   */
  getCurrentSlide() {
    return this.slides[this.current];
  }
}

/**
 * Create navigation buttons UI
 *
 * @param {SlideNavigation} nav - Navigation instance
 * @param {Object} options - Button options
 * @returns {HTMLElement} Navigation element
 */
export function createNavButtons(nav, options = {}) {
  const {
    prevText = '← Prev',
    nextText = 'Next →',
    containerClass = 'sf-nav'
  } = options;

  const container = document.createElement('div');
  container.className = containerClass;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'sf-nav__btn';
  prevBtn.textContent = prevText;
  prevBtn.addEventListener('click', () => nav.prev());

  const nextBtn = document.createElement('button');
  nextBtn.className = 'sf-nav__btn';
  nextBtn.textContent = nextText;
  nextBtn.addEventListener('click', () => nav.next());

  container.appendChild(prevBtn);
  container.appendChild(nextBtn);

  document.body.appendChild(container);

  return container;
}

/**
 * Create page number display
 *
 * @param {SlideNavigation} nav - Navigation instance
 * @param {Object} options - Display options
 * @returns {HTMLElement} Page number element
 */
export function createPageNumber(nav, options = {}) {
  const {
    format = (current, total) => `${current + 1} / ${total}`,
    containerClass = 'sf-page-num'
  } = options;

  const container = document.createElement('div');
  container.className = containerClass;

  // Update on slide change
  const originalCallback = nav.options.onSlideChange;
  nav.options.onSlideChange = (current, total, slide) => {
    container.textContent = format(current, total);
    if (originalCallback) originalCallback(current, total, slide);
  };

  // Set initial value
  container.textContent = format(nav.getCurrentIndex(), nav.getTotal());

  document.body.appendChild(container);

  return container;
}

// Default export for convenience
export default SlideNavigation;
