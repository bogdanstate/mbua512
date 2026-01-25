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

  // Draw field markings
  drawField(svg, fieldWidth, fieldHeight);

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
  slider.max = '8';
  slider.value = '2';
  slider.style.cssText = 'width: 200px; vertical-align: middle; margin-right: 10px;';

  const valueDisplay = document.createElement('span');
  valueDisplay.style.cssText = 'font-size: 18px; font-weight: bold; color: #4CAF50; min-width: 30px; display: inline-block;';
  valueDisplay.textContent = '2';

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset Animation';
  resetBtn.style.cssText = 'margin-left: 20px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';

  controls.appendChild(label);
  controls.appendChild(slider);
  controls.appendChild(valueDisplay);
  controls.appendChild(resetBtn);
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
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA'];

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

  function drawClusters(result) {
    clustersGroup.innerHTML = '';

    if (!result) return;

    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA'];

    result.centroids.forEach((centroid, idx) => {
      // Draw centroid
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

  function update(k) {
    const result = performClustering(k);
    drawPlayers(result.assignments);
    drawClusters(result);
  }

  slider.addEventListener('input', (e) => {
    currentK = parseInt(e.target.value);
    valueDisplay.textContent = currentK;
    update(currentK);
  });

  resetBtn.addEventListener('click', () => {
    update(currentK);
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
}
