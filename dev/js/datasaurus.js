/**
 * Datasaurus Correlation Animation
 *
 * Morphs between different point patterns while maintaining the same correlation.
 * Demonstrates that correlation alone doesn't tell the full story.
 */

export async function init(container, config = {}) {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.innerHTML = '';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Config with defaults
  const dataUrl = config.dataUrl || 'assets/correlation_data.json';
  const shapeDuration = config.shapeDuration || 4000;
  const morphDuration = config.morphDuration || 1500;

  // Set canvas size to fill container
  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || window.innerWidth;
    canvas.height = rect.height || window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Load data from JSON file
  let CORRELATION_DATA;
  try {
    const response = await fetch(dataUrl);
    CORRELATION_DATA = await response.json();
  } catch (err) {
    console.error('Failed to load correlation data:', err);
    ctx.fillStyle = '#333';
    ctx.font = '24px sans-serif';
    ctx.fillText('Error loading data', 100, 100);
    return;
  }

  const CANVAS_W = 100, CANVAS_H = 60;  // Data coordinate system

  function calcCorrelation(points) {
    const n = points.length;
    const meanX = points.reduce((s, p) => s + p.x, 0) / n;
    const meanY = points.reduce((s, p) => s + p.y, 0) / n;
    let num = 0, denX = 0, denY = 0;
    for (const p of points) {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    return num / Math.sqrt(denX * denY);
  }

  // Convert loaded data to {x, y} format
  const shapes = [
    CORRELATION_DATA.shapes.text.points.map(p => ({ x: p[0], y: p[1] })),
    CORRELATION_DATA.shapes.line.points.map(p => ({ x: p[0], y: p[1] })),
    CORRELATION_DATA.shapes.face.points.map(p => ({ x: p[0], y: p[1] }))
  ];
  const shapeNames = ['CORRELATION', 'X Pattern', '🫠'];

  let currentShapeIdx = 0;
  let previousPoints = shapes[0].map(p => ({ ...p }));
  let currentPoints = shapes[0].map(p => ({ ...p }));
  let lastShapeChange = Date.now();
  let animationId = null;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function animate() {
    const now = Date.now();
    const elapsed = now - lastShapeChange;

    // Check if time to start morphing to next shape
    if (elapsed > shapeDuration + morphDuration) {
      previousPoints = currentPoints.map(p => ({ ...p }));
      currentShapeIdx = (currentShapeIdx + 1) % shapes.length;
      lastShapeChange = now;
    }

    // Calculate morph progress
    const morphT = Math.min(1, elapsed / morphDuration);
    const easedT = easeInOut(morphT);

    // Morph points from previous to target
    const targetPoints = shapes[currentShapeIdx];
    for (let i = 0; i < currentPoints.length; i++) {
      currentPoints[i].x = lerp(previousPoints[i].x, targetPoints[i].x, easedT);
      currentPoints[i].y = lerp(previousPoints[i].y, targetPoints[i].y, easedT);
    }

    // Draw
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Responsive margins
    const margin = Math.min(100, canvas.width * 0.08);
    const rightMargin = Math.min(60, canvas.width * 0.04);
    const topMargin = Math.min(60, canvas.height * 0.06);

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - rightMargin, canvas.height - margin);
    ctx.moveTo(margin, canvas.height - margin);
    ctx.lineTo(margin, topMargin);
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#3498db';
    const plotWidth = canvas.width - margin - rightMargin;
    const plotHeight = canvas.height - margin - topMargin;
    const pointSize = Math.max(2, Math.min(4, canvas.width / 500));

    for (const p of currentPoints) {
      const x = margin + (p.x / CANVAS_W) * plotWidth;
      const y = (canvas.height - margin) - (p.y / CANVAS_H) * plotHeight;
      ctx.beginPath();
      ctx.arc(x, y, pointSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Calculate and display correlation
    const r = calcCorrelation(currentPoints);
    const fontSize = Math.max(36, Math.min(72, canvas.width / 20));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`ρ = ${r.toFixed(2)}`, canvas.width - rightMargin - 20, topMargin + fontSize);

    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Return cleanup function
  return {
    destroy() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resizeCanvas);
    }
  };
}

export default { init };
