/**
 * Slide Framework - WebR Manager
 *
 * Manages WebR initialization, package installation, and code execution.
 *
 * @example
 * import { WebRManager } from './webr/webr-manager.js';
 *
 * const manager = new WebRManager({
 *   packages: ['ggplot2'],
 *   onStatus: (msg) => console.log(msg)
 * });
 *
 * await manager.init();
 * const result = await manager.execute('1 + 1');
 */

export class WebRManager {
  /**
   * @param {Object} options - Configuration options
   * @param {string} [options.webRUrl] - URL to WebR module
   * @param {string[]} [options.packages] - Packages to install
   * @param {Object} [options.datasets] - Datasets to preload { name: url }
   * @param {Function} [options.onStatus] - Status callback
   * @param {Object} [options.graphicsSize] - Default graphics size
   */
  constructor(options = {}) {
    this.options = {
      webRUrl: 'https://webr.r-wasm.org/latest/webr.mjs',
      packages: [],
      datasets: {},
      onStatus: null,
      graphicsSize: { width: 1200, height: 750 },
      ...options
    };

    this.webR = null;
    this.shelter = null;
    this.ready = false;
    this.initializing = false;
  }

  /**
   * Update status
   * @private
   */
  _status(message, type = 'info') {
    if (typeof this.options.onStatus === 'function') {
      this.options.onStatus(message, type);
    }
  }

  /**
   * Initialize WebR
   */
  async init() {
    if (this.ready) return this;
    if (this.initializing) {
      // Wait for existing initialization
      while (this.initializing) {
        await new Promise(r => setTimeout(r, 100));
      }
      return this;
    }

    this.initializing = true;

    try {
      this._status('Loading WebR...', 'loading');

      // Dynamic import of WebR
      const { WebR } = await import(this.options.webRUrl);
      this.webR = new WebR();
      await this.webR.init();

      this._status('WebR loaded, creating environment...', 'loading');

      // Create shelter for managing R objects
      this.shelter = await new this.webR.Shelter();

      // Install packages if specified
      if (this.options.packages.length > 0) {
        this._status(`Installing packages: ${this.options.packages.join(', ')}...`, 'loading');
        await this.webR.installPackages(this.options.packages);
      }

      // Load datasets if specified
      for (const [name, url] of Object.entries(this.options.datasets)) {
        await this.loadDataset(name, url);
      }

      this.ready = true;
      this._status('Ready!', 'success');

      return this;

    } catch (error) {
      this._status(`Error: ${error.message}`, 'error');
      throw error;
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Load a dataset from URL into R environment
   * @param {string} name - Variable name in R
   * @param {string} url - URL to CSV file
   */
  async loadDataset(name, url) {
    if (!this.shelter) {
      throw new Error('WebR not initialized');
    }

    this._status(`Loading dataset: ${name}...`, 'loading');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
      }

      const csvText = await response.text();

      // Parse CSV and create R data frame
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = {};

      headers.forEach(h => data[h] = []);

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        headers.forEach((h, j) => {
          const val = values[j]?.trim();
          // Try to parse as number
          const num = parseFloat(val);
          data[h].push(isNaN(num) ? val : num);
        });
      }

      // Create R vectors for each column
      for (const [col, values] of Object.entries(data)) {
        const isNumeric = values.every(v => typeof v === 'number');
        if (isNumeric) {
          await this.shelter.captureR(`${col} <- c(${values.join(', ')})`);
        } else {
          const escaped = values.map(v => `"${String(v).replace(/"/g, '\\"')}"`);
          await this.shelter.captureR(`${col} <- c(${escaped.join(', ')})`);
        }
      }

      // Also create a data frame
      await this.shelter.captureR(`${name} <- data.frame(${headers.join(', ')})`);

      return data;

    } catch (error) {
      this._status(`Error loading ${name}: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Load dataset from inline data
   * @param {string} name - Variable name in R
   * @param {Object} data - Data object { column: [values] }
   */
  async loadInlineData(name, data) {
    if (!this.shelter) {
      throw new Error('WebR not initialized');
    }

    const columns = Object.keys(data);

    for (const [col, values] of Object.entries(data)) {
      const isNumeric = values.every(v => typeof v === 'number');
      if (isNumeric) {
        await this.shelter.captureR(`${col} <- c(${values.join(', ')})`);
      } else {
        const escaped = values.map(v => `"${String(v).replace(/"/g, '\\"')}"`);
        await this.shelter.captureR(`${col} <- c(${escaped.join(', ')})`);
      }
    }

    await this.shelter.captureR(`${name} <- data.frame(${columns.join(', ')})`);
  }

  /**
   * Execute R code
   * @param {string} code - R code to execute
   * @returns {Object} Result with output and any errors
   */
  async execute(code) {
    if (!this.shelter) {
      throw new Error('WebR not initialized');
    }

    try {
      const result = await this.shelter.captureR(code, {
        withAutoprint: true,
        captureStreams: true,
        captureConditions: false
      });

      // Collect output
      let output = '';
      if (result.output) {
        for (const line of result.output) {
          if (line.type === 'stdout' || line.type === 'stderr') {
            output += line.data + '\n';
          }
        }
      }

      return {
        success: true,
        output: output.trim(),
        result: result.result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: ''
      };
    }
  }

  /**
   * Execute R code and capture graphics
   * @param {string} code - R code to execute
   * @param {Object} [size] - Graphics size { width, height }
   * @returns {Object} Result with output, images, and any errors
   */
  async executeWithGraphics(code, size = null) {
    if (!this.shelter) {
      throw new Error('WebR not initialized');
    }

    const { width, height } = size || this.options.graphicsSize;

    try {
      const result = await this.shelter.captureR(code, {
        withAutoprint: true,
        captureStreams: true,
        captureConditions: false,
        captureGraphics: {
          width: width,
          height: height,
          bg: 'white'
        }
      });

      // Collect output
      let output = '';
      if (result.output) {
        for (const line of result.output) {
          if (line.type === 'stdout' || line.type === 'stderr') {
            output += line.data + '\n';
          }
        }
      }

      // Collect images
      const images = [];
      if (result.images) {
        for (const img of result.images) {
          images.push(img);
        }
      }

      return {
        success: true,
        output: output.trim(),
        images: images,
        result: result.result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: '',
        images: []
      };
    }
  }

  /**
   * Check if WebR is ready
   * @returns {boolean}
   */
  isReady() {
    return this.ready;
  }

  /**
   * Get the shelter for direct R operations
   * @returns {Object}
   */
  getShelter() {
    return this.shelter;
  }

  /**
   * Get the WebR instance
   * @returns {Object}
   */
  getWebR() {
    return this.webR;
  }
}

export default WebRManager;
