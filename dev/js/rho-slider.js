/**
 * Interactive Correlation (ρ) Slider
 *
 * Shows how changing correlation affects the scatterplot pattern.
 * Uses Box-Muller transform to generate correlated normal data.
 */

export function init(container, config = {}) {
  const {
    canvasSize = 400,
    numPoints = 100
  } = config;

  // Create HTML structure
  container.innerHTML = `
    <div style="display: flex; align-items: stretch; gap: 30px; width: 100%; justify-content: center;">
      <!-- Scatterplot -->
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <canvas id="rhoCanvas" width="${canvasSize}" height="${canvasSize}"
                style="border: 1px solid #ddd; border-radius: 8px; background: #fafafa;"></canvas>
        <p id="rhoDisplay" style="margin-top: 15px; font-size: 1.4em; font-weight: 500;">ρ = 0.00</p>
      </div>

      <!-- Vertical slider -->
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 0;">
        <span style="font-size: 1.1em; color: #27ae60; font-weight: 500; margin-bottom: 10px;">+1.0</span>
        <input type="range" id="rhoSlider" min="-100" max="100" value="0"
               style="writing-mode: vertical-lr; direction: rtl; height: 300px; width: 30px; cursor: pointer;">
        <span style="font-size: 1.1em; color: #e74c3c; font-weight: 500; margin-top: 10px;">-1.0</span>
      </div>

      <!-- Explanation -->
      <div style="max-width: 300px; display: flex; flex-direction: column; gap: 15px;">
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #27ae60;">
          <strong style="color: #27ae60;">Positive ρ</strong>
          <p style="margin: 5px 0 0 0; font-size: 0.95em;">As X increases, Y tends to increase</p>
        </div>
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
          <strong style="color: #ff9800;">ρ ≈ 0</strong>
          <p style="margin: 5px 0 0 0; font-size: 0.95em;">No linear relationship</p>
        </div>
        <div style="background: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #e74c3c;">
          <strong style="color: #e74c3c;">Negative ρ</strong>
          <p style="margin: 5px 0 0 0; font-size: 0.95em;">As X increases, Y tends to decrease</p>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#rhoCanvas');
  const ctx = canvas.getContext('2d');
  const slider = container.querySelector('#rhoSlider');
  const display = container.querySelector('#rhoDisplay');

  // Box-Muller transform for normal random numbers
  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // Generate correlated points with given rho
  function generatePoints(rho, n = numPoints) {
    const points = [];
    for (let i = 0; i < n; i++) {
      const x = randn();
      const z = randn();
      const y = rho * x + Math.sqrt(1 - rho * rho) * z;
      points.push({ x, y });
    }
    return points;
  }

  // Draw scatterplot
  function drawPlot(rho) {
    const points = generatePoints(rho);
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.moveTo(width / 2, padding);
    ctx.lineTo(width / 2, height - padding);
    ctx.stroke();

    // Scale points to fit canvas (assuming range roughly -3 to 3)
    const scale = (width - 2 * padding) / 6;
    const cx = width / 2;
    const cy = height / 2;

    // Determine color based on rho
    let color;
    if (rho > 0.1) {
      color = `rgba(39, 174, 96, ${0.5 + Math.abs(rho) * 0.3})`;
    } else if (rho < -0.1) {
      color = `rgba(231, 76, 60, ${0.5 + Math.abs(rho) * 0.3})`;
    } else {
      color = 'rgba(255, 152, 0, 0.6)';
    }

    // Draw points
    ctx.fillStyle = color;
    for (const p of points) {
      const px = cx + p.x * scale;
      const py = cy - p.y * scale;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw axis labels
    ctx.fillStyle = '#999';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X', width - 20, height / 2 + 20);
    ctx.fillText('Y', width / 2 + 15, 25);
  }

  // Update display and redraw
  function update() {
    const rho = slider.value / 100;
    display.textContent = `ρ = ${rho.toFixed(2)}`;

    // Update display color
    if (rho > 0.1) {
      display.style.color = '#27ae60';
    } else if (rho < -0.1) {
      display.style.color = '#e74c3c';
    } else {
      display.style.color = '#ff9800';
    }

    drawPlot(rho);
  }

  slider.addEventListener('input', update);

  // Initial draw
  update();

  return {
    destroy() {
      slider.removeEventListener('input', update);
    },
    setRho(value) {
      slider.value = value * 100;
      update();
    }
  };
}

export default { init };
