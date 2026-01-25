/**
 * Large R² Means Better Predictions
 *
 * Shows how higher R² leads to more accurate predictions.
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 40px;">
      <div style="max-width: 1100px; margin: 0 auto;">
        <h2 style="text-align: center; font-size: 2.2em; margin: 0 0 40px 0; color: #1565c0;">
          Large R² = Better Predictions
        </h2>
        <div style="display: flex; gap: 40px; align-items: stretch;">
          <!-- Low R² -->
          <div style="flex: 1; background: #ffebee; padding: 40px; border-radius: 16px; border-left: 6px solid #e74c3c;">
            <h3 style="color: #e74c3c; font-size: 1.6em; margin: 0 0 20px 0;">Low R²</h3>
            <p style="font-size: 1.8em; color: #e74c3c; margin: 0 0 15px 0;">
              <strong>R² = 0.10</strong>
            </p>
            <p style="font-size: 1.3em; color: #333; margin: 0 0 15px 0; line-height: 1.6;">
              Only 10% of variance explained
            </p>
            <p style="font-size: 1.2em; color: #666; margin: 0; line-height: 1.5;">
              → Predictions have <strong>high uncertainty</strong><br>
              → Large prediction errors<br>
              → Weak predictive power
            </p>
          </div>
          <!-- High R² -->
          <div style="flex: 1; background: #e8f5e9; padding: 40px; border-radius: 16px; border-left: 6px solid #27ae60;">
            <h3 style="color: #27ae60; font-size: 1.6em; margin: 0 0 20px 0;">High R²</h3>
            <p style="font-size: 1.8em; color: #27ae60; margin: 0 0 15px 0;">
              <strong>R² = 0.85</strong>
            </p>
            <p style="font-size: 1.3em; color: #333; margin: 0 0 15px 0; line-height: 1.6;">
              85% of variance explained
            </p>
            <p style="font-size: 1.2em; color: #666; margin: 0; line-height: 1.5;">
              → Predictions have <strong>low uncertainty</strong><br>
              → Small prediction errors<br>
              → Strong predictive power
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; border: 2px solid #1976d2;">
          <p style="font-size: 1.5em; color: #1565c0; margin: 0; font-weight: 500;">
            Higher R² → Narrower confidence bands → More reliable predictions
          </p>
        </div>
      </div>
    </div>
  `;

  return {
    destroy() {}
  };
}

export default { init };
