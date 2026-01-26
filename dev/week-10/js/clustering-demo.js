/**
 * Generic clustering visualization for soccer match data
 * Supports: K-means, DBSCAN, and Graph-based clustering
 */

export async function initClusteringDemo(containerId, options = {}) {
  const {
    dataFile = 'data/soccer-positions.json',
    method = 'kmeans', // 'kmeans', 'dbscan', 'graph'
    defaultParam = 3,
    paramMin = 1,
    paramMax = 11,
    paramLabel = 'k',
    title = 'Clustering Demo'
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Load match data
  let matchData;
  try {
    const response = await fetch(dataFile);
    matchData = await response.json();
    console.log(`Loaded: ${matchData.metadata.description}`);
  } catch (err) {
    console.error('Failed to load match data:', err);
    container.innerHTML = '<p style="color: red;">Failed to load match data</p>';
    return;
  }

  // Field dimensions
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

  // Draw field markings
  const fieldMarkings = drawField(svg, fieldWidth, fieldHeight);

  // Extract and scale player positions
  const team1Players = matchData.teams[0].players.map(p => ({ ...p, teamIdx: 0 }));
  const team2Players = matchData.teams[1].players.map(p => ({ ...p, teamIdx: 1 }));

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

  // Groups for rendering
  const playerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  playerGroup.id = 'players';
  svg.appendChild(playerGroup);

  const clustersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  clustersGroup.id = 'clusters';
  svg.appendChild(clustersGroup);

  container.innerHTML = '';
  container.appendChild(svg);

  // Controls
  const controls = document.createElement('div');
  controls.style.cssText = 'margin-top: 15px; text-align: center; font-family: sans-serif;';

  const label = document.createElement('label');
  label.style.cssText = 'font-size: 16px; font-weight: 600; color: white; margin-right: 15px;';
  label.textContent = `${paramLabel}: `;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = paramMin.toString();
  slider.max = paramMax.toString();
  slider.value = defaultParam.toString();
  slider.style.cssText = 'width: 200px; vertical-align: middle; margin-right: 10px;';

  const valueDisplay = document.createElement('span');
  valueDisplay.style.cssText = 'font-size: 18px; font-weight: bold; color: #4CAF50; min-width: 30px; display: inline-block;';
  valueDisplay.textContent = defaultParam.toString();

  controls.appendChild(label);
  controls.appendChild(slider);
  controls.appendChild(valueDisplay);

  // Add toggle button for k-means (Voronoi) or DBSCAN (kernels)
  let toggleBtn = null;
  let showSpecialViz = false;

  if (method === 'kmeans' || method === 'dbscan') {
    toggleBtn = document.createElement('button');
    toggleBtn.textContent = method === 'kmeans' ? 'Show Voronoi' : 'Show Kernels';
    toggleBtn.style.cssText = 'margin-left: 20px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';
    controls.appendChild(toggleBtn);
  }

  container.appendChild(controls);

  // Info display
  const info = document.createElement('div');
  info.style.cssText = 'margin-top: 10px; text-align: center; color: #ddd; font-size: 13px;';

  // Create parameter explanation based on method
  let paramExplanation = '';
  if (method === 'kmeans') {
    paramExplanation = '<em>k controls the number of cluster centroids</em>';
  } else if (method === 'dbscan') {
    paramExplanation = '<em>ε (epsilon) defines the neighborhood radius for density calculation</em>';
  } else if (method === 'graph') {
    paramExplanation = '<em>Distance threshold determines which points connect via edges</em>';
  }

  info.innerHTML = `
    <p><strong>${matchData.metadata.description}</strong></p>
    <p style="margin-top: 5px; font-size: 12px;">${paramExplanation}</p>
  `;
  container.appendChild(info);

  // Colors for clusters
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#FFA07A', '#98D8C8', '#F7DC6F'];

  // Clustering functions
  function kMeansClustering(k) {
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPlayer = players[Math.floor(Math.random() * players.length)];
      centroids.push({
        x: randomPlayer.x + (Math.random() - 0.5) * 20,
        y: randomPlayer.y + (Math.random() - 0.5) * 20
      });
    }

    for (let iter = 0; iter < 10; iter++) {
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

    const finalAssignments = players.map(p => {
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

    return { assignments: finalAssignments, centroids, method: 'kmeans' };
  }

  function dbscanClustering(epsilon) {
    const eps = epsilon * 15; // Scale epsilon for visualization
    const minPts = 2;
    const visited = new Array(players.length).fill(false);
    const clusters = new Array(players.length).fill(-1);
    let currentCluster = 0;

    function getNeighbors(pIdx) {
      const neighbors = [];
      players.forEach((p, idx) => {
        if (idx === pIdx) return;
        const dist = Math.sqrt(
          (players[pIdx].x - p.x) ** 2 + (players[pIdx].y - p.y) ** 2
        );
        if (dist <= eps) neighbors.push(idx);
      });
      return neighbors;
    }

    function expandCluster(pIdx, neighbors) {
      clusters[pIdx] = currentCluster;
      const queue = [...neighbors];

      while (queue.length > 0) {
        const qIdx = queue.shift();
        if (!visited[qIdx]) {
          visited[qIdx] = true;
          const qNeighbors = getNeighbors(qIdx);
          if (qNeighbors.length >= minPts) {
            queue.push(...qNeighbors);
          }
        }
        if (clusters[qIdx] === -1) {
          clusters[qIdx] = currentCluster;
        }
      }
    }

    players.forEach((p, idx) => {
      if (visited[idx]) return;
      visited[idx] = true;
      const neighbors = getNeighbors(idx);

      if (neighbors.length >= minPts) {
        expandCluster(idx, neighbors);
        currentCluster++;
      }
    });

    return { assignments: clusters, method: 'dbscan', epsilon: eps };
  }

  function graphClustering(threshold) {
    const maxDist = threshold * 5; // Scale threshold (5-30 slider → 25-150 pixels)
    const visited = new Array(players.length).fill(false);
    const clusters = new Array(players.length).fill(-1);
    let currentCluster = 0;

    function dfs(pIdx) {
      visited[pIdx] = true;
      clusters[pIdx] = currentCluster;

      players.forEach((p, idx) => {
        if (!visited[idx]) {
          const dist = Math.sqrt(
            (players[pIdx].x - p.x) ** 2 + (players[pIdx].y - p.y) ** 2
          );
          if (dist <= maxDist) {
            dfs(idx);
          }
        }
      });
    }

    players.forEach((p, idx) => {
      if (!visited[idx]) {
        dfs(idx);
        currentCluster++;
      }
    });

    return { assignments: clusters, method: 'graph', threshold: maxDist };
  }

  function drawPlayers(assignments) {
    playerGroup.innerHTML = '';

    players.forEach((player, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', player.x);
      circle.setAttribute('cy', player.y);
      circle.setAttribute('r', '8');
      const clusterIdx = assignments[idx];
      const color = clusterIdx >= 0 ? colors[clusterIdx % colors.length] : '#666666';
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '2');
      playerGroup.appendChild(circle);
    });
  }

  function drawVoronoi(result) {
    if (!result.centroids) return;

    const width = fieldWidth - 2 * padding;
    const height = fieldHeight - 2 * padding;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x = px + padding;
        const y = py + padding;

        let minDist = Infinity;
        let closestIdx = 0;

        result.centroids.forEach((centroid, idx) => {
          const dist = Math.sqrt((x - centroid.x) ** 2 + (y - centroid.y) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });

        const color = colors[closestIdx % colors.length];
        const rgb = hexToRgb(color);
        const idx = (py * width + px) * 4;
        data[idx] = rgb.r;
        data[idx + 1] = rgb.g;
        data[idx + 2] = rgb.b;
        data[idx + 3] = 38;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const dataURL = canvas.toDataURL();
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttribute('x', padding);
    image.setAttribute('y', padding);
    image.setAttribute('width', width);
    image.setAttribute('height', height);
    image.setAttribute('href', dataURL);
    clustersGroup.appendChild(image);

    // Draw boundaries
    const boundaryStep = 3;
    for (let py = 0; py < height - boundaryStep; py += boundaryStep) {
      for (let px = 0; px < width - boundaryStep; px += boundaryStep) {
        const x = px + padding;
        const y = py + padding;

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
  }

  function drawKernels(result) {
    if (!result.epsilon) return;

    // Classify points as core, border, or noise
    const pointTypes = players.map((player, idx) => {
      let neighborCount = 0;
      players.forEach((p2, idx2) => {
        if (idx !== idx2) {
          const dist = Math.sqrt((player.x - p2.x) ** 2 + (player.y - p2.y) ** 2);
          if (dist <= result.epsilon) neighborCount++;
        }
      });

      if (neighborCount >= 2) return 'core';
      if (result.assignments[idx] >= 0) return 'border';
      return 'noise';
    });

    // Draw Gaussian kernel density estimation for each core point
    const kernelRadius = result.epsilon * 2; // Draw kernel out to 2 standard deviations
    const sigma = result.epsilon / 2; // Standard deviation

    pointTypes.forEach((type, idx) => {
      if (type === 'core') {
        const player = players[idx];
        const clusterColor = colors[result.assignments[idx] % colors.length];

        // Create radial gradient for Gaussian distribution
        const gradientId = `gaussian-${idx}`;
        const defs = svg.querySelector('defs') || (() => {
          const d = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          svg.insertBefore(d, svg.firstChild);
          return d;
        })();

        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', gradientId);
        gradient.setAttribute('cx', '50%');
        gradient.setAttribute('cy', '50%');
        gradient.setAttribute('r', '50%');

        // Create gradient stops to approximate Gaussian distribution
        // Gaussian: f(r) = exp(-r²/(2σ²))
        const numStops = 10;
        for (let i = 0; i < numStops; i++) {
          const offset = i / (numStops - 1);
          const r = offset * 2; // r in units of sigma (0 to 2σ)
          const gaussianValue = Math.exp(-(r * r) / 2);
          const opacity = gaussianValue * 0.15; // Scale max opacity to 0.15 (fainter)

          const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop.setAttribute('offset', `${offset * 100}%`);
          stop.setAttribute('stop-color', clusterColor);
          stop.setAttribute('stop-opacity', opacity.toString());
          gradient.appendChild(stop);
        }

        defs.appendChild(gradient);

        // Draw circle with gradient fill
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', player.x);
        circle.setAttribute('cy', player.y);
        circle.setAttribute('r', kernelRadius);
        circle.setAttribute('fill', `url(#${gradientId})`);
        clustersGroup.appendChild(circle);
      }
    });

    // Draw border and noise points with different styling
    pointTypes.forEach((type, idx) => {
      const player = players[idx];
      if (type === 'border') {
        // Border points: smaller, semi-transparent
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', player.x);
        circle.setAttribute('cy', player.y);
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', colors[result.assignments[idx] % colors.length]);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '1.5');
        circle.setAttribute('opacity', '0.7');
        clustersGroup.appendChild(circle);
      } else if (type === 'noise') {
        // Noise points: X marker
        const cross = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('x1', player.x - 4);
        line1.setAttribute('y1', player.y - 4);
        line1.setAttribute('x2', player.x + 4);
        line1.setAttribute('y2', player.y + 4);
        line1.setAttribute('stroke', '#999');
        line1.setAttribute('stroke-width', '2');

        const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('x1', player.x - 4);
        line2.setAttribute('y1', player.y + 4);
        line2.setAttribute('x2', player.x + 4);
        line2.setAttribute('y2', player.y - 4);
        line2.setAttribute('stroke', '#999');
        line2.setAttribute('stroke-width', '2');

        cross.appendChild(line1);
        cross.appendChild(line2);
        clustersGroup.appendChild(cross);
      }
    });
  }

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }

  function drawClusters(result) {
    clustersGroup.innerHTML = '';

    if (result.method === 'kmeans') {
      if (showSpecialViz) {
        drawVoronoi(result);
        fieldMarkings.style.display = 'none';
      } else {
        fieldMarkings.style.display = 'block';
        // Draw centroids
        if (result.centroids) {
          result.centroids.forEach((centroid, idx) => {
            const cross = document.createElementNS('http://www.w3.org/2000/svg', 'g');

            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', centroid.x - 10);
            line1.setAttribute('y1', centroid.y - 10);
            line1.setAttribute('x2', centroid.x + 10);
            line1.setAttribute('y2', centroid.y + 10);
            line1.setAttribute('stroke', colors[idx % colors.length]);
            line1.setAttribute('stroke-width', '3');

            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', centroid.x - 10);
            line2.setAttribute('y1', centroid.y + 10);
            line2.setAttribute('x2', centroid.x + 10);
            line2.setAttribute('y2', centroid.y - 10);
            line2.setAttribute('stroke', colors[idx % colors.length]);
            line2.setAttribute('stroke-width', '3');

            cross.appendChild(line1);
            cross.appendChild(line2);
            clustersGroup.appendChild(cross);
          });
        }
      }
    } else if (result.method === 'dbscan') {
      if (showSpecialViz) {
        // Hide regular player dots when showing kernel density
        playerGroup.style.display = 'none';
        drawKernels(result);
      } else {
        // Show regular player dots when not showing kernels
        playerGroup.style.display = 'block';
      }
    } else if (result.method === 'graph' && result.threshold) {
      // Draw edges for graph-based clustering
      players.forEach((p1, i) => {
        players.forEach((p2, j) => {
          if (i < j && result.assignments[i] === result.assignments[j] && result.assignments[i] >= 0) {
            const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
            if (dist <= result.threshold) {
              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', p1.x);
              line.setAttribute('y1', p1.y);
              line.setAttribute('x2', p2.x);
              line.setAttribute('y2', p2.y);
              line.setAttribute('stroke', colors[result.assignments[i] % colors.length]);
              line.setAttribute('stroke-width', '2');
              line.setAttribute('opacity', '0.4');
              clustersGroup.appendChild(line);
            }
          }
        });
      });
    }
  }

  function update(param) {
    let result;
    if (method === 'kmeans') {
      result = kMeansClustering(param);
    } else if (method === 'dbscan') {
      result = dbscanClustering(param);
    } else if (method === 'graph') {
      result = graphClustering(param);
    }

    drawPlayers(result.assignments);
    drawClusters(result);
  }

  slider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    valueDisplay.textContent = value;
    update(value);
  });

  // Toggle button event listener
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      showSpecialViz = !showSpecialViz;
      if (method === 'kmeans') {
        toggleBtn.textContent = showSpecialViz ? 'Show Centroids' : 'Show Voronoi';
        toggleBtn.style.background = showSpecialViz ? '#e67e22' : '#3498db';
      } else if (method === 'dbscan') {
        toggleBtn.textContent = showSpecialViz ? 'Hide Kernels' : 'Show Kernels';
        toggleBtn.style.background = showSpecialViz ? '#e67e22' : '#3498db';
      }

      // Redraw with current result
      const currentValue = parseInt(slider.value);
      update(currentValue);
    });
  }

  // Initial render
  update(defaultParam);
}

function drawField(svg, width, height) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  outline.setAttribute('x', '10');
  outline.setAttribute('y', '10');
  outline.setAttribute('width', width - 20);
  outline.setAttribute('height', height - 20);
  outline.setAttribute('fill', 'none');
  outline.setAttribute('stroke', 'white');
  outline.setAttribute('stroke-width', '2');
  g.appendChild(outline);

  const centerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  centerLine.setAttribute('x1', width / 2);
  centerLine.setAttribute('y1', '10');
  centerLine.setAttribute('x2', width / 2);
  centerLine.setAttribute('y2', height - 10);
  centerLine.setAttribute('stroke', 'white');
  centerLine.setAttribute('stroke-width', '2');
  g.appendChild(centerLine);

  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', width / 2);
  centerCircle.setAttribute('cy', height / 2);
  centerCircle.setAttribute('r', '50');
  centerCircle.setAttribute('fill', 'none');
  centerCircle.setAttribute('stroke', 'white');
  centerCircle.setAttribute('stroke-width', '2');
  g.appendChild(centerCircle);

  svg.appendChild(g);
  return g;
}
