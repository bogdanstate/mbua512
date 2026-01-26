/**
 * Soccer Formation Clustering Interactive
 *
 * Loads real match data and demonstrates k-means clustering
 * with adjustable k from 1 to 8 clusters.
 * Data: Barcelona vs Manchester United, 2011 Champions League Final (kickoff positions)
 */

export async function initSoccerClustering(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Load match data
  let matchData;
  try {
    const response = await fetch('data/soccer-positions.json');
    matchData = await response.json();
    console.log(`Loaded match data: ${matchData.metadata.description}`);
  } catch (err) {
    console.error('Failed to load match data:', err);
    container.innerHTML = '<p style="color: red;">Failed to load match data</p>';
    return;
  }

  // Soccer field dimensions (aspect ratio ~1.5:1)
  const fieldWidth = 600;
  const fieldHeight = 400;
  const padding = 20;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${fieldWidth} ${fieldHeight}`);
  svg.style.maxWidth = '800px';
  svg.style.margin = '0 auto';
  svg.style.display = 'block';
  svg.style.background = '#2d5016';
  svg.style.borderRadius = '8px';

  // Draw field markings (we'll toggle visibility later)
  const fieldMarkings = drawField(svg, fieldWidth, fieldHeight);

  // Extract player positions from loaded data
  const team1Players = matchData.teams[0].players.map(p => ({ ...p, teamIdx: 0 }));
  const team2Players = matchData.teams[1].players.map(p => ({ ...p, teamIdx: 1 }));

  // Scale positions to field (data is normalized 0-1)
  const players = [
    ...team1Players.map(p => ({
      x: p.x * (fieldWidth - 2 * padding) + padding,
      y: p.y * (fieldHeight - 2 * padding) + padding,
      team: 1,
      position: p.position,
      id: p.id
    })),
    ...team2Players.map(p => ({
      x: p.x * (fieldWidth - 2 * padding) + padding,
      y: p.y * (fieldHeight - 2 * padding) + padding,
      team: 2,
      position: p.position,
      id: p.id
    }))
  ];

  // Draw players
  const playerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  playerGroup.id = 'players';
  svg.appendChild(playerGroup);

  // Clusters group
  const clustersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  clustersGroup.id = 'clusters';
  svg.appendChild(clustersGroup);

  container.innerHTML = '';
  container.appendChild(svg);

  // Controls
  const controls = document.createElement('div');
  controls.style.cssText = 'margin-top: 20px; text-align: center; font-family: sans-serif;';

  const label = document.createElement('label');
  label.style.cssText = 'font-size: 16px; font-weight: 600; color: white; margin-right: 15px;';
  label.textContent = 'Number of Clusters (k): ';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '1';
  slider.max = '11';
  slider.value = '2';
  slider.style.cssText = 'width: 200px; vertical-align: middle; margin-right: 10px;';

  const valueDisplay = document.createElement('span');
  valueDisplay.style.cssText = 'font-size: 18px; font-weight: bold; color: #4CAF50; min-width: 30px; display: inline-block;';
  valueDisplay.textContent = '2';

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Animation';
  resetBtn.style.cssText = 'margin-left: 20px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';

  // Voronoi toggle button
  const voronoiBtn = document.createElement('button');
  voronoiBtn.textContent = 'Show Voronoi';
  voronoiBtn.style.cssText = 'margin-left: 10px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';

  controls.appendChild(label);
  controls.appendChild(slider);
  controls.appendChild(valueDisplay);
  controls.appendChild(resetBtn);
  controls.appendChild(voronoiBtn);
  container.appendChild(controls);

  // Info display
  const info = document.createElement('div');
  info.style.cssText = 'margin-top: 15px; text-align: center; color: #ddd; font-size: 14px;';
  info.innerHTML = `
    <p><strong>${matchData.metadata.description}</strong></p>
    <p><strong>Formations:</strong> ${matchData.teams[0].formation} vs ${matchData.teams[1].formation} &nbsp;|&nbsp; <strong>Data points:</strong> ${players.length} players</p>
    <p>Adjust k to see how clustering groups players based on field position</p>
  `;
  container.appendChild(info);

  // Clustering logic
  let currentK = 2;

  function performClustering(k) {
    // Simple k-means clustering
    // Initialize random centroids
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      centroids.push({
        x: randomPlayer.x + (Math.random() - 0.5) * 20,
        y: randomPlayer.y + (Math.random() - 0.5) * 20
      });
    }

    // Iterate k-means (5 iterations for demo)
    for (let iter = 0; iter < 10; iter++) {
      // Assign clusters
      const assignments = players.map(p => {
        let minDist = Infinity;
        let cluster = 0;
        centroids.forEach((c, idx) => {
          const dist = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
          if (dist < minDist) {
            minDist = dist;
            cluster = idx;
          }
        });
        return cluster;
      });

      // Update centroids
      const newCentroids = [];
      for (let i = 0; i < k; i++) {
        const clusterPoints = players.filter((_, idx) => assignments[idx] === i);
        if (clusterPoints.length > 0) {
          newCentroids.push({
            x: clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length,
            y: clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length
          });
        } else {
          newCentroids.push(centroids[i]);
        }
      }
      centroids = newCentroids;
    }

    return { centroids, assignments: players.map((p, idx) => {
      let minDist = Infinity;
      let cluster = 0;
      centroids.forEach((c, i) => {
        const dist = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          cluster = i;
        }
      });
      return cluster;
    })};
  }

  function drawPlayers(assignments) {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#FFA07A', '#98D8C8', '#F7DC6F'];

    playerGroup.innerHTML = '';

    players.forEach((player, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', player.x);
      circle.setAttribute('cy', player.y);
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', assignments ? colors[assignments[idx] % colors.length] : (player.team === 1 ? '#1E88E5' : '#E53935'));
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      playerGroup.appendChild(circle);
    });
  }

  function drawClustersCircles(result) {
    clustersGroup.innerHTML = '';

    if (!result) return;

    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#FFA07A', '#98D8C8', '#F7DC6F'];

    result.centroids.forEach((centroid, idx) => {
      // Calculate cluster radius (distance to farthest point in cluster)
      const clusterPoints = players.filter((_, pIdx) => result.assignments[pIdx] === idx);
      let maxRadius = 30; // Minimum radius

      clusterPoints.forEach(point => {
        const dist = Math.sqrt((point.x - centroid.x) ** 2 + (point.y - centroid.y) ** 2);
        if (dist > maxRadius) maxRadius = dist;
      });

      // Add some padding to the radius
      maxRadius += 15;

      // Draw cluster circle
      const clusterCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      clusterCircle.setAttribute('cx', centroid.x);
      clusterCircle.setAttribute('cy', centroid.y);
      clusterCircle.setAttribute('r', maxRadius);
      clusterCircle.setAttribute('fill', 'none');
      clusterCircle.setAttribute('stroke', colors[idx % colors.length]);
      clusterCircle.setAttribute('stroke-width', '2');
      clusterCircle.setAttribute('stroke-dasharray', '5,5');
      clusterCircle.setAttribute('opacity', '0.6');
      clustersGroup.appendChild(clusterCircle);

      // Draw centroid
      drawCentroid(centroid, colors[idx % colors.length]);
    });
  }

  function drawClustersVoronoi(result) {
    clustersGroup.innerHTML = '';

    if (!result) return;

    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#FFA07A', '#98D8C8', '#F7DC6F'];

    // Create a high-resolution grid for smooth visualization
    const resolution = 2; // pixels per sample
    const width = fieldWidth - 2 * padding;
    const height = fieldHeight - 2 * padding;

    // Create canvas for pixel-perfect Voronoi
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // For each pixel, find closest centroid and color it
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x = px + padding;
        const y = py + padding;

        // Find closest centroid
        let minDist = Infinity;
        let closestIdx = 0;

        result.centroids.forEach((centroid, idx) => {
          const dist = Math.sqrt((x - centroid.x) ** 2 + (y - centroid.y) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });

        // Color this pixel
        const color = colors[closestIdx % colors.length];
        const rgb = hexToRgb(color);
        const idx = (py * width + px) * 4;
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 38; // 15% opacity (38/255 ≈ 0.15)
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert canvas to SVG image
    const dataURL = canvas.toDataURL();
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('x', padding);
    image.setAttribute('y', padding);
    image.setAttribute('width', width);
    image.setAttribute('height', height);
    image.setAttribute('href', dataURL);
    clustersGroup.appendChild(image);

    // Draw boundary lines between regions
    // Sample points along a fine grid to detect boundaries
    const boundaryStep = 3;
    for (let py = 0; py < height - boundaryStep; py += boundaryStep) {
      for (let px = 0; px < width - boundaryStep; px += boundaryStep) {
        const x = px + padding;
        const y = py + padding;

        // Get cluster assignment for this point and neighbors
        const getClosest = (tx, ty) => {
          let minDist = Infinity;
          let closestIdx = 0;
          result.centroids.forEach((centroid, idx) => {
            const dist = Math.sqrt((tx - centroid.x) ** 2 + (ty - centroid.y) ** 2);
            if (dist < minDist) {
              minDist = dist;
              closestIdx = idx;
            }
          });
          return closestIdx;
        };

        const c = getClosest(x, y);
        const cRight = getClosest(x + boundaryStep, y);
        const cDown = getClosest(x, y + boundaryStep);

        // Draw line if boundary detected
        if (c !== cRight) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x + boundaryStep);
          line.setAttribute('y1', y);
          line.setAttribute('x2', x + boundaryStep);
          line.setAttribute('y2', y + boundaryStep);
          line.setAttribute('stroke', 'white');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('opacity', '0.8');
          clustersGroup.appendChild(line);
        }

        if (c !== cDown) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x);
          line.setAttribute('y1', y + boundaryStep);
          line.setAttribute('x2', x + boundaryStep);
          line.setAttribute('y2', y + boundaryStep);
          line.setAttribute('stroke', 'white');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('opacity', '0.8');
          clustersGroup.appendChild(line);
        }
      }
    }

    // Don't draw centroids in Voronoi mode - cleaner visualization
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  function drawCentroid(centroid, color) {
    const cross = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', centroid.x - 10);
    line1.setAttribute('y1', centroid.y - 10);
    line1.setAttribute('x2', centroid.x + 10);
    line1.setAttribute('y2', centroid.y + 10);
    line1.setAttribute('stroke', color);
    line1.setAttribute('stroke-width', '3');

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', centroid.x - 10);
    line2.setAttribute('y1', centroid.y + 10);
    line2.setAttribute('x2', centroid.x + 10);
    line2.setAttribute('y2', centroid.y - 10);
    line2.setAttribute('stroke', color);
    line2.setAttribute('stroke-width', '3');

    cross.appendChild(line1);
    cross.appendChild(line2);
    clustersGroup.appendChild(cross);
  }

  // Track visualization mode
  let showVoronoi = false;
  let lastResult = null;

  function update(k) {
    lastResult = performClustering(k);
    drawPlayers(lastResult.assignments);
    if (showVoronoi) {
      drawClustersVoronoi(lastResult);
    } else {
      drawClustersCircles(lastResult);
    }
  }

  slider.addEventListener('input', (e) => {
    currentK = parseInt(e.target.value);
    valueDisplay.textContent = currentK;
    update(currentK);
  });

  resetBtn.addEventListener('click', () => {
    update(currentK);
  });

  voronoiBtn.addEventListener('click', () => {
    showVoronoi = !showVoronoi;
    voronoiBtn.textContent = showVoronoi ? 'Show Circles' : 'Show Voronoi';
    voronoiBtn.style.background = showVoronoi ? '#e67e22' : '#3498db';

    // Toggle field markings visibility
    if (fieldMarkings) {
      fieldMarkings.style.display = showVoronoi ? 'none' : 'block';
    }

    // Redraw with current result
    if (lastResult) {
      drawPlayers(lastResult.assignments);
      if (showVoronoi) {
        drawClustersVoronoi(lastResult);
      } else {
        drawClustersCircles(lastResult);
      }
    }
  });

  // Initial render
  update(currentK);
}

function drawField(svg, width, height) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  // Field outline
  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  outline.setAttribute('x', '10');
  outline.setAttribute('y', '10');
  outline.setAttribute('width', width - 20);
  outline.setAttribute('height', height - 20);
  outline.setAttribute('fill', 'none');
  outline.setAttribute('stroke', 'white');
  outline.setAttribute('stroke-width', '2');
  g.appendChild(outline);

  // Center line
  const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  centerLine.setAttribute('x1', width / 2);
  centerLine.setAttribute('y1', '10');
  centerLine.setAttribute('x2', width / 2);
  centerLine.setAttribute('y2', height - 10);
  centerLine.setAttribute('stroke', 'white');
  centerLine.setAttribute('stroke-width', '2');
  g.appendChild(centerLine);

  // Center circle
  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', width / 2);
  centerCircle.setAttribute('cy', height / 2);
  centerCircle.setAttribute('r', '50');
  centerCircle.setAttribute('fill', 'none');
  centerCircle.setAttribute('stroke', 'white');
  centerCircle.setAttribute('stroke-width', '2');
  g.appendChild(centerCircle);

  svg.appendChild(g);

  // Return the group element so we can toggle its visibility
  return g;
}
