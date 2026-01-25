/**
 * Chocolate vs Nobel Laureates Visualization
 *
 * Demonstrates the famous spurious correlation between
 * chocolate consumption and Nobel laureates per capita.
 */

export function init(container, config = {}) {
  // Create HTML structure with R code
  container.innerHTML = `
    <div style="text-align: center; padding: 30px;">
      <h2 style="font-size: 2em; color: #1a1a2e; font-weight: 400; margin-bottom: 20px;">
        Chocolate Consumption vs Nobel Laureates
      </h2>
      <p style="font-size: 1.2em; color: #555; margin-bottom: 30px;">
        A famous example of <strong style="color: #e74c3c;">spurious correlation</strong>
      </p>
      <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; max-width: 800px; margin: 0 auto;">
        <img src="assets/chocolate-nobel.svg" alt="Chocolate vs Nobel Laureates"
             style="max-width: 100%; border-radius: 8px;"
             onerror="this.parentElement.innerHTML = createFallbackChart()">
      </div>
      <p style="margin-top: 20px; font-size: 0.9em; color: #888; max-width: 700px; margin-left: auto; margin-right: auto;">
        Source: Messerli, F.H. (2012). Chocolate Consumption, Cognitive Function, and Nobel Laureates.
        <br>New England Journal of Medicine, 367(16), 1562-1564.
      </p>
      <div style="margin-top: 30px; padding: 20px; background: #fff3e0; border-radius: 12px; max-width: 600px; margin-left: auto; margin-right: auto;">
        <p style="font-size: 1.1em; color: #e65100; margin: 0;">
          <strong>Remember:</strong> Correlation does not imply causation!
          <br><span style="font-size: 0.9em; color: #666;">Eating chocolate will not make you win a Nobel Prize.</span>
        </p>
      </div>
    </div>
  `;

  // Create fallback chart if image fails
  window.createFallbackChart = function() {
    return `
      <div style="padding: 40px; background: #fff; border: 2px dashed #ccc; border-radius: 8px;">
        <p style="font-size: 1.2em; color: #666;">
          📊 Countries with higher chocolate consumption tend to have more Nobel laureates per capita
        </p>
        <p style="font-size: 1em; color: #888; margin-top: 15px;">
          Switzerland 🇨🇭 and Sweden 🇸🇪 lead in both metrics!
        </p>
      </div>
    `;
  };

  return {
    destroy() {
      delete window.createFallbackChart;
    }
  };
}

export default { init };
