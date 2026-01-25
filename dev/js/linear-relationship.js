/**
 * Linear Relationship Visualization
 *
 * Shows comparison between linear and log-transformed data
 * to demonstrate when Pearson's correlation is appropriate.
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <h2 style="font-size: 2.2em; color: #1a1a2e; font-weight: 400; margin-bottom: 20px; text-align: center;">
      When to use correlations?
    </h2>
    <div style="background: #e3f2fd; padding: 20px 30px; border-radius: 12px; border-left: 5px solid #2196f3; margin-bottom: 25px; max-width: 900px; margin-left: auto; margin-right: auto;">
      <p style="font-size: 1.3em; color: #333; margin: 0; line-height: 1.5;">
        The relationship, if there is any, between the two variables is best characterized by a <strong style="color: #2196f3;">straight line</strong>.
        If curvilinear, Pearson's ρ is not appropriate.
      </p>
    </div>
    <div style="display: flex; gap: 30px; justify-content: center; align-items: flex-start;">
      <div style="text-align: center;">
        <canvas id="linearCanvas" width="420" height="320" style="border: 1px solid #ddd; border-radius: 8px; background: #fafafa;"></canvas>
        <p style="font-size: 1em; color: #666; margin-top: 8px;">Meters run vs Opinion (linear scale)</p>
      </div>
      <div style="text-align: center;">
        <canvas id="logCanvas" width="420" height="320" style="border: 1px solid #ddd; border-radius: 8px; background: #fafafa;"></canvas>
        <p style="font-size: 1em; color: #666; margin-top: 8px;">Log₁₀(Meters run) vs Opinion</p>
      </div>
    </div>
    <h2 style="text-align: center; font-size: 2.2em; color: #1a1a2e; margin-top: 30px; font-weight: 500;">
      Should you use ρ?
    </h2>
  `;

  // Marathon data
  const marathonData = [
    [6736.2, 2.2], [563.9, 6.2], [394.0, 6.7], [2801.2, 4.8], [7740.9, 3.1],
    [1290.5, 6.7], [37563.1, 0.9], [6278.5, 3.4], [1830.5, 4.9], [1070.1, 5.4],
    [796.0, 6.1], [8202.5, 3.5], [1417.0, 6.2], [143.4, 7.0], [1109.1, 5.2],
    [8658.3, 2.8], [301.4, 7.8], [288.8, 7.0], [2485.8, 3.3], [2489.9, 4.7],
    [4628.8, 3.8], [16981.7, 2.4], [7977.8, 2.4], [4018.8, 5.2], [7881.4, 3.0],
    [704.5, 6.0], [890.8, 5.2], [397.4, 6.2], [590.3, 5.5], [4534.0, 3.6],
    [174.5, 7.2], [1375.9, 6.8], [1352.5, 4.0], [1977.2, 4.1], [1311.9, 5.1],
    [660.3, 6.7], [1316.1, 5.1], [22150.3, 2.4], [30106.9, 0.9], [2077.1, 4.9],
    [4345.5, 5.1], [201.2, 7.0], [680.7, 6.5], [1227.5, 5.6], [18805.6, 0.6]
  ];

  const meters = marathonData.map(d => d[0]);
  const opinion = marathonData.map(d => d[1]);
  const logMeters = meters.map(m => Math.log10(m));

  function correlation(x, y) {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - meanX) * (y[i] - meanY);
      denX += (x[i] - meanX) ** 2;
      denY += (y[i] - meanY) ** 2;
    }
    return num / Math.sqrt(denX * denY);
  }

  const rLinear = correlation(meters, opinion);
  const rLog = correlation(logMeters, opinion);

  function drawPlot(canvasId, xData, yData, xLabel, isLog, r) {
    const canvas = container.querySelector(`#${canvasId}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const margin = { top: 30, right: 30, bottom: 50, left: 55 };
    const plotW = w - margin.left - margin.right;
    const plotH = h - margin.top - margin.bottom;

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, w, h);

    const xMin = Math.min(...xData) * 0.95;
    const xMax = Math.max(...xData) * 1.05;
    const yMin = 0;
    const yMax = 10;

    function toCanvasX(x) { return margin.left + (x - xMin) / (xMax - xMin) * plotW; }
    function toCanvasY(y) { return margin.top + (1 - (y - yMin) / (yMax - yMin)) * plotH; }

    // Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let y = 0; y <= 10; y += 2) {
      ctx.beginPath();
      ctx.moveTo(margin.left, toCanvasY(y));
      ctx.lineTo(w - margin.right, toCanvasY(y));
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

    // Y-axis labels
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let y = 0; y <= 10; y += 2) {
      ctx.fillText(y.toString(), margin.left - 8, toCanvasY(y) + 4);
    }

    // X-axis labels
    ctx.textAlign = 'center';
    if (isLog) {
      for (let exp = 2; exp <= 4.5; exp += 0.5) {
        if (exp >= xMin && exp <= xMax) {
          ctx.fillText(exp.toFixed(1), toCanvasX(exp), h - margin.bottom + 18);
        }
      }
    } else {
      for (let x = 0; x <= 40000; x += 10000) {
        if (x >= xMin && x <= xMax) {
          ctx.fillText((x / 1000) + 'k', toCanvasX(x), h - margin.bottom + 18);
        }
      }
    }

    // Axis titles
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(xLabel, margin.left + plotW / 2, h - 8);
    ctx.save();
    ctx.translate(15, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Opinion of Running', 0, 0);
    ctx.restore();

    // Regression line
    const n = xData.length;
    const meanX = xData.reduce((a, b) => a + b, 0) / n;
    const meanY = yData.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (xData[i] - meanX) * (yData[i] - meanY);
      den += (xData[i] - meanX) ** 2;
    }
    const slope = num / den;
    const intercept = meanY - slope * meanX;

    ctx.strokeStyle = isLog ? 'rgba(46, 125, 50, 0.7)' : 'rgba(198, 40, 40, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash(isLog ? [] : [8, 4]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(xMin), toCanvasY(intercept + slope * xMin));
    ctx.lineTo(toCanvasX(xMax), toCanvasY(intercept + slope * xMax));
    ctx.stroke();
    ctx.setLineDash([]);

    // Points
    ctx.fillStyle = isLog ? '#2e7d32' : '#c62828';
    for (let i = 0; i < xData.length; i++) {
      ctx.beginPath();
      ctx.arc(toCanvasX(xData[i]), toCanvasY(yData[i]), 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Correlation label
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = isLog ? '#2e7d32' : '#c62828';
    ctx.textAlign = 'left';
    ctx.fillText('ρ = ' + r.toFixed(3), margin.left + 10, margin.top + 20);
  }

  drawPlot('linearCanvas', meters, opinion, 'Meters Run', false, rLinear);
  drawPlot('logCanvas', logMeters, opinion, 'Log₁₀(Meters Run)', true, rLog);

  return {
    destroy() {}
  };
}

export default { init };
