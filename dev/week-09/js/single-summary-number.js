/**
 * Single Summary Number
 *
 * Explains that correlation provides a single summary number.
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 40px;">
      <div style="max-width: 950px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 50px 60px; border-radius: 20px; color: #1a1a2e; border: 2px solid #1976d2;">
          <h2 style="font-size: 2em; margin: 0 0 30px 0; font-weight: 400; color: #1565c0;">The Correlation Coefficient...</h2>
          <p style="font-size: 1.6em; line-height: 1.7; margin: 0; color: #333;">
            ...provides you with a <strong style="color: #1565c0;">single summary number</strong> telling you the average amount that a person's score on one variable is related to another variable.
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
