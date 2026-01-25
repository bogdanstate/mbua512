/**
 * Slide Framework - Slide Generator
 *
 * Generates slides from YAML configuration.
 * Uses js-yaml for parsing (loaded via CDN or npm).
 *
 * @example
 * import { SlideGenerator } from './core/slide-generator.js';
 *
 * const generator = new SlideGenerator();
 * await generator.loadFromUrl('presentation.yml');
 * generator.render(document.querySelector('.sf-slides'));
 */

export class SlideGenerator {
  constructor(options = {}) {
    this.options = {
      templatePath: 'templates/',
      ...options
    };

    this.config = null;
    this.templates = new Map();
    this.customTemplates = new Map();

    // Register built-in templates
    this._registerBuiltInTemplates();
  }

  /**
   * Register built-in slide templates
   * @private
   */
  _registerBuiltInTemplates() {
    // Title slide
    this.templates.set('title', (slide) => {
      const bgStyle = slide.background
        ? `background: url('${slide.background}') center/cover no-repeat;`
        : '';
      const overlay = slide.overlay !== undefined
        ? `<div class="sf-slide__overlay" style="background: rgba(0,0,0,${slide.overlay});"></div>`
        : '';

      return `
        <div class="sf-slide sf-slide--lead sf-slide--bg" style="${bgStyle}">
          ${overlay}
          <div class="sf-slide__content">
            <h1>${slide.title || ''}</h1>
            ${slide.subtitle ? `<p class="subtitle">${slide.subtitle}</p>` : ''}
            ${slide.authors ? `<p class="authors">${Array.isArray(slide.authors) ? slide.authors.join(' & ') : slide.authors}</p>` : ''}
          </div>
          ${slide.attribution ? `<p class="attribution">${slide.attribution}</p>` : ''}
        </div>
      `;
    });

    // Section interstitial
    this.templates.set('section', (slide) => {
      return `
        <div class="sf-slide sf-slide--section">
          <h1>${slide.number ? `${slide.number}. ` : ''}${slide.title || ''}</h1>
        </div>
      `;
    });

    // Content slide with bullets
    this.templates.set('content', (slide) => {
      const bullets = slide.bullets
        ? `<ul>${slide.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`
        : '';

      // Support positioned images
      let images = '';
      if (slide.image) {
        const position = slide.imagePosition || 'upper-right';
        const size = slide.imageSize || 'medium';

        const positions = {
          'upper-right': 'top: 80px; right: 40px;',
          'lower-right': 'bottom: 40px; right: 40px;',
          'lower-left': 'bottom: 40px; left: 40px;',
          'upper-left': 'top: 80px; left: 40px;'
        };

        const sizes = {
          'small': 'max-width: 200px; max-height: 200px;',
          'medium': 'max-width: 300px; max-height: 300px;',
          'large': 'max-width: 400px; max-height: 400px;'
        };

        const posStyle = positions[position] || positions['upper-right'];
        const sizeStyle = sizes[size] || sizes['medium'];

        images = `<img src="${slide.image}" alt="${slide.imageAlt || ''}"
                      style="position: absolute; ${posStyle} ${sizeStyle} object-fit: contain; z-index: 10;">`;
      }

      return `
        <div class="sf-slide sf-slide--content" style="position: relative;">
          <h1>${slide.title || ''}</h1>
          ${bullets}
          ${slide.note ? `<p class="note">${slide.note}</p>` : ''}
          ${images}
        </div>
      `;
    });

    // Image slide
    this.templates.set('image', (slide) => {
      return `
        <div class="sf-slide sf-slide--full" style="justify-content: center; align-items: center;">
          <img src="${slide.src}" alt="${slide.alt || ''}" style="max-width: 90%; max-height: 90%; object-fit: contain;">
          ${slide.caption ? `<p class="caption">${slide.caption}</p>` : ''}
        </div>
      `;
    });

    // Two-column slide
    this.templates.set('two-column', (slide) => {
      const renderCol = (col) => {
        if (!col) return '';
        if (col.type === 'image') {
          return `<img src="${col.src}" alt="${col.alt || ''}" style="max-width: 100%; max-height: 100%;">`;
        }
        if (col.type === 'content') {
          const bullets = col.bullets
            ? `<ul>${col.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`
            : '';
          return `${col.title ? `<h2>${col.title}</h2>` : ''}${bullets}`;
        }
        if (col.html) {
          return col.html;
        }
        return '';
      };

      return `
        <div class="sf-slide sf-slide--two-col">
          <div class="sf-columns">
            <div class="sf-col">${renderCol(slide.left)}</div>
            <div class="sf-col">${renderCol(slide.right)}</div>
          </div>
        </div>
      `;
    });

    // Code slide (Smart Plot)
    this.templates.set('code', (slide) => {
      const id = slide.id || `sp-${Date.now()}`;
      // Store preload code in data attribute (escaped for HTML)
      const preloadAttr = slide.preload
        ? ` data-preload="${this._escapeHtml(slide.preload)}"`
        : '';
      return `
        <div class="sf-slide sf-slide--code">
          <div class="sf-smart-plot sf-smart-plot--full" id="${id}-container"${preloadAttr}>
            <div class="sf-smart-plot__header">
              <span class="sf-smart-plot__title">${slide.title || 'R Code'}</span>
              <button class="sf-smart-plot__btn" id="${id}-run" disabled>
                <span class="icon">▶</span>
                <span class="label">Run</span>
              </button>
            </div>
            <div class="sf-smart-plot__content">
              <textarea class="sf-smart-plot__editor${slide.fontSize === 'large' ? ' sf-smart-plot__editor--lg' : ''}" id="${id}-editor">${slide.code || ''}</textarea>
              <div class="sf-smart-plot__output" id="${id}-output"></div>
            </div>
            <div class="sf-smart-plot__status" id="${id}-status">Waiting for WebR...</div>
          </div>
        </div>
      `;
    });

    // Interactive slide (custom JS)
    this.templates.set('interactive', (slide) => {
      const id = slide.id || `interactive-${Date.now()}`;
      return `
        <div class="sf-slide sf-slide--content sf-slide--interactive" id="${id}" data-interactive="${id}" data-script="${slide.script || ''}" data-config='${JSON.stringify(slide.config || {})}'>
          ${slide.title ? `<h1>${slide.title}</h1>` : ''}
          <div class="sf-interactive-content" id="${id}-content">
            <p style="color: var(--sf-color-text-muted);">Loading interactive: ${id}...</p>
          </div>
        </div>
      `;
    });

    // Quote slide
    this.templates.set('quote', (slide) => {
      return `
        <div class="sf-slide sf-slide--content" style="justify-content: center;">
          <blockquote style="font-size: 1.4em; font-style: italic; border-left: 5px solid var(--sf-color-primary); padding-left: 30px; max-width: 800px;">
            "${slide.text}"
          </blockquote>
          ${slide.author ? `<p style="margin-top: 20px; color: var(--sf-color-text-muted);">— ${slide.author}</p>` : ''}
        </div>
      `;
    });

    // HTML slide (raw HTML)
    this.templates.set('html', (slide) => {
      return `
        <div class="sf-slide ${slide.class || ''}">
          ${slide.html || ''}
        </div>
      `;
    });

    // Transcription slide (side-by-side comparison)
    this.templates.set('transcription', (slide) => {
      const originalImg = slide.original || '';
      const slideNum = slide.slideNum || '';

      console.log(`Transcription slide ${slideNum}: original image = "${originalImg}"`);

      // Render the ported slide based on its type
      let portedContent = '';
      if (slide.ported && slide.ported.type) {
        const portedTemplate = this.templates.get(slide.ported.type);
        if (portedTemplate) {
          // Create a temporary div to extract just the content
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = portedTemplate(slide.ported);
          const slideContent = tempDiv.querySelector('.sf-slide');
          portedContent = slideContent ? slideContent.innerHTML : '';
        }
      }

      return `
        <div class="sf-slide sf-slide--transcription">
          <div class="sf-transcription-header">
            <h2>${slide.title || `Slide ${slideNum}`}</h2>
            <span class="sf-transcription-badge">Transcription Mode</span>
          </div>
          <div class="sf-transcription-compare">
            <div class="sf-transcription-pane" style="min-height: 300px;">
              <h3>Original (PowerPoint)</h3>
              <div class="sf-transcription-original" style="min-height: 300px; background: #f0f0f0; padding: 10px; border-radius: 8px; display: flex; align-items: flex-start; justify-content: center;">
                <img src="${originalImg}" alt="Original slide ${slideNum}"
                     style="width: 100%; max-width: 100%; height: auto; display: block; border: 2px solid #ddd; border-radius: 8px;"
                     onload="console.log('Image loaded successfully: ${originalImg}');"
                     onerror="console.error('Failed to load image: ${originalImg}'); this.style.border='2px solid red'; this.alt='Image failed to load: ${originalImg}';">
              </div>
            </div>
            <div class="sf-transcription-pane">
              <h3>Ported (Slide Framework)</h3>
              <div class="sf-transcription-ported">
                ${portedContent}
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  /**
   * Register a custom template
   * @param {string} name - Template name
   * @param {Function} renderer - Function that takes slide config and returns HTML
   */
  registerTemplate(name, renderer) {
    this.customTemplates.set(name, renderer);
  }

  /**
   * Load configuration from YAML string
   * @param {string} yamlString - YAML content
   */
  loadFromString(yamlString) {
    // Use js-yaml if available, otherwise expect pre-parsed JSON
    if (typeof jsyaml !== 'undefined') {
      this.config = jsyaml.load(yamlString);
    } else {
      throw new Error('js-yaml library not loaded. Include it via CDN or npm.');
    }

    // Register any custom templates from config
    if (this.config.templates) {
      for (const [name, templateConfig] of Object.entries(this.config.templates)) {
        if (templateConfig.html) {
          this.registerTemplate(name, (slide) => {
            return this._interpolate(templateConfig.html, slide);
          });
        }
      }
    }

    return this.config;
  }

  /**
   * Load configuration from URL
   * @param {string} url - URL to YAML file
   */
  async loadFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    const yamlString = await response.text();
    return this.loadFromString(yamlString);
  }

  /**
   * Load configuration from JSON object
   * @param {Object} config - Configuration object
   */
  loadFromObject(config) {
    this.config = config;
    return this.config;
  }

  /**
   * Simple template interpolation
   * @private
   */
  _interpolate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  /**
   * Escape HTML special characters
   * @private
   */
  _escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Render a single slide
   * @param {Object} slideConfig - Slide configuration
   * @returns {string} HTML string
   */
  renderSlide(slideConfig) {
    let type = slideConfig.type || 'content';

    // Check if transcription mode should be enabled
    const hasTranscriptionParam = window.location.search.includes('transcription');

    // If this is a transcription slide but transcription mode is not enabled,
    // render the ported version instead
    if (type === 'transcription' && !hasTranscriptionParam) {
      console.log(`Transcription mode disabled - rendering ported slide instead (type: ${slideConfig.ported?.type})`);
      if (slideConfig.ported && slideConfig.ported.type) {
        return this.renderSlide(slideConfig.ported);
      }
    } else if (type === 'transcription' && hasTranscriptionParam) {
      console.log('Transcription mode enabled - showing side-by-side comparison');
    }

    // Check custom templates first
    if (this.customTemplates.has(type)) {
      return this.customTemplates.get(type)(slideConfig);
    }

    // Then built-in templates
    if (this.templates.has(type)) {
      return this.templates.get(type)(slideConfig);
    }

    console.warn(`Unknown slide type: ${type}`);
    return `<div class="sf-slide"><p>Unknown slide type: ${type}</p></div>`;
  }

  /**
   * Render all slides to a container
   * @param {HTMLElement} container - Container element
   */
  render(container) {
    if (!this.config || !this.config.slides) {
      throw new Error('No configuration loaded');
    }

    const slidesHtml = this.config.slides
      .map((slide, index) => {
        const html = this.renderSlide(slide);
        // Add active class to first slide
        if (index === 0) {
          return html.replace('class="sf-slide', 'class="sf-slide active');
        }
        return html;
      })
      .join('\n');

    container.innerHTML = slidesHtml;

    return container;
  }

  /**
   * Get metadata from config
   * @returns {Object}
   */
  getMeta() {
    return this.config?.meta || {};
  }

  /**
   * Get WebR configuration
   * @returns {Object}
   */
  getWebRConfig() {
    return this.config?.config?.webr || {};
  }

  /**
   * Get datasets configuration
   * @returns {Object}
   */
  getDatasets() {
    return this.config?.config?.datasets || {};
  }

  /**
   * Get all code slides for SmartPlot initialization
   * @returns {Array}
   */
  getCodeSlides() {
    if (!this.config?.slides) return [];

    return this.config.slides
      .filter(s => s.type === 'code')
      .map(s => ({
        id: s.id,
        code: s.code,
        title: s.title,
        preload: s.preload || null
      }));
  }
}

export default SlideGenerator;
