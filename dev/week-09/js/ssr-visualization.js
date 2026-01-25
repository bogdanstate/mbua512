/**
 * Sum of Squared Residuals (SSR) Visualization
 *
 * Shows regression line with squared residual areas,
 * demonstrating the least squares method.
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <h2 style="font-size: 2.2em; color: #1a1a2e; font-weight: 400; margin-bottom: 12px; text-align: center;">
      Model Fitting - Least Squares Method
    </h2>
    <div style="background: #f8f9fa; padding: 15px 30px; border-radius: 12px; text-align: center; margin-bottom: 15px; max-width: 800px; margin-left: auto; margin-right: auto;">
      <p style="font-size: 1.1em; color: #555; margin: 0 0 8px 0;">Sum of Squared Residuals:</p>
      <p style="font-size: 1.4em; color: #2c3e50; margin: 0; font-family: 'Times New Roman', serif;">
        SSR = Σ εᵢ² = Σ (yᵢ − ŷᵢ)² = Σ (yᵢ − β₀ − β₁xᵢ)²
      </p>
    </div>
    <div style="text-align: center;">
      <canvas id="ssrCanvas" style="border: 1px solid #ddd; border-radius: 8px; background: #fafafa; max-width: 100%;"></canvas>
    </div>
  `;

  const canvas = container.querySelector('#ssrCanvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size
  const dpr = window.devicePixelRatio || 1;
  const canvasWidth = Math.min(850, container.clientWidth - 40);
  const canvasHeight = 420;
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = canvasWidth;
  const h = canvasHeight;
  const margin = { top: 25, right: 40, bottom: 50, left: 70 };
  const plotW = w - margin.left - margin.right;
  const plotH = h - margin.top - margin.bottom;

  // Generate data with seeded random
  let seed = 456;
  function seededRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  function gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = seededRandom();
    while (v === 0) v = seededRandom();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  const data = [];
  for (let i = 0; i < 50; i++) {
    const sqm = 30 + seededRandom() * 140;
    const price = 80 + sqm * 3.0 + gaussianRandom() * 45;
    data.push({ sqm, price });
  }

  // Calculate regression coefficients
  const n = data.length;
  const meanX = data.reduce((a, d) => a + d.sqm, 0) / n;
  const meanY = data.reduce((a, d) => a + d.price, 0) / n;
  let num = 0, den = 0;
  for (const d of data) {
    num += (d.sqm - meanX) * (d.price - meanY);
    den += (d.sqm - meanX) ** 2;
  }
  const beta1 = num / den;
  const beta0 = meanY - beta1 * meanX;

  const xMin = 0, xMax = 180;
  const yMin = 0, yMax = 650;

  function toCanvasX(x) { return margin.left + (x - xMin) / (xMax - xMin) * plotW; }
  function toCanvasY(y) { return margin.top + (1 - (y - yMin) / (yMax - yMin)) * plotH; }

  function draw() {
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let y = 0; y <= 600; y += 100) {
      ctx.beginPath();
      ctx.moveTo(margin.left, toCanvasY(y));
      ctx.lineTo(w - margin.right, toCanvasY(y));
      ctx.stroke();
    }
    for (let x = 0; x <= 180; x += 30) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), margin.top);
      ctx.lineTo(toCanvasX(x), h - margin.bottom);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, h - margin.bottom);
    ctx.lineTo(w - margin.right, h - margin.bottom);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#333';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    for (let y = 0; y <= 600; y += 100) {
      ctx.fillText('$' + y + 'k', margin.left - 8, toCanvasY(y) + 4);
    }
    ctx.textAlign = 'center';
    for (let x = 0; x <= 180; x += 30) {
      ctx.fillText(x + '', toCanvasX(x), h - margin.bottom + 18);
    }

    // Axis titles
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText('Square Meters (sq.m.)', margin.left + plotW / 2, h - 8);
    ctx.save();
    ctx.translate(18, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Price ($k)', 0, 0);
    ctx.restore();

    // Draw squared residuals as squares
    const pixelsPerUnit = plotH / (yMax - yMin);

    for (const d of data) {
      const fitted = beta0 + beta1 * d.sqm;
      const residual = d.price - fitted;
      const residualPixels = Math.abs(residual) * pixelsPerUnit;

      ctx.fillStyle = 'rgba(229, 57, 53, 0.25)';
      ctx.strokeStyle = 'rgba(229, 57, 53, 0.6)';
      ctx.lineWidth = 1;

      const xPos = toCanvasX(d.sqm);
      const yObserved = toCanvasY(d.price);
      const yFitted = toCanvasY(fitted);

      if (residual > 0) {
        ctx.fillRect(xPos, yObserved, residualPixels, yFitted - yObserved);
        ctx.strokeRect(xPos, yObserved, residualPixels, yFitted - yObserved);
      } else {
        ctx.fillRect(xPos, yFitted, residualPixels, yObserved - yFitted);
        ctx.strokeRect(xPos, yFitted, residualPixels, yObserved - yFitted);
      }
    }

    // Observed points
    ctx.fillStyle = '#999';
    for (const d of data) {
      ctx.beginPath();
      ctx.arc(toCanvasX(d.sqm), toCanvasY(d.price), 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Regression line
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(xMin), toCanvasY(beta0 + beta1 * xMin));
    ctx.lineTo(toCanvasX(xMax), toCanvasY(beta0 + beta1 * xMax));
    ctx.stroke();

    // Calculate SSR
    let ssr = 0;
    for (const d of data) {
      const fitted = beta0 + beta1 * d.sqm;
      ssr += (d.price - fitted) ** 2;
    }

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#c62828';
    ctx.textAlign = 'right';
    ctx.fillText('SSR = ' + Math.round(ssr).toLocaleString(), w - margin.right - 10, margin.top + 25);
  }

  draw();

  return {
    destroy() {},
    redraw: draw
  };
}

export default { init };
