/**
 * Initialize all interactive components for Week 10 presentation
 */

import { initSoccerClustering } from './soccer-clustering.js';

export async function initAllInteractives(slidesContainer) {
  // Find all interactive slides
  const interactiveSlides = slidesContainer.querySelectorAll('[data-interactive]');

  console.log(`Found ${interactiveSlides.length} interactive slide(s)`);

  // Track which interactives have been initialized
  const initializedInteractives = new Set();

  // Function to initialize a specific interactive
  const initInteractive = (slide) => {
    const interactiveId = slide.getAttribute('data-interactive');
    const script = slide.getAttribute('data-script');

    // Skip if already initialized
    if (initializedInteractives.has(interactiveId)) {
      return;
    }

    console.log(`Initializing interactive: ${interactiveId}, script: ${script}`);

    // Route to appropriate init function based on script name
    if (script === 'soccer-clustering') {
      const contentDiv = slide.querySelector('.sf-interactive-content');
      console.log(`Content div found: ${!!contentDiv}, ID will be: ${interactiveId}-content`);
      if (contentDiv) {
        contentDiv.id = `${interactiveId}-content`;
        try {
          initSoccerClustering(`${interactiveId}-content`);
          initializedInteractives.add(interactiveId);
          console.log(`Soccer clustering initialized for ${interactiveId}`);
        } catch (err) {
          console.error(`Failed to init soccer clustering:`, err);
        }
      } else {
        console.warn(`No .sf-interactive-content found in slide ${interactiveId}`);
      }
    }
  };

  // Initialize interactives when their slide becomes active
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const slide = mutation.target;
        if (slide.classList.contains('active') && slide.hasAttribute('data-interactive')) {
          initInteractive(slide);
        }
      }
    });
  });

  // Observe each interactive slide for class changes
  interactiveSlides.forEach(slide => {
    observer.observe(slide, { attributes: true });
  });

  // IMPORTANT: Don't check for initially active slides here.
  // Let the MutationObserver handle it when user navigates.
  // If you land directly on an interactive slide via URL, you'll need
  // to manually navigate away and back to trigger initialization.
  console.log('Interactive observer set up - will initialize on slide navigation');
}
