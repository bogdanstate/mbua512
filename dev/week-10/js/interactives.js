/**
 * Initialize all interactive components for Week 10 presentation
 */

import { initSoccerClustering } from './soccer-clustering.js';

export async function initAllInteractives(slidesContainer) {
  // Find all interactive slides
  const interactiveSlides = slidesContainer.querySelectorAll('[data-interactive]');

  interactiveSlides.forEach(slide => {
    const interactiveId = slide.getAttribute('data-interactive');
    const script = slide.getAttribute('data-script');

    console.log(`Initializing interactive: ${interactiveId}, script: ${script}`);

    // Route to appropriate init function based on script name
    if (script === 'soccer-clustering') {
      const contentDiv = slide.querySelector('.sf-interactive-content');
      if (contentDiv) {
        contentDiv.id = `${interactiveId}-content`;
        initSoccerClustering(`${interactiveId}-content`);
      }
    }
  });
}
