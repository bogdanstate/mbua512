/**
 * Initialize all interactive components for Week 10 presentation
 */

import { initSoccerClustering } from './soccer-clustering.js';

export async function initAllInteractives(slidesContainer) {
  // Find all interactive slides
  const interactiveSlides = slidesContainer.querySelectorAll('[data-interactive]');

  console.log(`Found ${interactiveSlides.length} interactive slide(s)`);

  interactiveSlides.forEach(slide => {
    const interactiveId = slide.getAttribute('data-interactive');
    const script = slide.getAttribute('data-script');

    console.log(`Initializing interactive: ${interactiveId}, script: ${script}`);

    // Route to appropriate init function based on script name
    if (script === 'soccer-clustering') {
      const contentDiv = slide.querySelector('.sf-interactive-content');
      console.log(`Content div found: ${!!contentDiv}, ID will be: ${interactiveId}-content`);
      if (contentDiv) {
        contentDiv.id = `${interactiveId}-content`;
        try {
          initSoccerClustering(`${interactiveId}-content`);
          console.log(`Soccer clustering initialized for ${interactiveId}`);
        } catch (err) {
          console.error(`Failed to init soccer clustering:`, err);
        }
      } else {
        console.warn(`No .sf-interactive-content found in slide ${interactiveId}`);
      }
    }
  });
}
