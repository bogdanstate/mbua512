/**
 * Bivariate Normal Distribution 3D Visualization
 *
 * Interactive 3D surface showing probability density with data points.
 * Supports pan, tilt, and zoom via mouse interaction.
 */

export function init(container, config = {}) {
  const {
    canvasWidth = 580,
    canvasHeight = 500,
    rho = 0.85
  } = config;

  container.innerHTML = `
    <h2 style="font-size: 2.2em; color: #1a1a2e; font-weight: 400; margin-bottom: 15px; text-align: center;">When to use correlations?</h2>
    <div style="display: flex; gap: 40px; align-items: stretch; width: 100%; padding: 20px;">
      <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <canvas id="bivariateCanvas" style="border: 1px solid #ddd; border-radius: 8px; cursor: grab;"></canvas>
        <p style="font-size: 0.9em; color: #888; margin-top: 8px;">🖱️ Drag to pan/tilt · Scroll to zoom</p>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
        <div style="background: #f3e5f5; padding: 30px 35px; border-radius: 16px; border-left: 6px solid #9c27b0;">
          <p style="font-size: 1.4em; color: #333; margin: 0; line-height: 1.7;">
            The traits you are measuring are <strong style="color: #9c27b0;">normally distributed</strong> in the population.
          </p>
          <p style="font-size: 1.15em; color: #555; margin-top: 20px; line-height: 1.6;">
            Even though the data in your sample may not be normally distributed (if you plot them in a histogram they do not form a bell-shaped curve), you are pretty sure that if you could collect data from the <em>entire population</em>, the results would be normally distributed.
          </p>
        </div>
        <p style="font-size: 1em; color: #666; margin-top: 20px; font-style: italic; text-align: center;">
          The 3D surface shows probability density.<br>Red points show fire incident sample data.
        </p>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#bivariateCanvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = canvasWidth;
  const height = canvasHeight;

  // Camera parameters
  let pitch = 0.55;
  let panX = 0;
  let panY = 0;
  let zoom = 140;
  let isDragging = false;
  let lastX, lastY;

  // Sample data points (normalized)
  const sampleData = [
    {x: 1.9, y: 16}, {x: 9.5, y: 85}, {x: 4.5, y: 40}, {x: 3.2, y: 23},
    {x: 1.0, y: 5}, {x: 1.0, y: 10}, {x: 0.7, y: 5}, {x: 6.5, y: 61},
    {x: 3.3, y: 31}, {x: 4.2, y: 31}, {x: 0.6, y: 5}, {x: 11.0, y: 94},
    {x: 5.9, y: 46}, {x: 1.2, y: 15}, {x: 1.1, y: 5}, {x: 1.1, y: 5},
    {x: 1.6, y: 12}, {x: 2.7, y: 22}, {x: 2.2, y: 15}, {x: 1.5, y: 15}
  ].map(p => ({
    x: (p.x - 3.5) / 2.5,
    y: (p.y - 28) / 20,
    origX: p.x,
    origY: p.y
  }));

  function bivariateNormalPDF(x, y) {
    const z = x * x - 2 * rho * x * y + y * y;
    return Math.exp(-z / (2 * (1 - rho * rho)));
  }

  function project(x, y, z) {
    const xPanned = x - panX;
    const yPanned = y - panY;
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const screenX = xPanned * 0.866 - yPanned * 0.866;
    const screenY = (xPanned * 0.5 + yPanned * 0.5) * cosPitch - z * sinPitch * 2;
    const depth = (xPanned * 0.5 + yPanned * 0.5) * sinPitch + z * cosPitch;
    return {
      x: width / 2 + screenX * zoom,
      y: height / 2 + screenY * zoom,
      z: depth
    };
  }

  function draw() {
    // Sky gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#B0E0E6');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const gridSize = 40;
    const range = 2.5;
    const step = (range * 2) / gridSize;
    const quads = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x1 = -range + i * step;
        const y1 = -range + j * step;
        const x2 = x1 + step;
        const y2 = y1 + step;

        const z1 = bivariateNormalPDF(x1, y1) * 1.2;
        const z2 = bivariateNormalPDF(x2, y1) * 1.2;
        const z3 = bivariateNormalPDF(x2, y2) * 1.2;
        const z4 = bivariateNormalPDF(x1, y2) * 1.2;

        const p1 = project(x1, y1, z1);
        const p2 = project(x2, y1, z2);
        const p3 = project(x2, y2, z3);
        const p4 = project(x1, y2, z4);

        const avgZ = (p1.z + p2.z + p3.z + p4.z) / 4;
        const avgHeight = (z1 + z2 + z3 + z4) / 4;
        quads.push({ p1, p2, p3, p4, avgZ, avgHeight });
      }
    }

    quads.sort((a, b) => a.avgZ - b.avgZ);

    quads.forEach(q => {
      ctx.beginPath();
      ctx.moveTo(q.p1.x, q.p1.y);
      ctx.lineTo(q.p2.x, q.p2.y);
      ctx.lineTo(q.p3.x, q.p3.y);
      ctx.lineTo(q.p4.x, q.p4.y);
      ctx.closePath();

      const h = q.avgHeight;
      let r, g, b;
      if (h < 0.3) {
        r = 76 + h * 100; g = 140 + h * 80; b = 60 + h * 40;
      } else if (h < 0.7) {
        const t = (h - 0.3) / 0.4;
        r = 106 + t * 80; g = 164 - t * 40; b = 72 + t * 30;
      } else {
        const t = (h - 0.7) / 0.3;
        r = 186 + t * 69; g = 124 + t * 131; b = 102 + t * 153;
      }

      const shade = 0.7 + 0.3 * (1 - q.avgZ / 3);
      ctx.fillStyle = `rgb(${Math.round(r * shade)}, ${Math.round(g * shade)}, ${Math.round(b * shade)})`;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 0.2;
      ctx.stroke();
    });

    // Data points
    const points3D = sampleData.map(p => {
      const z = bivariateNormalPDF(p.x, p.y) * 1.2 + 0.08;
      return { ...project(p.x, p.y, z) };
    });
    points3D.sort((a, b) => a.z - b.z);

    points3D.forEach(p => {
      ctx.beginPath();
      ctx.ellipse(p.x + 2, p.y + 2, 5, 3, 0, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#e74c3c';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Title
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.fillText('Bivariate Normal Distribution', width / 2, 30);
  }

  // Mouse interaction
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    panX -= dx * 0.008;
    panY -= dx * 0.008;
    pitch += dy * 0.008;
    pitch = Math.max(0.2, Math.min(1.2, pitch));
    lastX = e.clientX;
    lastY = e.clientY;
    draw();
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom -= e.deltaY * 0.1;
    zoom = Math.max(80, Math.min(200, zoom));
    draw();
  });

  draw();

  return {
    destroy() {},
    redraw: draw
  };
}

export default { init };
