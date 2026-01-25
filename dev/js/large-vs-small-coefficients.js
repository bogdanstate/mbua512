/**
 * Large vs Small Correlation Coefficients
 *
 * Shows the comparison between large and small correlation coefficients.
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 40px;">
      <div style="max-width: 1000px; margin: 0 auto;">
        <div style="display: flex; gap: 40px; align-items: stretch;">
          <!-- Large coefficients -->
          <div style="flex: 1; background: #e8f5e9; padding: 40px; border-radius: 16px; border-left: 6px solid #27ae60;">
            <h2 style="color: #27ae60; font-size: 1.8em; margin: 0 0 20px 0;">Large Coefficients</h2>
            <p style="font-size: 1.5em; color: #333; margin: 0; line-height: 1.6;">
              Closer to <strong style="color: #27ae60;">±1.00</strong><br>
              <span style="font-size: 0.9em; color: #666;">→ Stronger relationships</span>
            </p>
          </div>
          <!-- Small coefficients -->
          <div style="flex: 1; background: #fff3e0; padding: 40px; border-radius: 16px; border-left: 6px solid #ff9800;">
            <h2 style="color: #ff9800; font-size: 1.8em; margin: 0 0 20px 0;">Small Coefficients</h2>
            <p style="font-size: 1.5em; color: #333; margin: 0; line-height: 1.6;">
              Close to <strong style="color: #ff9800;">0.00</strong><br>
              <span style="font-size: 0.9em; color: #666;">→ Weaker relationships</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    destroy() {}
  };
}

export default { init };
