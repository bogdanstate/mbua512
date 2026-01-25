/**
 * Slide Framework - Main Entry Point
 *
 * Import this file to get all framework components.
 *
 * @example
 * import { SlideNavigation, SlideGenerator, WebRManager, SmartPlot } from './js/index.js';
 */

// Core modules
export { SlideNavigation, createNavButtons, createPageNumber } from './core/navigation.js';
export { SlideGenerator } from './core/slide-generator.js';

// WebR modules
export { WebRManager } from './webr/webr-manager.js';
export { SmartPlot } from './webr/smart-plot.js';

/**
 * Initialize a complete presentation from YAML
 *
 * @param {Object} options - Configuration options
 * @param {string} options.yamlUrl - URL to YAML configuration file
 * @param {string} [options.container='.sf-slides'] - Slide container selector
 * @param {boolean} [options.createNav=true] - Create navigation buttons
 * @param {boolean} [options.createPageNum=true] - Create page number display
 * @returns {Object} { nav, generator, webRManager, smartPlots }
 *
 * @example
 * const app = await initPresentation({
 *   yamlUrl: 'presentation.yml'
 * });
 */
export async function initPresentation(options = {}) {
  const {
    yamlUrl,
    yamlString,
    config,
    container = '.sf-slides',
    createNav = true,
    createPageNum = true
  } = options;

  // Import modules dynamically to allow tree-shaking
  const { SlideNavigation, createNavButtons, createPageNumber } = await import('./core/navigation.js');
  const { SlideGenerator } = await import('./core/slide-generator.js');

  // Create slide generator
  const generator = new SlideGenerator();

  // Load configuration
  if (yamlUrl) {
    await generator.loadFromUrl(yamlUrl);
  } else if (yamlString) {
    generator.loadFromString(yamlString);
  } else if (config) {
    generator.loadFromObject(config);
  } else {
    throw new Error('No configuration provided. Pass yamlUrl, yamlString, or config.');
  }

  // Render slides
  const containerEl = document.querySelector(container);
  if (!containerEl) {
    throw new Error(`Container "${container}" not found`);
  }
  generator.render(containerEl);

  // Create navigation
  const nav = new SlideNavigation({ container });

  if (createNav) {
    createNavButtons(nav);
  }

  if (createPageNum) {
    createPageNumber(nav);
  }

  // Initialize WebR if configured
  let webRManager = null;
  let smartPlots = null;

  const webRConfig = generator.getWebRConfig();
  if (webRConfig.enabled) {
    const { WebRManager } = await import('./webr/webr-manager.js');
    const { SmartPlot } = await import('./webr/smart-plot.js');

    // Create status callback that updates all smart plot statuses
    const codeSlides = generator.getCodeSlides();
    const statusElements = codeSlides.map(s => document.getElementById(`${s.id}-status`)).filter(Boolean);

    const onStatus = (message, type) => {
      statusElements.forEach(el => {
        el.textContent = message;
        el.className = 'sf-smart-plot__status';
        if (type === 'loading') el.classList.add('loading');
        if (type === 'error') el.classList.add('error');
        if (type === 'success') el.classList.add('success');
      });
    };

    webRManager = new WebRManager({
      packages: webRConfig.packages || [],
      datasets: generator.getDatasets(),
      onStatus
    });

    // Initialize WebR
    await webRManager.init();

    // Initialize SmartPlots
    smartPlots = SmartPlot.initAll(
      codeSlides.map(s => ({
        id: s.id,
        code: s.code,
        title: s.title,
        webRManager
      })),
      webRManager
    );

    // Enable all run buttons
    smartPlots.forEach(plot => plot.enable());
  }

  return {
    nav,
    generator,
    webRManager,
    smartPlots
  };
}

export default initPresentation;
