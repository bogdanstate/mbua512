/**
 * Interactive R² Venn Diagram
 *
 * Visualizes the coefficient of determination (R²) as overlapping circles.
 * The overlap represents the shared variance between variables.
 */

export function init(container, config = {}) {
  const {
    canvasWidth = 700,
    canvasHeight = 300,
    radius = 100
  } = config;

  // Create HTML structure
  container.innerHTML = `
    <h2 style="font-size: 2em; color: #1a1a2e; font-weight: 400; margin-bottom: 20px; text-align: center;">
      What is the coefficient of determination <em style="font-style: normal; color: #2196f3;">R²</em>?
    </h2>

    <div style="display: flex; flex-direction: column; align-items: center;">
      <!-- Venn diagram canvas -->
      <canvas id="vennCanvas" width="${canvasWidth}" height="${canvasHeight}" style="margin-bottom: 20px;"></canvas>

      <!-- Slider -->
      <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 25px;">
        <span style="font-size: 1.2em; color: #666;">R² = 0</span>
        <input type="range" id="r2Slider" min="0" max="100" value="0"
               style="width: 400px; height: 25px; cursor: pointer;">
        <span style="font-size: 1.2em; color: #666;">R² = 1</span>
      </div>

      <!-- R² display -->
      <p id="r2Display" style="font-size: 2em; color: #2196f3; font-weight: 500; margin: 10px 0;">R² = 0.00</p>

      <!-- Explanation -->
      <div id="r2Explanation" style="background: #f5f5f5; padding: 25px 40px; border-radius: 12px; max-width: 800px; text-align: center; font-size: 1.3em; color: #333; line-height: 1.6;">
        There is <strong>no overlap</strong> between the two variables (No relationship)
      </div>
    </div>
  `;

  const canvas = container.querySelector('#vennCanvas');
  const ctx = canvas.getContext('2d');
  const slider = container.querySelector('#r2Slider');
  const display = container.querySelector('#r2Display');
  const explanation = container.querySelector('#r2Explanation');

  const width = canvas.width;
  const height = canvas.height;
  const centerY = height / 2;

  function drawVenn(r2) {
    ctx.clearRect(0, 0, width, height);

    // Calculate distance between centers based on R²
    const maxDist = 2 * radius;
    const distance = maxDist * (1 - r2);

    const cx1 = width / 2 - distance / 2;
    const cx2 = width / 2 + distance / 2;

    // Draw overlap area first
    if (r2 > 0 && r2 < 1) {
      ctx.globalCompositeOperation = 'source-over';

      // Left circle
      ctx.beginPath();
      ctx.arc(cx1, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
      ctx.fill();

      // Right circle
      ctx.beginPath();
      ctx.arc(cx2, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
      ctx.fill();

      // Intersection
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx1, centerY, radius, 0, 2 * Math.PI);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(cx2, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(142, 68, 173, 0.6)';
      ctx.fill();
      ctx.restore();
    } else if (r2 >= 1) {
      // Complete overlap
      ctx.beginPath();
      ctx.arc(width / 2, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(142, 68, 173, 0.7)';
      ctx.fill();
    } else {
      // No overlap
      ctx.beginPath();
      ctx.arc(cx1, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx2, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
      ctx.fill();
    }

    // Draw circle outlines
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx1, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(cx2, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Labels
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2980b9';
    ctx.fillText('Variable X', cx1, centerY + radius + 25);
    ctx.fillStyle = '#c0392b';
    ctx.fillText('Variable Y', cx2, centerY + radius + 25);
  }

  function updateExplanation(r2) {
    let text, bgColor;

    if (r2 === 0) {
      text = 'There is <strong>no overlap</strong> between the two variables (No relationship)';
      bgColor = '#ffebee';
    } else if (r2 < 0.3) {
      text = `There is <strong>little overlap</strong> between the two variables (Weak relationship)<br><span style="color: #666; font-size: 0.9em;">Overlap / Total area = R²</span>`;
      bgColor = '#fff3e0';
    } else if (r2 < 0.5) {
      text = `There is <strong>some overlap</strong> between the two variables (Moderate relationship)<br><span style="color: #666; font-size: 0.9em;">Overlap / Total area = R²</span>`;
      bgColor = '#fff8e1';
    } else if (r2 < 0.8) {
      text = `There is <strong>a lot of overlap</strong> between the two variables (Strong relationship)<br><span style="color: #666; font-size: 0.9em;">Overlap / Total area = R²</span>`;
      bgColor = '#e8f5e9';
    } else if (r2 < 1) {
      text = `There is <strong>substantial overlap</strong> between the two variables (Very strong relationship)<br><span style="color: #666; font-size: 0.9em;">Overlap / Total area = R²</span>`;
      bgColor = '#e3f2fd';
    } else {
      text = 'There is a <strong>deterministic relationship</strong> between the two variables.<br>Complete overlap — one variable perfectly predicts the other.';
      bgColor = '#e1bee7';
    }

    explanation.innerHTML = text;
    explanation.style.background = bgColor;
  }

  function update() {
    const r2 = slider.value / 100;
    display.textContent = `R² = ${r2.toFixed(2)}`;
    drawVenn(r2);
    updateExplanation(r2);
  }

  slider.addEventListener('input', update);

  // Initial draw
  update();

  return {
    destroy() {
      slider.removeEventListener('input', update);
    },
    setR2(value) {
      slider.value = value * 100;
      update();
    }
  };
}

export default { init };
