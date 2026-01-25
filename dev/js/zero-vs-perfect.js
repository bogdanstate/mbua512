/**
 * Zero vs Perfect Correlation
 *
 * Shows the spectrum from no relationship to perfect relationship.
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 40px;">
      <div style="max-width: 900px; margin: 0 auto; text-align: center;">
        <div style="display: flex; justify-content: center; align-items: center; gap: 60px;">
          <!-- Zero -->
          <div style="text-align: center;">
            <div style="font-size: 4em; color: #ff9800; font-weight: 300;">ρ = 0.00</div>
            <p style="font-size: 1.6em; color: #666; margin-top: 20px;">No relationship</p>
          </div>
          <!-- Divider -->
          <div style="font-size: 3em; color: #ccc;">↔</div>
          <!-- Perfect -->
          <div style="text-align: center;">
            <div style="font-size: 4em; color: #27ae60; font-weight: 300;">ρ = ±1.00</div>
            <p style="font-size: 1.6em; color: #666; margin-top: 20px;">Perfect relationship</p>
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
