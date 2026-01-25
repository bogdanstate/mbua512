/**
 * Fun Comparison - Two Panel Image Comparison
 *
 * Shows "Fun During" vs "Fun After" side-by-side images
 * to illustrate the difference between Type 1 and Type 2 fun.
 */

export function init(container, config = {}) {
  const {
    leftImage = 'assets/remapstudio-JWn5aBvSNSU-unsplash.svg',
    rightImage = 'assets/public-domain-vectors-weoy0jlwQcU-unsplash.svg',
    leftTitle = 'Fun During',
    rightTitle = 'Fun After'
  } = config;

  // Create HTML structure
  container.innerHTML = `
    <div style="display: flex; width: 100%; height: 100%; min-height: 400px;">
      <!-- Left panel - Fun During -->
      <div style="flex: 1; position: relative; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <img src="${leftImage}" alt="${leftTitle}"
             style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;"
             onerror="this.style.display='none'">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center;">
          <h1 style="font-size: 3em; color: #fff; text-shadow: 0 4px 30px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5); margin: 0; font-weight: 400; text-align: center;">
            ${leftTitle}
          </h1>
        </div>
      </div>
      <!-- Right panel - Fun After -->
      <div style="flex: 1; position: relative; overflow: hidden; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        <img src="${rightImage}" alt="${rightTitle}"
             style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;"
             onerror="this.style.display='none'">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center;">
          <h1 style="font-size: 3em; color: #fff; text-shadow: 0 4px 30px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.5); margin: 0; font-weight: 400; text-align: center;">
            ${rightTitle}
          </h1>
        </div>
      </div>
    </div>
    <div style="position: absolute; bottom: 20px; left: 0; right: 0; text-align: center; font-size: 0.75em; color: rgba(255,255,255,0.7);">
      Type 1 Fun (enjoyable in the moment) vs Type 2 Fun (enjoyable in retrospect)
    </div>
  `;

  return {
    destroy() {
      // Nothing to clean up
    }
  };
}

export default { init };
