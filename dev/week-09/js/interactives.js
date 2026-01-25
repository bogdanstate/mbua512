/**
 * Interactive Components Loader
 *
 * Maps interactive slide IDs to their module implementations.
 * Initializes each interactive when its slide becomes visible.
 */

// Map of interactive IDs to their module paths
const interactiveModules = {
  'datasaurus': './datasaurus.js',
  'rho-slider': './rho-slider.js',
  'r2-venn': './r2-venn.js',
  'stonks': './stonks.js',
  'least-squares': './least-squares.js',
  'fun-comparison': './fun-comparison.js',
  'chocolate': './chocolate.js',
  'normal-distribution': './normal-distribution.js',
  'linear-relationship': './linear-relationship.js',
  'ssr-visualization': './ssr-visualization.js',
  'annotated-summary': './annotated-summary.js',
  'confusion-matrix': './confusion-matrix.js',
  'sample-data-table': './sample-data-table.js',
  'homoscedasticity': './homoscedasticity.js',
  'chihuahua-detector': './chihuahua-detector.js',
  'large-vs-small-coefficients': './large-vs-small-coefficients.js',
  'zero-vs-perfect': './zero-vs-perfect.js',
  'single-summary-number': './single-summary-number.js',
  'rho-not-percent': './rho-not-percent.js',
  'large-r2-better': './large-r2-better.js',
};

// Store initialized instances for cleanup
const instances = new Map();

/**
 * Initialize all interactive components
 * @param {HTMLElement} container - The slides container
 */
export async function initAllInteractives(container) {
  // Find all interactive slides
  const interactiveSlides = container.querySelectorAll('[data-interactive]');

  for (const slide of interactiveSlides) {
    const id = slide.dataset.interactive;
    const contentContainer = slide.querySelector('.sf-interactive-content') || slide;

    if (interactiveModules[id]) {
      try {
        // Set up intersection observer to init when visible
        const observer = new IntersectionObserver(async (entries) => {
          if (entries[0].isIntersecting && !instances.has(id)) {
            console.log(`Initializing interactive: ${id}`);

            try {
              const module = await import(interactiveModules[id]);
              const config = slide.dataset.config ? JSON.parse(slide.dataset.config) : {};
              const instance = await module.init(contentContainer, config);
              instances.set(id, instance);
            } catch (err) {
              console.error(`Failed to initialize ${id}:`, err);
              contentContainer.innerHTML = `
                <div style="text-align: center; color: #e74c3c;">
                  <p>Error loading interactive: ${id}</p>
                  <p style="font-size: 0.8em;">${err.message}</p>
                </div>
              `;
            }

            observer.disconnect();
          }
        }, { threshold: 0.1 });

        observer.observe(slide);

      } catch (err) {
        console.warn(`Could not set up interactive ${id}:`, err);
      }
    } else {
      // No module found, show placeholder
      contentContainer.innerHTML = `
        <div style="text-align: center; color: var(--sf-color-text-muted);">
          <p style="font-size: 1.2em;">Interactive: ${id}</p>
          <p>Module not yet implemented</p>
        </div>
      `;
    }
  }
}

/**
 * Get an interactive instance by ID
 * @param {string} id - Interactive ID
 * @returns {Object|undefined} Instance if initialized
 */
export function getInstance(id) {
  return instances.get(id);
}

/**
 * Destroy all interactive instances
 */
export function destroyAll() {
  instances.forEach((instance, id) => {
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
  });
  instances.clear();
}

export default { initAllInteractives, getInstance, destroyAll };
