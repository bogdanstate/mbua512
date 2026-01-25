/**
 * Slide Framework - SmartPlot Class
 *
 * Interactive R code editor with output display.
 *
 * @example
 * import { SmartPlot } from './webr/smart-plot.js';
 * import { WebRManager } from './webr/webr-manager.js';
 *
 * const manager = new WebRManager({ packages: ['ggplot2'] });
 * await manager.init();
 *
 * const plot = new SmartPlot('my-plot', {
 *   webRManager: manager,
 *   code: 'plot(1:10)',
 *   title: 'My Plot'
 * });
 */

export class SmartPlot {
  /**
   * @param {string} id - Base ID for the smart plot elements
   * @param {Object} options - Configuration options
   * @param {WebRManager} options.webRManager - WebR manager instance
   * @param {string} [options.code] - Initial R code
   * @param {string} [options.preload] - R code to run before user code (data loading, etc.)
   * @param {string} [options.title] - Title displayed in header
   * @param {Object} [options.graphicsSize] - Graphics size { width, height }
   * @param {boolean} [options.autoRun] - Auto-run code on creation
   */
  constructor(id, options = {}) {
    this.id = id;
    this.options = {
      webRManager: null,
      code: '',
      preload: null,
      title: 'R Code',
      graphicsSize: { width: 1200, height: 750 },
      autoRun: false,
      ...options
    };
    this.preloadExecuted = false;

    // Find elements
    this.container = document.getElementById(`${id}-container`) || document.getElementById(id);
    this.runBtn = document.getElementById(`${id}-run`);
    this.editor = document.getElementById(`${id}-editor`);
    this.output = document.getElementById(`${id}-output`);
    this.status = document.getElementById(`${id}-status`);

    this.isShowingPlot = false;
    this.isRunning = false;

    // Validate elements
    if (!this.container) {
      console.warn(`SmartPlot: Container for "${id}" not found`);
      return;
    }

    this._init();
  }

  /**
   * Initialize the smart plot
   * @private
   */
  _init() {
    // Set initial code if provided
    if (this.options.code && this.editor) {
      this.editor.value = this.options.code;
    }

    // Setup run button
    if (this.runBtn) {
      this.runBtn.addEventListener('click', () => this.run());

      // Enable button when WebR is ready
      if (this.options.webRManager?.isReady()) {
        this.runBtn.disabled = false;
        this._setStatus('Ready', 'success');
      }
    }

    // Setup keyboard shortcut (Cmd/Ctrl + Enter)
    if (this.editor) {
      this.editor.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          this.run();
        }
      });
    }

    // Auto-run if specified
    if (this.options.autoRun && this.options.webRManager?.isReady()) {
      this.run();
    }
  }

  /**
   * Set status message
   * @private
   */
  _setStatus(message, type = 'info') {
    if (!this.status) return;

    this.status.textContent = message;
    this.status.className = 'sf-smart-plot__status';

    if (type === 'loading') {
      this.status.classList.add('loading');
      this.status.innerHTML = `<span class="sf-loader"></span>${message}`;
    } else if (type === 'error') {
      this.status.classList.add('error');
    } else if (type === 'success') {
      this.status.classList.add('success');
    }
  }

  /**
   * Show the output area
   * @private
   */
  _showOutput(isText = false) {
    if (this.editor) {
      this.editor.classList.add('hidden');
    }
    if (this.output) {
      this.output.classList.add('active');
      if (isText) {
        this.output.classList.add('text-output');
      } else {
        this.output.classList.remove('text-output');
      }
    }
    if (this.runBtn) {
      this.runBtn.innerHTML = '<span class="icon">↩</span><span class="label">Back</span>';
    }
    this.isShowingPlot = true;
  }

  /**
   * Show the editor
   * @private
   */
  _showEditor() {
    if (this.editor) {
      this.editor.classList.remove('hidden');
    }
    if (this.output) {
      this.output.classList.remove('active', 'text-output');
      this.output.innerHTML = '';
    }
    if (this.runBtn) {
      this.runBtn.innerHTML = '<span class="icon">▶</span><span class="label">Run</span>';
    }
    this.isShowingPlot = false;
  }

  /**
   * Run the R code
   */
  async run() {
    // If showing output, return to editor
    if (this.isShowingPlot) {
      this._showEditor();
      return;
    }

    // Validate
    if (!this.options.webRManager) {
      this._setStatus('WebR not configured', 'error');
      return;
    }

    if (!this.options.webRManager.isReady()) {
      this._setStatus('WebR not ready', 'error');
      return;
    }

    if (this.isRunning) return;

    const code = this.editor?.value || this.options.code;
    if (!code.trim()) {
      this._setStatus('No code to run', 'error');
      return;
    }

    this.isRunning = true;
    this._setStatus('Running...', 'loading');

    if (this.runBtn) {
      this.runBtn.disabled = true;
    }

    try {
      // Run preload code first (silently, only once)
      if (this.options.preload && !this.preloadExecuted) {
        this._setStatus('Loading data...', 'loading');
        const preloadResult = await this.options.webRManager.execute(this.options.preload);
        if (!preloadResult.success) {
          this._setStatus(`Preload error: ${preloadResult.error}`, 'error');
          return;
        }
        this.preloadExecuted = true;
      }

      const result = await this.options.webRManager.executeWithGraphics(
        code,
        this.options.graphicsSize
      );

      if (!result.success) {
        this._setStatus(`Error: ${result.error}`, 'error');
        return;
      }

      // Clear previous output
      if (this.output) {
        this.output.innerHTML = '';
      }

      // Display graphics if available
      if (result.images && result.images.length > 0) {
        this._renderGraphics(result.images);
        this._showOutput(false);
        this._setStatus('Plot generated successfully', 'success');
      }
      // Otherwise display text output
      else if (result.output) {
        this._renderText(result.output);
        this._showOutput(true);
        this._setStatus('Code executed successfully', 'success');
      }
      // No output
      else {
        this._setStatus('Code executed (no output)', 'success');
      }

    } catch (error) {
      this._setStatus(`Error: ${error.message}`, 'error');
    } finally {
      this.isRunning = false;
      if (this.runBtn) {
        this.runBtn.disabled = false;
      }
    }
  }

  /**
   * Render graphics output
   * @private
   */
  _renderGraphics(images) {
    if (!this.output) return;

    // Get the last image (most recent plot)
    const img = images[images.length - 1];
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    // WebR returns image elements, not ImageData
    ctx.drawImage(img, 0, 0);

    this.output.appendChild(canvas);
  }

  /**
   * Render text output
   * @private
   */
  _renderText(text) {
    if (!this.output) return;

    const pre = document.createElement('pre');
    pre.className = 'r-text-output';
    pre.textContent = text;
    this.output.appendChild(pre);
  }

  /**
   * Set the code in the editor
   * @param {string} code - R code
   */
  setCode(code) {
    if (this.editor) {
      this.editor.value = code;
    }
    this.options.code = code;
  }

  /**
   * Get the current code from the editor
   * @returns {string}
   */
  getCode() {
    return this.editor?.value || this.options.code;
  }

  /**
   * Enable the run button
   */
  enable() {
    if (this.runBtn) {
      this.runBtn.disabled = false;
    }
  }

  /**
   * Disable the run button
   */
  disable() {
    if (this.runBtn) {
      this.runBtn.disabled = true;
    }
  }

  /**
   * Initialize multiple SmartPlots
   * @param {Array} configs - Array of { id, code, title } configs
   * @param {WebRManager} webRManager - Shared WebR manager
   * @returns {Map} Map of id -> SmartPlot instance
   */
  static initAll(configs, webRManager) {
    const plots = new Map();

    for (const config of configs) {
      const plot = new SmartPlot(config.id, {
        webRManager,
        code: config.code,
        title: config.title,
        ...config
      });
      plots.set(config.id, plot);
    }

    return plots;
  }
}

export default SmartPlot;
