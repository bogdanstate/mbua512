/**
 * K-means Evaluation Metrics: Elbow Method and Silhouette Analysis
 */

export async function initElbowPlot(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  container.innerHTML = '<p>Loading elbow plot data...</p>';

  // Load cocktail party data
  const response = await fetch('data/cocktail-party-positions.csv');
  const csvText = await response.text();
  const lines = csvText.trim().split('\n');
  const people = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      id: parseInt(values[0]),
      x: parseFloat(values[1]),
      y: parseFloat(values[2])
    };
  });

  // Calculate WCSS for K = 2 to 10
  const kValues = [];
  const wcssValues = [];

  for (let k = 2; k <= 10; k++) {
    const wcss = calculateWCSS(people, k);
    kValues.push(k);
    wcssValues.push(wcss);
  }

  // Render plot
  container.innerHTML = '';
  renderElbowPlot(container, kValues, wcssValues);
}

export async function initSilhouettePlot(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  container.innerHTML = '<p>Loading silhouette plot data...</p>';

  // Load cocktail party data
  const response = await fetch('data/cocktail-party-positions.csv');
  const csvText = await response.text();
  const lines = csvText.trim().split('\n');
  const people = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      id: parseInt(values[0]),
      x: parseFloat(values[1]),
      y: parseFloat(values[2])
    };
  });

  // Calculate average silhouette score for K = 2 to 10
  const kValues = [];
  const silhouetteValues = [];

  for (let k = 2; k <= 10; k++) {
    const score = calculateAverageSilhouette(people, k);
    kValues.push(k);
    silhouetteValues.push(score);
  }

  // Render plot
  container.innerHTML = '';
  renderSilhouettePlot(container, kValues, silhouetteValues);
}

// ============================================================================
// K-means Implementation
// ============================================================================

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function runKMeans(people, k, maxIterations = 100) {
  // Initialize centroids using k-means++
  const centroids = initializeCentroidsKMeansPlusPlus(people, k);
  let assignments = new Array(people.length);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Assign points to nearest centroid
    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      let minDist = Infinity;
      let bestCluster = 0;

      for (let c = 0; c < k; c++) {
        const dist = distance(person, centroids[c]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = c;
        }
      }

      if (assignments[i] !== bestCluster) {
        changed = true;
        assignments[i] = bestCluster;
      }
    }

    // Update centroids
    for (let c = 0; c < k; c++) {
      const clusterPoints = people.filter((_, i) => assignments[i] === c);
      if (clusterPoints.length > 0) {
        centroids[c] = {
          x: clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length,
          y: clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length
        };
      }
    }
  }

  return { centroids, assignments };
}

function initializeCentroidsKMeansPlusPlus(people, k) {
  const centroids = [];

  // Pick first centroid randomly
  centroids.push({ ...people[Math.floor(Math.random() * people.length)] });

  // Pick remaining centroids with probability proportional to distance squared
  for (let i = 1; i < k; i++) {
    const distances = people.map(p => {
      const minDist = Math.min(...centroids.map(c => distance(p, c)));
      return minDist * minDist;
    });

    const totalDist = distances.reduce((sum, d) => sum + d, 0);
    let rand = Math.random() * totalDist;

    for (let j = 0; j < people.length; j++) {
      rand -= distances[j];
      if (rand <= 0) {
        centroids.push({ ...people[j] });
        break;
      }
    }
  }

  return centroids;
}

// ============================================================================
// WCSS Calculation (Elbow Method)
// ============================================================================

function calculateWCSS(people, k) {
  const { centroids, assignments } = runKMeans(people, k);

  let wcss = 0;
  for (let i = 0; i < people.length; i++) {
    const clusterIdx = assignments[i];
    const dist = distance(people[i], centroids[clusterIdx]);
    wcss += dist * dist;
  }

  return wcss;
}

// ============================================================================
// Silhouette Score Calculation
// ============================================================================

function calculateAverageSilhouette(people, k) {
  const { assignments } = runKMeans(people, k);

  let totalScore = 0;

  for (let i = 0; i < people.length; i++) {
    const clusterIdx = assignments[i];

    // Calculate a(i): average distance to points in same cluster
    const sameCluster = people.filter((_, j) => assignments[j] === clusterIdx && j !== i);
    const a = sameCluster.length > 0
      ? sameCluster.reduce((sum, p) => sum + distance(people[i], p), 0) / sameCluster.length
      : 0;

    // Calculate b(i): minimum average distance to points in other clusters
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === clusterIdx) continue;

      const otherCluster = people.filter((_, j) => assignments[j] === c);
      if (otherCluster.length > 0) {
        const avgDist = otherCluster.reduce((sum, p) => sum + distance(people[i], p), 0) / otherCluster.length;
        b = Math.min(b, avgDist);
      }
    }

    // Silhouette score for point i
    const s = b === Infinity ? 0 : (b - a) / Math.max(a, b);
    totalScore += s;
  }

  return totalScore / people.length;
}

// ============================================================================
// Rendering Functions
// ============================================================================

function renderElbowPlot(container, kValues, wcssValues) {
  const width = 800;
  const height = 500;
  const margin = { top: 40, right: 40, bottom: 60, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.cssText = 'background: white; border: 2px solid #ddd; border-radius: 8px;';

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
  svg.appendChild(g);

  // Scales
  const xScale = (k) => ((k - 2) / (10 - 2)) * plotWidth;
  const maxWCSS = Math.max(...wcssValues);
  const minWCSS = Math.min(...wcssValues);
  const yScale = (wcss) => plotHeight - ((wcss - minWCSS) / (maxWCSS - minWCSS)) * plotHeight;

  // Draw axes
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', 0);
  xAxis.setAttribute('y1', plotHeight);
  xAxis.setAttribute('x2', plotWidth);
  xAxis.setAttribute('y2', plotHeight);
  xAxis.setAttribute('stroke', '#333');
  xAxis.setAttribute('stroke-width', '2');
  g.appendChild(xAxis);

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', 0);
  yAxis.setAttribute('y1', 0);
  yAxis.setAttribute('x2', 0);
  yAxis.setAttribute('y2', plotHeight);
  yAxis.setAttribute('stroke', '#333');
  yAxis.setAttribute('stroke-width', '2');
  g.appendChild(yAxis);

  // X-axis labels
  for (let k = 2; k <= 10; k++) {
    const x = xScale(k);

    // Tick
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x);
    tick.setAttribute('y1', plotHeight);
    tick.setAttribute('x2', x);
    tick.setAttribute('y2', plotHeight + 5);
    tick.setAttribute('stroke', '#333');
    tick.setAttribute('stroke-width', '2');
    g.appendChild(tick);

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', plotHeight + 25);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '14');
    label.textContent = k;
    g.appendChild(label);
  }

  // Y-axis labels
  for (let i = 0; i <= 5; i++) {
    const wcss = minWCSS + (maxWCSS - minWCSS) * (i / 5);
    const y = yScale(wcss);

    // Tick
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', -5);
    tick.setAttribute('y1', y);
    tick.setAttribute('x2', 0);
    tick.setAttribute('y2', y);
    tick.setAttribute('stroke', '#333');
    tick.setAttribute('stroke-width', '2');
    g.appendChild(tick);

    // Grid line
    const grid = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    grid.setAttribute('x1', 0);
    grid.setAttribute('y1', y);
    grid.setAttribute('x2', plotWidth);
    grid.setAttribute('y2', y);
    grid.setAttribute('stroke', '#ddd');
    grid.setAttribute('stroke-width', '1');
    grid.setAttribute('stroke-dasharray', '5,5');
    g.appendChild(grid);

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', -10);
    label.setAttribute('y', y + 5);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('font-size', '12');
    label.textContent = Math.round(wcss);
    g.appendChild(label);
  }

  // Draw line
  const pathData = kValues.map((k, i) => {
    const x = xScale(k);
    const y = yScale(wcssValues[i]);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#2196f3');
  path.setAttribute('stroke-width', '3');
  g.appendChild(path);

  // Draw points
  kValues.forEach((k, i) => {
    const x = xScale(k);
    const y = yScale(wcssValues[i]);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', k >= 5 && k <= 6 ? '#ff5722' : '#2196f3');
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);
  });

  // Highlight elbow region (K=5-6)
  const elbowRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  elbowRect.setAttribute('x', xScale(5) - 30);
  elbowRect.setAttribute('y', 0);
  elbowRect.setAttribute('width', xScale(6) - xScale(5) + 60);
  elbowRect.setAttribute('height', plotHeight);
  elbowRect.setAttribute('fill', '#ffebee');
  elbowRect.setAttribute('opacity', '0.3');
  g.insertBefore(elbowRect, g.firstChild);

  // Axis titles
  const xTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xTitle.setAttribute('x', plotWidth / 2);
  xTitle.setAttribute('y', plotHeight + 50);
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-size', '16');
  xTitle.setAttribute('font-weight', 'bold');
  xTitle.textContent = 'Number of Clusters (K)';
  g.appendChild(xTitle);

  const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yTitle.setAttribute('x', -plotHeight / 2);
  yTitle.setAttribute('y', -55);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('font-size', '16');
  yTitle.setAttribute('font-weight', 'bold');
  yTitle.setAttribute('transform', `rotate(-90, 0, 0)`);
  yTitle.textContent = 'Within-Cluster Sum of Squares (WCSS)';
  g.appendChild(yTitle);

  container.appendChild(svg);
}

function renderSilhouettePlot(container, kValues, silhouetteValues) {
  const width = 800;
  const height = 500;
  const margin = { top: 40, right: 40, bottom: 60, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.style.cssText = 'background: white; border: 2px solid #ddd; border-radius: 8px;';

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
  svg.appendChild(g);

  // Scales
  const xScale = (k) => ((k - 2) / (10 - 2)) * plotWidth;
  const maxScore = Math.max(...silhouetteValues);
  const minScore = Math.min(...silhouetteValues);
  const yScale = (score) => plotHeight - ((score - minScore) / (maxScore - minScore)) * plotHeight;

  // Draw axes
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', 0);
  xAxis.setAttribute('y1', plotHeight);
  xAxis.setAttribute('x2', plotWidth);
  xAxis.setAttribute('y2', plotHeight);
  xAxis.setAttribute('stroke', '#333');
  xAxis.setAttribute('stroke-width', '2');
  g.appendChild(xAxis);

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', 0);
  yAxis.setAttribute('y1', 0);
  yAxis.setAttribute('x2', 0);
  yAxis.setAttribute('y2', plotHeight);
  yAxis.setAttribute('stroke', '#333');
  yAxis.setAttribute('stroke-width', '2');
  g.appendChild(yAxis);

  // X-axis labels
  for (let k = 2; k <= 10; k++) {
    const x = xScale(k);

    // Tick
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x);
    tick.setAttribute('y1', plotHeight);
    tick.setAttribute('x2', x);
    tick.setAttribute('y2', plotHeight + 5);
    tick.setAttribute('stroke', '#333');
    tick.setAttribute('stroke-width', '2');
    g.appendChild(tick);

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', plotHeight + 25);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '14');
    label.textContent = k;
    g.appendChild(label);
  }

  // Y-axis labels
  for (let i = 0; i <= 5; i++) {
    const score = minScore + (maxScore - minScore) * (i / 5);
    const y = yScale(score);

    // Tick
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', -5);
    tick.setAttribute('y1', y);
    tick.setAttribute('x2', 0);
    tick.setAttribute('y2', y);
    tick.setAttribute('stroke', '#333');
    tick.setAttribute('stroke-width', '2');
    g.appendChild(tick);

    // Grid line
    const grid = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    grid.setAttribute('x1', 0);
    grid.setAttribute('y1', y);
    grid.setAttribute('x2', plotWidth);
    grid.setAttribute('y2', y);
    grid.setAttribute('stroke', '#ddd');
    grid.setAttribute('stroke-width', '1');
    grid.setAttribute('stroke-dasharray', '5,5');
    g.appendChild(grid);

    // Label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', -10);
    label.setAttribute('y', y + 5);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('font-size', '12');
    label.textContent = score.toFixed(3);
    g.appendChild(label);
  }

  // Draw line
  const pathData = kValues.map((k, i) => {
    const x = xScale(k);
    const y = yScale(silhouetteValues[i]);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#4caf50');
  path.setAttribute('stroke-width', '3');
  g.appendChild(path);

  // Draw points and find peak
  const maxIdx = silhouetteValues.indexOf(Math.max(...silhouetteValues));
  kValues.forEach((k, i) => {
    const x = xScale(k);
    const y = yScale(silhouetteValues[i]);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', i === maxIdx ? '#ff5722' : '#4caf50');
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '2');
    g.appendChild(circle);
  });

  // Highlight optimal K
  const optimalK = kValues[maxIdx];
  const highlightCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  highlightCircle.setAttribute('cx', xScale(optimalK));
  highlightCircle.setAttribute('cy', yScale(silhouetteValues[maxIdx]));
  highlightCircle.setAttribute('r', '15');
  highlightCircle.setAttribute('fill', 'none');
  highlightCircle.setAttribute('stroke', '#ff5722');
  highlightCircle.setAttribute('stroke-width', '2');
  highlightCircle.setAttribute('stroke-dasharray', '5,5');
  g.appendChild(highlightCircle);

  // Axis titles
  const xTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xTitle.setAttribute('x', plotWidth / 2);
  xTitle.setAttribute('y', plotHeight + 50);
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-size', '16');
  xTitle.setAttribute('font-weight', 'bold');
  xTitle.textContent = 'Number of Clusters (K)';
  g.appendChild(xTitle);

  const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yTitle.setAttribute('x', -plotHeight / 2);
  yTitle.setAttribute('y', -55);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('font-size', '16');
  yTitle.setAttribute('font-weight', 'bold');
  yTitle.setAttribute('transform', `rotate(-90, 0, 0)`);
  yTitle.textContent = 'Average Silhouette Score';
  g.appendChild(yTitle);

  container.appendChild(svg);
}
