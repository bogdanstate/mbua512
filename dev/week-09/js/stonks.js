/**
 * STONKS Chart - R² vs Number of Predictors
 *
 * Animated demonstration of how adding predictors increases R²,
 * showing both legitimate and absurd variables to make a point
 * about overfitting.
 */

export function init(container, config = {}) {
  const {
    stonksImageUrl = 'https://i.kym-cdn.com/entries/icons/original/000/029/959/Screen_Shot_2019-06-05_at_1.26.32_PM.jpg'
  } = config;

  // Create HTML structure
  container.innerHTML = `
    <style>
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    </style>
    <h2 style="font-size: 2.2em; color: #fff; font-weight: 400; margin-bottom: 15px; text-align: center;">How to Win at Statistics</h2>
    <div style="display: flex; gap: 30px; align-items: flex-start; width: 100%;">
      <div style="flex: 1; min-width: 0;">
        <div id="equationBox" style="background: #0f0f23; border: 2px solid #00d4ff; border-radius: 12px; padding: 25px; font-family: 'SF Mono', Monaco, monospace; font-size: 18px; color: #00ff88; min-height: 120px; box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); overflow-x: auto;">
          <span id="equationText"></span><span id="cursor" style="animation: blink 1s infinite;">|</span>
        </div>
        <div style="margin-top: 20px;">
          <canvas id="stonksChart" style="width: 100%; height: auto; background: #0f0f23; border-radius: 12px; border: 2px solid #00d4ff;"></canvas>
        </div>
      </div>
      <div style="width: 280px; flex-shrink: 0; text-align: center;">
        <img src="${stonksImageUrl}" alt="STONKS" style="width: 100%; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
        <div id="stonksR2Display" style="margin-top: 15px; font-size: 2.5em; font-weight: bold; color: #00ff88; text-shadow: 0 0 10px #00ff88;">
          R² = 0.00
        </div>
        <button id="replayStatsBtn" style="margin-top: 15px; padding: 10px 25px; font-size: 14px; background: #00d4ff; color: #0f0f23; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">▶ Start</button>
      </div>
    </div>
  `;

  // Set container background
  container.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
  container.style.padding = '25px 40px';

  const equationText = container.querySelector('#equationText');
  const r2Display = container.querySelector('#stonksR2Display');
  const canvas = container.querySelector('#stonksChart');
  const replayBtn = container.querySelector('#replayStatsBtn');

  const ctx = canvas.getContext('2d');
  let w = 800, h = 280;

  // Dynamic canvas sizing
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width < 100) return false;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = (rect.width * 0.35) * dpr;
    canvas.style.height = (rect.width * 0.35) + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = rect.width;
    h = rect.width * 0.35;
    return true;
  }

  // Visibility observer for initial sizing
  if (!resizeCanvas()) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && resizeCanvas()) {
        drawChart();
        observer.disconnect();
      }
    });
    observer.observe(canvas);
  }
  window.addEventListener('resize', () => { resizeCanvas(); drawChart(); });

  const variables = [
    { text: "PRICE", r2: 0 },
    { text: " = ", r2: 0 },
    { text: "SQMETERS", r2: 0.32 },
    { text: " + ROOMS", r2: 0.38 },
    { text: " + NEIGHBORHOOD", r2: 0.43 },
    { text: " + SCHOOLZONE", r2: 0.47 },
    { text: " + YEARBUILT", r2: 0.50 },
    { text: " + PARKING", r2: 0.53 },
    { text: " + BALCONY", r2: 0.55 },
    { text: " + FLOORLEVEL", r2: 0.57 },
    { text: " + VIEWQUALITY", r2: 0.59 },
    { text: " + CRIMEINDEX", r2: 0.61 },
    { text: " + TRANSITDIST", r2: 0.63 },
    { text: " + GROCERYSTORE", r2: 0.65 },
    { text: " + AVGTEMP", r2: 0.67 },
    { text: " + HUMIDITY", r2: 0.69 },
    { text: " + SELLERSMOOD", r2: 0.71 },
    { text: " + PAINTCOLOR", r2: 0.73 },
    { text: " + CURBAPPEAL", r2: 0.74 },
    { text: " + MOONPHASE", r2: 0.76 },
    { text: " + ZODIACSIGN", r2: 0.77 },
    { text: " + MERCURYRETRO", r2: 0.79 },
    { text: " + BIRDCOUNT", r2: 0.80 },
    { text: " + NEIGHVIBES", r2: 0.82 },
    { text: " + CATCOUNT", r2: 0.83 },
    { text: " + DOGBARKS", r2: 0.85 },
    { text: " + SQUIRRELS", r2: 0.86 },
    { text: " + PIZZADIST", r2: 0.88 },
    { text: " + TACOTRUCKS", r2: 0.89 },
    { text: " + WIFI_NAMES", r2: 0.91 },
    { text: " + CHIHUAHUAS", r2: 0.92 },
    { text: " + GNOMES", r2: 0.94 },
    { text: " + FLAMINGOS", r2: 0.95 },
    { text: " + RANDOMNOISE", r2: 0.97 },
    { text: " + ROW_ID", r2: 0.98 },
    { text: " + 🚰🍳🪳", r2: 0.997 }
  ];

  let currentStep = 0;
  let currentChar = 0;
  let currentText = "";
  let r2Values = [0];
  let animationTimeout = null;

  function drawChart() {
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, w, h);

    const margin = { top: 45, right: 30, bottom: 50, left: 70 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    // Grid
    ctx.strokeStyle = '#1a3a4a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = margin.top + plotH * (1 - i / 10);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(w - margin.right, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#00d4ff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const y = margin.top + plotH * (1 - i / 10);
      ctx.fillText((i / 10).toFixed(1), margin.left - 10, y + 5);
    }

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('R² vs Number of Predictors', w / 2, 28);

    // X-axis label
    ctx.fillStyle = '#00d4ff';
    ctx.font = '16px sans-serif';
    ctx.fillText('# Predictors', w / 2, h - 12);

    if (r2Values.length < 2) return;

    // Draw the line
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 4;
    ctx.beginPath();

    const xStep = plotW / (variables.length - 2);
    for (let i = 0; i < r2Values.length; i++) {
      const x = margin.left + i * xStep;
      const y = margin.top + plotH * (1 - r2Values[i]);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#00ff88';
    for (let i = 0; i < r2Values.length; i++) {
      const x = margin.left + i * xStep;
      const y = margin.top + plotH * (1 - r2Values[i]);
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glow effect on last point
    if (r2Values.length > 1) {
      const lastX = margin.left + (r2Values.length - 1) * xStep;
      const lastY = margin.top + plotH * (1 - r2Values[r2Values.length - 1]);
      ctx.fillStyle = '#00ff8844';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function typeNextChar() {
    if (currentStep >= variables.length) return;

    const currentVar = variables[currentStep];

    if (currentChar < currentVar.text.length) {
      currentText += currentVar.text[currentChar];
      equationText.innerHTML = currentText;
      currentChar++;
      animationTimeout = setTimeout(typeNextChar, 80);
    } else {
      if (currentVar.r2 > 0) {
        r2Values.push(currentVar.r2);
        r2Display.textContent = 'R² = ' + currentVar.r2.toFixed(2);
        drawChart();
      }
      currentStep++;
      currentChar = 0;
      const delay = currentStep >= variables.length - 3 ? 1200 : 600;
      animationTimeout = setTimeout(typeNextChar, delay);
    }
  }

  function startAnimation() {
    currentStep = 0;
    currentChar = 0;
    currentText = "";
    r2Values = [0];
    equationText.innerHTML = "";
    r2Display.textContent = 'R² = 0.00';
    drawChart();
    animationTimeout = setTimeout(typeNextChar, 500);
  }

  replayBtn.addEventListener('click', () => {
    if (animationTimeout) clearTimeout(animationTimeout);
    startAnimation();
    replayBtn.textContent = '↻ Replay';
  });

  // Initial draw
  drawChart();

  return {
    destroy() {
      if (animationTimeout) clearTimeout(animationTimeout);
      window.removeEventListener('resize', resizeCanvas);
    },
    start: startAnimation
  };
}

export default { init };
