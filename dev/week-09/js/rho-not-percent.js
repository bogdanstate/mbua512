/**
 * ρ is Not a Percent, R² Is
 *
 * Clarifies the difference between correlation coefficient and R-squared.
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 40px;">
      <div style="max-width: 1000px; margin: 0 auto;">
        <div style="display: flex; gap: 40px; align-items: stretch;">
          <!-- ρ is not a percent -->
          <div style="flex: 1; background: #ffebee; padding: 40px; border-radius: 16px; border-left: 6px solid #e74c3c;">
            <h2 style="color: #e74c3c; font-size: 1.8em; margin: 0 0 20px 0;">ρ is NOT a Percent</h2>
            <p style="font-size: 1.5em; color: #333; margin: 0 0 15px 0; line-height: 1.6;">
              <strong style="color: #e74c3c;">ρ = 0.70</strong><br>
              <span style="font-size: 0.9em; color: #666;">≠ "70% related"</span>
            </p>
            <p style="font-size: 1.2em; color: #555; margin: 0; line-height: 1.5;">
              It's a <em>ratio</em> describing the strength of linear association.
            </p>
          </div>
          <!-- R² is a percent -->
          <div style="flex: 1; background: #e8f5e9; padding: 40px; border-radius: 16px; border-left: 6px solid #27ae60;">
            <h2 style="color: #27ae60; font-size: 1.8em; margin: 0 0 20px 0;">R² IS a Percent</h2>
            <p style="font-size: 1.5em; color: #333; margin: 0 0 15px 0; line-height: 1.6;">
              <strong style="color: #27ae60;">R² = 0.49</strong><br>
              <span style="font-size: 0.9em; color: #666;">= "49% of variance explained"</span>
            </p>
            <p style="font-size: 1.2em; color: #555; margin: 0; line-height: 1.5;">
              Since R² = ρ², squaring reduces the value!
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #fff3e0; border-radius: 12px;">
          <p style="font-size: 1.4em; color: #333; margin: 0;">
            <strong>Example:</strong> ρ = 0.7 → R² = 0.49 (only 49% explained!)
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
