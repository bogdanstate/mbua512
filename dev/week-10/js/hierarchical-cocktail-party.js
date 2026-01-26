/**
 * Hierarchical Clustering Visualization for Cocktail Party Dataset
 * Interactive demo showing agglomerative clustering with dendrogram
 */

export async function initHierarchicalCocktailParty(containerId, options = {}) {
  const {
    dataFile = 'data/cocktail-party-positions.csv',
    width = 1000,
    height = 750
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  container.innerHTML = '<p>Loading cocktail party data...</p>';

  // Load CSV data
  const response = await fetch(dataFile);
  const csvText = await response.text();

  const lines = csvText.trim().split('\n');
  const people = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      id: parseInt(values[0]),
      x: parseFloat(values[1]),
      y: parseFloat(values[2]),
      trueGroup: parseInt(values[3])
    };
  });

  container.innerHTML = '';

  // Create controls
  const controls = document.createElement('div');
  controls.style.cssText = 'margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;';

  const stepButton = document.createElement('button');
  stepButton.textContent = 'Step Forward';
  stepButton.style.cssText = 'padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.style.cssText = 'margin-left: 10px; padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

  const autoButton = document.createElement('button');
  autoButton.textContent = 'Auto-Run';
  autoButton.style.cssText = 'margin-left: 10px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

  const stepDisplay = document.createElement('span');
  stepDisplay.style.cssText = 'margin-left: 20px; font-size: 0.9em; color: #666;';

  const cutSliderLabel = document.createElement('label');
  cutSliderLabel.textContent = 'Cutting height: ';
  cutSliderLabel.style.cssText = 'margin-left: 30px; font-size: 0.9em;';

  const cutSlider = document.createElement('input');
  cutSlider.type = 'range';
  cutSlider.min = '0';
  cutSlider.max = '100';
  cutSlider.value = '70';
  cutSlider.style.cssText = 'width: 150px; margin: 0 10px;';

  const cutValue = document.createElement('span');
  cutValue.style.cssText = 'font-weight: bold; font-size: 0.9em;';

  const clusterCount = document.createElement('span');
  clusterCount.style.cssText = 'margin-left: 15px; font-size: 0.9em; color: #2196f3; font-weight: bold;';

  controls.appendChild(stepButton);
  controls.appendChild(resetButton);
  controls.appendChild(autoButton);
  controls.appendChild(stepDisplay);
  controls.appendChild(document.createElement('br'));
  controls.appendChild(cutSliderLabel);
  controls.appendChild(cutSlider);
  controls.appendChild(cutValue);
  controls.appendChild(clusterCount);
  container.appendChild(controls);

  // Create main content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = 'display: flex; gap: 20px; align-items: flex-start;';

  // Create info box on the left
  const infoBox = document.createElement('div');
  infoBox.style.cssText = 'width: 280px; flex-shrink: 0; background: #f8f9fa; border: 2px solid #ddd; border-radius: 8px; padding: 20px; font-size: 0.85em; line-height: 1.6;';
  infoBox.innerHTML = `
    <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 1em;">Algorithm Steps</h3>

    <p style="margin: 0 0 6px 0; font-weight: bold; color: #4caf50;">1. Start</p>
    <p style="margin: 0 0 10px 0; font-size: 0.95em;">Each person is their own cluster (100 clusters)</p>

    <p style="margin: 0 0 6px 0; font-weight: bold; color: #2196f3;">2. Find Closest</p>
    <p style="margin: 0 0 10px 0; font-size: 0.95em;">Calculate distances between all cluster pairs</p>

    <p style="margin: 0 0 6px 0; font-weight: bold; color: #9c27b0;">3. Merge</p>
    <p style="margin: 0 0 10px 0; font-size: 0.95em;">Combine the two closest clusters into one</p>

    <p style="margin: 0 0 6px 0; font-weight: bold; color: #ff9800;">4. Repeat</p>
    <p style="margin: 0 0 10px 0; font-size: 0.95em;">Continue until all points are in one cluster</p>

    <p style="margin: 0 0 6px 0; font-weight: bold; color: #e74c3c;">5. Cut Tree</p>
    <p style="margin: 0 0 4px 0; font-size: 0.95em;">Choose height threshold to get desired K clusters</p>

    <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px;">
      <p style="margin: 0; font-size: 0.9em; color: #1565c0;">
        <strong>Linkage:</strong> Complete (max distance between any pair)
      </p>
    </div>
  `;

  // Create right side wrapper for scatter + dendrogram
  const rightWrapper = document.createElement('div');
  rightWrapper.style.cssText = 'flex: 1; display: flex; gap: 15px;';

  // Create scatter plot SVG
  const scatterSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const scatterWidth = 600;
  const scatterHeight = height;
  scatterSvg.setAttribute('width', scatterWidth);
  scatterSvg.setAttribute('height', scatterHeight);
  scatterSvg.style.cssText = 'background: white; border: 2px solid #ddd; border-radius: 8px;';

  // Create dendrogram SVG
  const dendSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const dendWidth = 500;
  const dendHeight = height;
  dendSvg.setAttribute('width', dendWidth);
  dendSvg.setAttribute('height', dendHeight);
  dendSvg.style.cssText = 'background: white; border: 2px solid #ddd; border-radius: 8px;';

  rightWrapper.appendChild(scatterSvg);
  rightWrapper.appendChild(dendSvg);

  contentWrapper.appendChild(infoBox);
  contentWrapper.appendChild(rightWrapper);
  container.appendChild(contentWrapper);

  // Scale factors for scatter plot (room is 20x15m)
  const scatterMargin = 40;
  const scaleX = (scatterWidth - 2 * scatterMargin) / 20;
  const scaleY = (scatterHeight - 2 * scatterMargin) / 15;
  const toScreenX = (x) => x * scaleX + scatterMargin;
  const toScreenY = (y) => y * scaleY + scatterMargin;

  // Color palette for clusters
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];

  // Euclidean distance
  function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  // Complete linkage: max distance between any pair
  function clusterDistance(cluster1, cluster2) {
    let maxDist = 0;
    for (const p1 of cluster1.points) {
      for (const p2 of cluster2.points) {
        const d = distance(p1, p2);
        if (d > maxDist) maxDist = d;
      }
    }
    return maxDist;
  }

  // Hierarchical clustering
  function hierarchicalClustering(points) {
    const clusters = points.map((p, i) => ({
      id: i,
      points: [p],
      left: null,
      right: null,
      height: 0
    }));

    const mergeHistory = [];

    while (clusters.length > 1) {
      // Find closest pair
      let minDist = Infinity;
      let mergeI = -1, mergeJ = -1;

      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const dist = clusterDistance(clusters[i], clusters[j]);
          if (dist < minDist) {
            minDist = dist;
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      // Merge clusters
      const newCluster = {
        id: clusters.length + points.length,
        points: [...clusters[mergeI].points, ...clusters[mergeJ].points],
        left: clusters[mergeI],
        right: clusters[mergeJ],
        height: minDist
      };

      mergeHistory.push({
        cluster: newCluster,
        distance: minDist,
        step: mergeHistory.length,
        numClusters: clusters.length - 1
      });

      // Remove merged and add new
      const removed = [clusters[mergeI], clusters[mergeJ]];
      clusters.splice(Math.max(mergeI, mergeJ), 1);
      clusters.splice(Math.min(mergeI, mergeJ), 1);
      clusters.push(newCluster);
    }

    return { root: clusters[0], history: mergeHistory };
  }

  console.log('Running hierarchical clustering...');
  const { root, history } = hierarchicalClustering(people);
  console.log(`Clustering complete: ${history.length} merges`);

  // State
  let currentStep = 0;
  let maxHeight = Math.max(...history.map(h => h.distance));
  let cuttingHeight = maxHeight * 0.7;
  let isAutoRunning = false;
  let autoInterval = null;

  // Update cutting height display
  function updateCutDisplay() {
    const percentage = Math.round((cuttingHeight / maxHeight) * 100);
    cutValue.textContent = `${cuttingHeight.toFixed(2)}m (${percentage}%)`;
    cutSlider.value = percentage;
  }

  // Get clusters at current cutting height
  function getClustersAtHeight(node, height, clusters = []) {
    if (!node) return clusters;

    if (node.height <= height) {
      clusters.push(node.points);
    } else {
      getClustersAtHeight(node.left, height, clusters);
      getClustersAtHeight(node.right, height, clusters);
    }

    return clusters;
  }

  // Assign colors to points based on current clusters
  function assignColors() {
    const clusters = getClustersAtHeight(root, cuttingHeight);
    const pointToCluster = new Map();

    clusters.forEach((clusterPoints, idx) => {
      clusterPoints.forEach(p => {
        pointToCluster.set(p.id, idx % colors.length);
      });
    });

    return pointToCluster;
  }

  // Draw dendrogram
  function drawDendrogram() {
    // Clear previous
    while (dendSvg.firstChild) {
      dendSvg.removeChild(dendSvg.firstChild);
    }

    const dendMargin = { top: 20, right: 30, bottom: 30, left: 50 };
    const plotWidth = dendWidth - dendMargin.left - dendMargin.right;
    const plotHeight = dendHeight - dendMargin.top - dendMargin.bottom;

    // Create group for dendrogram
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${dendMargin.left},${dendMargin.top})`);

    // Assign leaf positions
    let leafPosition = 0;
    const leafPositions = new Map();

    function assignLeafPositions(node) {
      if (!node) return;
      if (node.points.length === 1) {
        leafPositions.set(node.id, leafPosition);
        leafPosition++;
      } else {
        assignLeafPositions(node.left);
        assignLeafPositions(node.right);
      }
    }
    assignLeafPositions(root);

    // Get cluster center position
    function getClusterX(node) {
      if (node.points.length === 1) {
        return (leafPositions.get(node.id) / people.length) * plotWidth;
      } else {
        const leftX = getClusterX(node.left);
        const rightX = getClusterX(node.right);
        return (leftX + rightX) / 2;
      }
    }

    // Height scale
    const heightScale = plotHeight / (maxHeight * 1.1);

    // Draw dendrogram recursively
    function drawNode(node) {
      if (!node || !node.left || !node.right) return;

      const x = getClusterX(node);
      const y = plotHeight - node.height * heightScale;
      const leftX = getClusterX(node.left);
      const leftY = plotHeight - node.left.height * heightScale;
      const rightX = getClusterX(node.right);
      const rightY = plotHeight - node.right.height * heightScale;

      // Draw vertical line
      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', x);
      vLine.setAttribute('y1', y);
      vLine.setAttribute('x2', x);
      vLine.setAttribute('y2', Math.max(leftY, rightY));
      vLine.setAttribute('stroke', '#666');
      vLine.setAttribute('stroke-width', '1.5');
      g.appendChild(vLine);

      // Draw horizontal line to left child
      const hLineLeft = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLineLeft.setAttribute('x1', x);
      hLineLeft.setAttribute('y1', leftY);
      hLineLeft.setAttribute('x2', leftX);
      hLineLeft.setAttribute('y2', leftY);
      hLineLeft.setAttribute('stroke', '#666');
      hLineLeft.setAttribute('stroke-width', '1.5');
      g.appendChild(hLineLeft);

      // Draw horizontal line to right child
      const hLineRight = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLineRight.setAttribute('x1', x);
      hLineRight.setAttribute('y1', rightY);
      hLineRight.setAttribute('x2', rightX);
      hLineRight.setAttribute('y2', rightY);
      hLineRight.setAttribute('stroke', '#666');
      hLineRight.setAttribute('stroke-width', '1.5');
      g.appendChild(hLineRight);

      drawNode(node.left);
      drawNode(node.right);
    }

    // Only draw up to current step
    let stepNode = root;
    for (let i = 0; i < currentStep && i < history.length; i++) {
      stepNode = history[i].cluster;
    }
    drawNode(stepNode);

    // Draw cutting height line
    const cutY = plotHeight - cuttingHeight * heightScale;
    const cutLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cutLine.setAttribute('x1', '0');
    cutLine.setAttribute('y1', cutY);
    cutLine.setAttribute('x2', plotWidth);
    cutLine.setAttribute('y2', cutY);
    cutLine.setAttribute('stroke', '#e74c3c');
    cutLine.setAttribute('stroke-width', '2');
    cutLine.setAttribute('stroke-dasharray', '5,5');
    g.appendChild(cutLine);

    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', '0');
    yAxis.setAttribute('y1', '0');
    yAxis.setAttribute('x2', '0');
    yAxis.setAttribute('y2', plotHeight);
    yAxis.setAttribute('stroke', '#333');
    yAxis.setAttribute('stroke-width', '2');
    g.appendChild(yAxis);

    // Y-axis label
    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', -plotHeight / 2);
    yLabel.setAttribute('y', -35);
    yLabel.setAttribute('transform', 'rotate(-90)');
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '12');
    yLabel.setAttribute('fill', '#333');
    yLabel.textContent = 'Distance (meters)';
    g.appendChild(yLabel);

    // Add some tick marks
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const tickHeight = (maxHeight * i) / numTicks;
      const tickY = plotHeight - tickHeight * heightScale;

      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', '-5');
      tick.setAttribute('y1', tickY);
      tick.setAttribute('x2', '0');
      tick.setAttribute('y2', tickY);
      tick.setAttribute('stroke', '#333');
      tick.setAttribute('stroke-width', '1');
      g.appendChild(tick);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', '-10');
      label.setAttribute('y', tickY + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '10');
      label.setAttribute('fill', '#666');
      label.textContent = tickHeight.toFixed(1);
      g.appendChild(label);
    }

    dendSvg.appendChild(g);
  }

  // Draw scatter plot
  function drawScatter() {
    // Clear previous
    while (scatterSvg.firstChild) {
      scatterSvg.removeChild(scatterSvg.firstChild);
    }

    const pointToCluster = assignColors();
    const clusters = getClustersAtHeight(root, cuttingHeight);

    // Draw axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', scatterMargin);
    xAxis.setAttribute('y1', scatterHeight - scatterMargin);
    xAxis.setAttribute('x2', scatterWidth - scatterMargin);
    xAxis.setAttribute('y2', scatterHeight - scatterMargin);
    xAxis.setAttribute('stroke', '#333');
    xAxis.setAttribute('stroke-width', '2');
    scatterSvg.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', scatterMargin);
    yAxis.setAttribute('y1', scatterMargin);
    yAxis.setAttribute('x2', scatterMargin);
    yAxis.setAttribute('y2', scatterHeight - scatterMargin);
    yAxis.setAttribute('stroke', '#333');
    yAxis.setAttribute('stroke-width', '2');
    scatterSvg.appendChild(yAxis);

    // Draw points
    people.forEach(person => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', toScreenX(person.x));
      circle.setAttribute('cy', toScreenY(person.y));
      circle.setAttribute('r', '5');

      const clusterIdx = pointToCluster.get(person.id);
      circle.setAttribute('fill', colors[clusterIdx]);
      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('opacity', '0.8');

      scatterSvg.appendChild(circle);
    });

    // Update cluster count
    clusterCount.textContent = `${clusters.length} clusters`;
  }

  // Render function
  function render() {
    stepDisplay.textContent = currentStep === history.length
      ? `Complete! (${history.length} merges)`
      : `Step ${currentStep} / ${history.length}`;

    updateCutDisplay();
    drawScatter();
    drawDendrogram();

    // Disable step button if complete
    stepButton.disabled = currentStep >= history.length;
    stepButton.style.opacity = stepButton.disabled ? '0.5' : '1';
    stepButton.style.cursor = stepButton.disabled ? 'not-allowed' : 'pointer';
  }

  // Event handlers
  stepButton.addEventListener('click', () => {
    if (currentStep < history.length) {
      currentStep++;
      render();
    }
  });

  resetButton.addEventListener('click', () => {
    currentStep = 0;
    isAutoRunning = false;
    if (autoInterval) {
      clearInterval(autoInterval);
      autoInterval = null;
    }
    autoButton.textContent = 'Auto-Run';
    autoButton.style.background = '#2196f3';
    render();
  });

  autoButton.addEventListener('click', () => {
    if (isAutoRunning) {
      // Stop
      isAutoRunning = false;
      clearInterval(autoInterval);
      autoInterval = null;
      autoButton.textContent = 'Auto-Run';
      autoButton.style.background = '#2196f3';
    } else {
      // Start
      isAutoRunning = true;
      autoButton.textContent = 'Stop';
      autoButton.style.background = '#f44336';

      autoInterval = setInterval(() => {
        if (currentStep < history.length) {
          currentStep++;
          render();
        } else {
          // Done
          isAutoRunning = false;
          clearInterval(autoInterval);
          autoInterval = null;
          autoButton.textContent = 'Auto-Run';
          autoButton.style.background = '#2196f3';
        }
      }, 300);
    }
  });

  cutSlider.addEventListener('input', (e) => {
    const percentage = parseInt(e.target.value);
    cuttingHeight = (percentage / 100) * maxHeight;
    render();
  });

  // Initial render
  render();
}
