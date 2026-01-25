/**
 * Homoscedasticity Visualization
 *
 * Shows schooling vs income data demonstrating heteroscedasticity
 * where variance changes with X (education level).
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <h2 style="font-size: 2.2em; color: #1a1a2e; font-weight: 400; margin-bottom: 15px; text-align: center;">When to use correlations?</h2>
    <div style="display: flex; gap: 30px; align-items: flex-start; max-width: 1000px; margin: 0 auto;">
      <div style="background: #fce4ec; padding: 20px 25px; border-radius: 12px; border-left: 5px solid #e91e63; flex: 1;">
        <h3 style="font-size: 1.5em; color: #e91e63; margin: 0 0 10px 0;">Homoscedasticity</h3>
        <p style="font-size: 1.15em; color: #333; margin: 0; line-height: 1.5;">
          Scores on the Y variable are <strong>normally distributed</strong> across each value of X.
          The spread (variance) of Y should be roughly the same at all levels of X.
        </p>
      </div>
      <div style="background: #fff3e0; padding: 20px 25px; border-radius: 12px; border-left: 5px solid #ff9800; flex: 1;">
        <p style="font-size: 1.1em; color: #555; margin: 0; line-height: 1.5;">
          <strong style="color: #e65100;">Example:</strong> Income variance is high for those with less education (some dropouts become wealthy), but changes at higher education levels.
        </p>
      </div>
    </div>
    <div style="text-align: center; margin-top: 15px;">
      <canvas id="homoscedasticityCanvas" style="border: 1px solid #ddd; border-radius: 8px; background: #fafafa;"></canvas>
      <p style="font-size: 1em; color: #e91e63; margin-top: 6px; font-weight: 500;">⚠️ Heteroscedastic — Variance changes with X</p>
    </div>
  `;

  const canvas = container.querySelector('#homoscedasticityCanvas');
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const canvasWidth = Math.min(900, container.clientWidth - 40);
  const canvasHeight = 400;
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

  // Seeded random
  let seed = 42;
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
  const n = 150;

  for (let i = 0; i < n; i++) {
    let schooling;
    const r = seededRandom();
    if (r < 0.03) {
      schooling = 4 + seededRandom() * 4;
    } else if (r < 0.15) {
      schooling = 8 + seededRandom() * 4;
    } else if (r < 0.45) {
      schooling = 12 + seededRandom() * 2;
    } else if (r < 0.75) {
      schooling = 14 + seededRandom() * 2;
    } else {
      schooling = 16 + seededRandom() * 3;
    }

    const baseIncome = 20 + (schooling - 4) * 8;
    const varianceFactor = Math.max(5, 50 - schooling * 2.5);
    let income = baseIncome + gaussianRandom() * varianceFactor;
    income = Math.max(15, income);
    data.push({ schooling, income });
  }

  // College dropouts
  const dropouts = [
    { schooling: 12 + seededRandom() * 2, income: 180 + seededRandom() * 70 },
    { schooling: 13 + seededRandom() * 1.5, income: 160 + seededRandom() * 60 },
    { schooling: 10 + seededRandom() * 2, income: 140 + seededRandom() * 50 },
    { schooling: 14 + seededRandom() * 1, income: 200 + seededRandom() * 80 },
    { schooling: 11 + seededRandom() * 2, income: 170 + seededRandom() * 40 },
    { schooling: 10 + seededRandom() * 2, income: 22 + seededRandom() * 10 },
    { schooling: 11 + seededRandom() * 2, income: 18 + seededRandom() * 12 },
    { schooling: 12 + seededRandom() * 1, income: 25 + seededRandom() * 8 },
    { schooling: 9 + seededRandom() * 2, income: 20 + seededRandom() * 10 },
    { schooling: 13 + seededRandom() * 1, income: 28 + seededRandom() * 12 },
  ];
  data.push(...dropouts);

  // Doctors and lawyers
  const medLaw = [
    { schooling: 19 + seededRandom() * 1.5, income: 180 + seededRandom() * 60 },
    { schooling: 20 + seededRandom() * 1, income: 220 + seededRandom() * 50 },
    { schooling: 20 + seededRandom() * 1.5, income: 250 + seededRandom() * 40 },
    { schooling: 19 + seededRandom() * 2, income: 200 + seededRandom() * 50 },
    { schooling: 19 + seededRandom() * 1, income: 55 + seededRandom() * 20 },
    { schooling: 20 + seededRandom() * 1, income: 65 + seededRandom() * 25 },
    { schooling: 19.5 + seededRandom() * 1, income: 70 + seededRandom() * 20 },
    { schooling: 20 + seededRandom() * 1.5, income: 80 + seededRandom() * 30 },
  ];
  data.push(...medLaw);

  const xMin = 4, xMax = 22;
  const yMin = 0, yMax = 320;

  function toCanvasX(x) { return margin.left + (x - xMin) / (xMax - xMin) * plotW; }
  function toCanvasY(y) { return margin.top + (1 - (y - yMin) / (yMax - yMin)) * plotH; }

  function draw() {
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let y = 0; y <= 300; y += 50) {
      ctx.beginPath();
      ctx.moveTo(margin.left, toCanvasY(y));
      ctx.lineTo(w - margin.right, toCanvasY(y));
      ctx.stroke();
    }
    for (let x = 4; x <= 22; x += 2) {
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

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let y = 0; y <= 300; y += 50) {
      ctx.fillText('$' + y + 'k', margin.left - 8, toCanvasY(y) + 4);
    }
    ctx.textAlign = 'center';
    for (let x = 4; x <= 22; x += 2) {
      ctx.fillText(x + '', toCanvasX(x), h - margin.bottom + 18);
    }

    // Axis titles
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText('Years of Schooling', margin.left + plotW / 2, h - 8);
    ctx.save();
    ctx.translate(18, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Annual Income ($k)', 0, 0);
    ctx.restore();

    // Data points
    data.forEach(d => {
      ctx.beginPath();
      ctx.arc(toCanvasX(d.schooling), toCanvasY(d.income), 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e91e6388';
      ctx.fill();
      ctx.strokeStyle = '#e91e63';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Variance indicators
    ctx.strokeStyle = '#e91e63';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Low education variance
    ctx.beginPath();
    ctx.moveTo(toCanvasX(10), toCanvasY(20));
    ctx.lineTo(toCanvasX(10), toCanvasY(200));
    ctx.stroke();

    // High education variance
    ctx.beginPath();
    ctx.moveTo(toCanvasX(18), toCanvasY(70));
    ctx.lineTo(toCanvasX(18), toCanvasY(140));
    ctx.stroke();

    ctx.setLineDash([]);

    // Annotations
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#c2185b';
    ctx.textAlign = 'center';
    ctx.fillText('High variance', toCanvasX(10), toCanvasY(210) + 15);
    ctx.fillText('Lower variance', toCanvasX(18), toCanvasY(145) + 15);
  }

  draw();

  return {
    destroy() {},
    redraw: draw
  };
}

export default { init };
