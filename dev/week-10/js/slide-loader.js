/**
 * Slide Loader - Dynamically loads slide sections from external files
 */

export async function loadSlides(slideSections) {
  const slidesContainer = document.querySelector('.reveal .slides');

  if (!slidesContainer) {
    console.error('Reveal.js slides container not found');
    return;
  }

  // Load all slide sections in order
  for (const section of slideSections) {
    try {
      const response = await fetch(section.file);

      if (!response.ok) {
        console.error(`Failed to load ${section.file}: ${response.status}`);
        continue;
      }

      const html = await response.text();

      // Create a temporary container to parse the HTML
      const temp = document.createElement('div');
      temp.innerHTML = html;

      // Append all child elements to the slides container and tag with section name
      while (temp.firstChild) {
        const element = temp.firstChild;
        // Add section name as data attribute if it's a section element
        if (element.tagName === 'SECTION') {
          element.setAttribute('data-section-name', section.name);
        }
        slidesContainer.appendChild(element);
      }

      console.log(`✓ Loaded: ${section.name}`);
    } catch (error) {
      console.error(`Error loading ${section.file}:`, error);
    }
  }
}
