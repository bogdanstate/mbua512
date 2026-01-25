/**
 * Least Squares Method Animation
 *
 * Animated visualization showing how a regression line fits data points,
 * with residual lines connecting observed values to fitted values.
 */

export function init(container, config = {}) {
  const {
    canvasWidth = 850,
    canvasHeight = 360
  } = config;

  // Create HTML structure
  container.innerHTML = `
    <style>
      @keyframes bounceHat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      .ls-bouncy-hat {
        display: inline-block;
        color: #e53935;
        font-weight: bold;
        animation: bounceHat 0.6s ease-in-out infinite;
      }
    </style>
    <h2 style="font-size: 2.2em; color: #1a1a2e; font-weight: 400; margin-bottom: 12px; text-align: center;">
      Model Fitting - Least Squares Method
    </h2>
    <div style="background: #f8f9fa; padding: 15px 30px; border-radius: 12px; text-align: center; margin-bottom: 15px;">
      <p style="font-size: 1.1em; color: #555; margin: 0 0 8px 0;">Fitted values:</p>
      <p style="font-size: 1.6em; color: #2c3e50; margin: 0; font-family: 'Times New Roman', serif;">
        <span class="ls-bouncy-hat">ŷ</span><sub>i</sub> = β<sub>0</sub> + β<sub>1</sub> · x<sub>i</sub>
      </p>
    </div>
    <div style="display: flex; gap: 30px; margin-bottom: 15px;">
      <div style="flex: 1; background: #ffebee; padding: 18px 25px; border-radius: 12px; border-left: 5px solid #e53935;">
        <p style="font-size: 1.15em; color: #444; margin: 0;">
          Fitted values <span class="ls-bouncy-hat">ŷ</span><sub>i</sub> should be as close as possible to observed values y<sub>i</sub>
        </p>
      </div>
    </div>
    <div style="text-align: center; position: relative; display: inline-block; width: 100%;">
      <canvas id="lsCanvas" style="border: 1px solid #ddd; border-radius: 8px; background: #fafafa; max-width: 100%;"></canvas>
      <button id="lsToggleBtn" style="position: absolute; bottom: 15px; right: 15px; padding: 8px 16px; font-size: 14px; background: #e53935; color: white; border: none; border-radius: 6px; cursor: pointer; opacity: 0.9;">
        ⏸ Pause
      </button>
    </div>
  `;

  const canvas = container.querySelector('#lsCanvas');
  const ctx = canvas.getContext('2d');
  const toggleBtn = container.querySelector('#lsToggleBtn');
  const bouncyHats = container.querySelectorAll('.ls-bouncy-hat');

  let w = canvasWidth;
  let h = canvasHeight;
  let isPlaying = true;
  let animationId = null;
  let time = 0;

  const margin = { top: 25, right: 40, bottom: 50, left: 70 };

  // Generate sample data with seeded random
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

  // Calculate true regression coefficients
  const n = data.length;
  const meanX = data.reduce((a, d) => a + d.sqm, 0) / n;
  const meanY = data.reduce((a, d) => a + d.price, 0) / n;
  let num = 0, den = 0;
  for (const d of data) {
    num += (d.sqm - meanX) * (d.price - meanY);
    den += (d.sqm - meanX) ** 2;
  }
  const trueBeta1 = num / den;
  const trueBeta0 = meanY - trueBeta1 * meanX;

  const xMin = 0, xMax = 180;
  const yMin = 0, yMax = 650;

  // Dynamic canvas sizing
  function resizeCanvas() {
    const containerWidth = container.clientWidth || canvasWidth;
    const dpr = window.devicePixelRatio || 1;
    w = Math.min(containerWidth - 40, canvasWidth);
    h = (w / canvasWidth) * canvasHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function toCanvasX(x) {
    const plotW = w - margin.left - margin.right;
    return margin.left + (x - xMin) / (xMax - xMin) * plotW;
  }

  function toCanvasY(y) {
    const plotH = h - margin.top - margin.bottom;
    return margin.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;
  }

  function draw() {
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    // Animate beta0 and beta1 around true values
    const beta0 = trueBeta0 + Math.sin(time * 0.02) * 60 + Math.sin(time * 0.035) * 30;
    const beta1 = trueBeta1 + Math.sin(time * 0.015 + 1) * 0.8 + Math.cos(time * 0.025) * 0.4;

    // Background
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

    // Residual lines
    ctx.strokeStyle = '#e5393588';
    ctx.lineWidth = 2;
    for (const d of data) {
      const fitted = beta0 + beta1 * d.sqm;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(d.sqm), toCanvasY(d.price));
      ctx.lineTo(toCanvasX(d.sqm), toCanvasY(fitted));
      ctx.stroke();
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

    // Fitted points
    ctx.fillStyle = '#e53935';
    for (const d of data) {
      const fitted = beta0 + beta1 * d.sqm;
      ctx.beginPath();
      ctx.arc(toCanvasX(d.sqm), toCanvasY(fitted), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    time++;
    if (isPlaying) {
      animationId = requestAnimationFrame(draw);
    } else {
      animationId = null;
    }
  }

  // Toggle button handler
  toggleBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      toggleBtn.textContent = '⏸ Pause';
      toggleBtn.style.background = '#e53935';
      bouncyHats.forEach(el => el.style.animationPlayState = 'running');
      if (!animationId) draw();
    } else {
      toggleBtn.textContent = '▶ Play';
      toggleBtn.style.background = '#43a047';
      bouncyHats.forEach(el => el.style.animationPlayState = 'paused');
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }
  });

  // Visibility observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        resizeCanvas();
        if (!animationId && isPlaying) draw();
      } else {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      }
    });
  }, { threshold: 0.1 });

  observer.observe(canvas);

  // Handle resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (!isPlaying && !animationId) {
      // Redraw static frame
      const temp = isPlaying;
      draw();
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }
  });

  // Initial setup
  resizeCanvas();
  draw();

  return {
    destroy() {
      if (animationId) cancelAnimationFrame(animationId);
      observer.disconnect();
    },
    play() {
      if (!isPlaying) toggleBtn.click();
    },
    pause() {
      if (isPlaying) toggleBtn.click();
    }
  };
}

export default { init };
