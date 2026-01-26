/**
 * Interactive "What is a Cluster?" Visualization
 * 5-step progression from raw points to hierarchical clustering with dendrogram
 */

// Sample data: 8 players with positions (defenders, midfielders, forwards)
const clusterData = [
  { name: 'Defender A', x: 30, y: 35, position: 'Defender' },
  { name: 'Defender B', x: 35, y: 30, position: 'Defender' },
  { name: 'Midfielder A', x: 50, y: 50, position: 'Midfielder' },
  { name: 'Midfielder B', x: 55, y: 48, position: 'Midfielder' },
  { name: 'Midfielder C', x: 48, y: 55, position: 'Midfielder' },
  { name: 'Forward A', x: 70, y: 70, position: 'Forward' },
  { name: 'Forward B', x: 75, y: 68, position: 'Forward' },
  { name: 'Forward C', x: 72, y: 75, position: 'Forward' }
];

// Color scheme by position
const positionColors = {
  'Defender': '#3498db',
  'Midfielder': '#2ecc71',
  'Forward': '#e74c3c'
};

// Compute Euclidean distance
function euclideanDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Compute distance matrix
function computeDistanceMatrix(data) {
  const n = data.length;
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = i === j ? 0 : euclideanDistance(data[i], data[j]);
    }
  }
  return matrix;
}

// Hierarchical clustering (complete linkage)
function hierarchicalClustering(data, distanceMatrix) {
  const n = data.length;
  const clusters = data.map((d, i) => ({ indices: [i], distance: 0 }));
  const mergeHistory = [];

  while (clusters.length > 1) {
    let minDist = Infinity;
    let mergeI = -1, mergeJ = -1;

    // Find closest pair of clusters
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        // Complete linkage: max distance between any pair
        let maxDist = 0;
        for (let ii of clusters[i].indices) {
          for (let jj of clusters[j].indices) {
            maxDist = Math.max(maxDist, distanceMatrix[ii][jj]);
          }
        }
        if (maxDist < minDist) {
          minDist = maxDist;
          mergeI = i;
          mergeJ = j;
        }
      }
    }

    // Merge clusters
    const newCluster = {
      indices: [...clusters[mergeI].indices, ...clusters[mergeJ].indices],
      distance: minDist,
      left: clusters[mergeI],
      right: clusters[mergeJ]
    };

    mergeHistory.push(newCluster);

    // Remove old clusters and add new one
    clusters.splice(Math.max(mergeI, mergeJ), 1);
    clusters.splice(Math.min(mergeI, mergeJ), 1);
    clusters.push(newCluster);
  }

  return { root: clusters[0], history: mergeHistory };
}

// ============================================================================
// STEP 1: Raw Points in XY Plane
// ============================================================================
export function initClusterStep1() {
  console.log('🎯 initClusterStep1 called');
  const container = d3.select('#cluster-step1-container');
  if (container.empty()) {
    console.error('❌ cluster-step1-container not found');
    return;
  }
  console.log('✓ cluster-step1-container found, initializing...');

  const width = container.node().offsetWidth;
  const height = 600;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };

  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, plotWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([plotHeight, 0]);

  // Axes
  const xAxis = d3.axisBottom(xScale).ticks(10);
  const yAxis = d3.axisLeft(yScale).ticks(10);

  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${plotHeight})`)
    .call(xAxis);

  g.append('g')
    .attr('class', 'y-axis')
    .call(yAxis);

  // Axis labels
  g.append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + 45)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text('Field Width (yards)');

  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -plotHeight / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .text('Field Length (yards)');

  // Grid
  g.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .call(d3.axisLeft(yScale).tickSize(-plotWidth).tickFormat(''));

  g.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .attr('transform', `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale).tickSize(-plotHeight).tickFormat(''));

  // Tooltip
  const tooltip = container.append('div')
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', 'white')
    .style('padding', '8px 12px')
    .style('border-radius', '4px')
    .style('font-size', '13px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  // Plot points
  const points = g.selectAll('.point')
    .data(clusterData)
    .enter()
    .append('g')
    .attr('class', 'point')
    .attr('transform', d => `translate(${xScale(d.x)},${yScale(d.y)})`);

  // Coordinate lines (hidden by default)
  const coordLines = g.append('g').attr('class', 'coord-lines');

  points.each(function(d) {
    const pointGroup = d3.select(this);

    pointGroup.append('circle')
      .attr('r', 8)
      .attr('fill', positionColors[d.position])
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    pointGroup.append('text')
      .attr('x', 0)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .style('fill', positionColors[d.position])
      .text(d.name);
  });

  // Hover interactions
  points.on('mouseenter', function(event, d) {
    d3.select(this).select('circle')
      .transition().duration(200)
      .attr('r', 12);

    // Draw coordinate lines
    coordLines.append('line')
      .attr('class', 'coord-x')
      .attr('x1', 0)
      .attr('y1', yScale(d.y))
      .attr('x2', xScale(d.x))
      .attr('y2', yScale(d.y))
      .attr('stroke', positionColors[d.position])
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7);

    coordLines.append('line')
      .attr('class', 'coord-y')
      .attr('x1', xScale(d.x))
      .attr('y1', plotHeight)
      .attr('x2', xScale(d.x))
      .attr('y2', yScale(d.y))
      .attr('stroke', positionColors[d.position])
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7);

    tooltip.transition().duration(200).style('opacity', 1);
    tooltip.html(`
      <strong>${d.name}</strong><br/>
      Position: ${d.position}<br/>
      X: ${d.x} yards<br/>
      Y: ${d.y} yards
    `)
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 15) + 'px');
  })
  .on('mouseleave', function() {
    d3.select(this).select('circle')
      .transition().duration(200)
      .attr('r', 8);

    coordLines.selectAll('.coord-x, .coord-y').remove();
    tooltip.transition().duration(200).style('opacity', 0);
  });
}

// ============================================================================
// STEP 2: Coordinate Table
// ============================================================================
export function initClusterStep2() {
  const plotContainer = d3.select('#cluster-step2-plot');
  const tableContainer = d3.select('#cluster-step2-table');

  if (plotContainer.empty() || tableContainer.empty()) return;

  let selectedRows = new Set();

  // ========== PLOT ==========
  const width = 500;
  const height = 500;
  const margin = { top: 30, right: 30, bottom: 50, left: 50 };

  const svg = plotContainer.append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const xScale = d3.scaleLinear().domain([0, 100]).range([0, plotWidth]);
  const yScale = d3.scaleLinear().domain([0, 100]).range([plotHeight, 0]);

  g.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(xScale));
  g.append('g').call(d3.axisLeft(yScale));

  g.append('text')
    .attr('x', plotWidth / 2).attr('y', plotHeight + 40)
    .attr('text-anchor', 'middle').style('font-size', '12px')
    .text('Field Width (yards)');

  g.append('text')
    .attr('transform', 'rotate(-90)').attr('x', -plotHeight / 2).attr('y', -35)
    .attr('text-anchor', 'middle').style('font-size', '12px')
    .text('Field Length (yards)');

  const points = g.selectAll('.point')
    .data(clusterData)
    .enter()
    .append('circle')
    .attr('class', 'point')
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', 8)
    .attr('fill', d => positionColors[d.position])
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .attr('opacity', 0.7);

  // ========== TABLE ==========
  const table = tableContainer.append('table')
    .style('width', '100%')
    .style('border-collapse', 'collapse')
    .style('font-size', '14px');

  const thead = table.append('thead');
  const tbody = table.append('tbody');

  thead.append('tr')
    .selectAll('th')
    .data(['Player', 'Position', 'X (yd)', 'Y (yd)'])
    .enter()
    .append('th')
    .style('background', '#34495e')
    .style('color', 'white')
    .style('padding', '12px')
    .style('text-align', 'left')
    .style('font-weight', 'bold')
    .text(d => d);

  const rows = tbody.selectAll('tr')
    .data(clusterData)
    .enter()
    .append('tr')
    .style('cursor', 'pointer')
    .style('transition', 'all 0.2s')
    .on('mouseenter', function(event, d) {
      if (!selectedRows.has(d.name)) {
        d3.select(this).style('background', '#e8f4f8');
        highlightPoint(d.name, true);
      }
    })
    .on('mouseleave', function(event, d) {
      if (!selectedRows.has(d.name)) {
        d3.select(this).style('background', 'white');
        highlightPoint(d.name, false);
      }
    })
    .on('click', function(event, d) {
      if (selectedRows.has(d.name)) {
        selectedRows.delete(d.name);
        d3.select(this).style('background', 'white');
        highlightPoint(d.name, false);
      } else {
        selectedRows.add(d.name);
        d3.select(this).style('background', '#d5f4e6');
        highlightPoint(d.name, true);
      }
    });

  rows.each(function(d) {
    const row = d3.select(this);

    row.append('td')
      .style('padding', '10px')
      .style('border-bottom', '1px solid #ddd')
      .style('font-weight', 'bold')
      .style('color', positionColors[d.position])
      .text(d.name);

    row.append('td')
      .style('padding', '10px')
      .style('border-bottom', '1px solid #ddd')
      .text(d.position);

    row.append('td')
      .style('padding', '10px')
      .style('border-bottom', '1px solid #ddd')
      .text(d.x);

    row.append('td')
      .style('padding', '10px')
      .style('border-bottom', '1px solid #ddd')
      .text(d.y);
  });

  function highlightPoint(name, highlight) {
    points.filter(d => d.name === name)
      .transition().duration(200)
      .attr('r', highlight ? 12 : 8)
      .attr('opacity', highlight ? 1 : 0.7);
  }
}

// ============================================================================
// STEP 3: Distance Matrix
// ============================================================================
export function initClusterStep3() {
  const plotContainer = d3.select('#cluster-step3-plot');
  const matrixContainer = d3.select('#cluster-step3-matrix');

  if (plotContainer.empty() || matrixContainer.empty()) return;

  const distanceMatrix = computeDistanceMatrix(clusterData);

  // ========== PLOT ==========
  const width = 400;
  const height = 500;
  const margin = { top: 30, right: 30, bottom: 50, left: 50 };

  const svg = plotContainer.append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const xScale = d3.scaleLinear().domain([0, 100]).range([0, plotWidth]);
  const yScale = d3.scaleLinear().domain([0, 100]).range([plotHeight, 0]);

  g.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(xScale));
  g.append('g').call(d3.axisLeft(yScale));

  const points = g.selectAll('.point')
    .data(clusterData)
    .enter()
    .append('circle')
    .attr('class', 'point')
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', 8)
    .attr('fill', d => positionColors[d.position])
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  const lineGroup = g.append('g').attr('class', 'distance-lines');

  // ========== MATRIX ==========
  const maxDist = d3.max(distanceMatrix.flat());
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([maxDist, 0]); // Reversed: darker = closer

  const cellSize = 60;
  const matrixSvg = matrixContainer.append('svg')
    .attr('width', (clusterData.length + 1) * cellSize)
    .attr('height', (clusterData.length + 1) * cellSize);

  // Row labels
  matrixSvg.selectAll('.row-label')
    .data(clusterData)
    .enter()
    .append('text')
    .attr('class', 'row-label')
    .attr('x', 5)
    .attr('y', (d, i) => (i + 1.5) * cellSize)
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .attr('fill', d => positionColors[d.position])
    .text(d => d.name);

  // Column labels
  matrixSvg.selectAll('.col-label')
    .data(clusterData)
    .enter()
    .append('text')
    .attr('class', 'col-label')
    .attr('x', (d, i) => (i + 1.5) * cellSize)
    .attr('y', cellSize - 10)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .attr('fill', d => positionColors[d.position])
    .text(d => d.name);

  // Matrix cells
  for (let i = 0; i < clusterData.length; i++) {
    for (let j = 0; j < clusterData.length; j++) {
      const cell = matrixSvg.append('g')
        .attr('transform', `translate(${(j + 1) * cellSize},${(i + 1) * cellSize})`)
        .style('cursor', i !== j ? 'pointer' : 'default');

      cell.append('rect')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', i === j ? '#ecf0f1' : colorScale(distanceMatrix[i][j]))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      cell.append('text')
        .attr('x', cellSize / 2)
        .attr('y', cellSize / 2 + 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .attr('fill', i === j ? '#95a5a6' : '#2c3e50')
        .text(i === j ? '—' : distanceMatrix[i][j].toFixed(1));

      if (i !== j) {
        cell.on('mouseenter', () => {
          highlightPair(i, j, true);
        })
        .on('mouseleave', () => {
          highlightPair(i, j, false);
        });
      }
    }
  }

  function highlightPair(i, j, highlight) {
    if (highlight) {
      points.filter((d, idx) => idx === i || idx === j)
        .transition().duration(200)
        .attr('r', 12);

      lineGroup.append('line')
        .attr('class', 'distance-line')
        .attr('x1', xScale(clusterData[i].x))
        .attr('y1', yScale(clusterData[i].y))
        .attr('x2', xScale(clusterData[j].x))
        .attr('y2', yScale(clusterData[j].y))
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0)
        .transition().duration(200)
        .attr('opacity', 0.8);
    } else {
      points.transition().duration(200).attr('r', 8);
      lineGroup.selectAll('.distance-line').remove();
    }
  }
}

// ============================================================================
// STEP 4: Hierarchical Clusters with Ellipsoids
// ============================================================================
export function initClusterStep4() {
  const container = d3.select('#cluster-step4-container');
  if (container.empty()) return;

  const width = container.node().offsetWidth;
  const height = 600;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };

  const distanceMatrix = computeDistanceMatrix(clusterData);
  const { history } = hierarchicalClustering(clusterData, distanceMatrix);

  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const xScale = d3.scaleLinear().domain([0, 100]).range([0, plotWidth]);
  const yScale = d3.scaleLinear().domain([0, 100]).range([plotHeight, 0]);

  g.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(xScale));
  g.append('g').call(d3.axisLeft(yScale));

  g.append('text')
    .attr('x', plotWidth / 2).attr('y', plotHeight + 45)
    .attr('text-anchor', 'middle').style('font-size', '14px').style('font-weight', 'bold')
    .text('Field Width (yards)');

  g.append('text')
    .attr('transform', 'rotate(-90)').attr('x', -plotHeight / 2).attr('y', -45)
    .attr('text-anchor', 'middle').style('font-size', '14px').style('font-weight', 'bold')
    .text('Field Length (yards)');

  const ellipsoidGroup = g.append('g').attr('class', 'ellipsoids');

  // Draw ellipsoids for each merge level
  history.forEach((cluster, level) => {
    const points = cluster.indices.map(i => clusterData[i]);
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    const cx = d3.mean(xs);
    const cy = d3.mean(ys);
    const rx = (d3.max(xs) - d3.min(xs)) / 2 + 10;
    const ry = (d3.max(ys) - d3.min(ys)) / 2 + 10;

    const color = d3.interpolateViridis(level / history.length);

    ellipsoidGroup.append('ellipse')
      .attr('cx', xScale(cx))
      .attr('cy', yScale(cy))
      .attr('rx', xScale(rx) - xScale(0))
      .attr('ry', yScale(0) - yScale(ry))
      .attr('fill', color)
      .attr('opacity', 0.15)
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .style('cursor', 'pointer')
      .on('mouseenter', function() {
        d3.select(this).attr('opacity', 0.4).attr('stroke-width', 3);
        highlightCluster(cluster.indices, true);
      })
      .on('mouseleave', function() {
        d3.select(this).attr('opacity', 0.15).attr('stroke-width', 2);
        highlightCluster(cluster.indices, false);
      });
  });

  const points = g.selectAll('.point')
    .data(clusterData)
    .enter()
    .append('circle')
    .attr('class', 'point')
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', 8)
    .attr('fill', d => positionColors[d.position])
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  g.selectAll('.label')
    .data(clusterData)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => xScale(d.x))
    .attr('y', d => yScale(d.y) - 15)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .style('fill', d => positionColors[d.position])
    .text(d => d.name);

  function highlightCluster(indices, highlight) {
    points.filter((d, i) => indices.includes(i))
      .transition().duration(200)
      .attr('r', highlight ? 12 : 8)
      .attr('stroke-width', highlight ? 3 : 2);
  }
}

// ============================================================================
// STEP 5: Dendrogram + Clusters
// ============================================================================
export function initClusterStep5() {
  const plotContainer = d3.select('#cluster-step5-plot');
  const dendrogramContainer = d3.select('#cluster-step5-dendrogram');

  if (plotContainer.empty() || dendrogramContainer.empty()) return;

  const distanceMatrix = computeDistanceMatrix(clusterData);
  const { root } = hierarchicalClustering(clusterData, distanceMatrix);

  // ========== PLOT ==========
  const width = 500;
  const height = 550;
  const margin = { top: 30, right: 30, bottom: 50, left: 50 };

  const svg = plotContainer.append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const xScale = d3.scaleLinear().domain([0, 100]).range([0, plotWidth]);
  const yScale = d3.scaleLinear().domain([0, 100]).range([plotHeight, 0]);

  g.append('g').attr('transform', `translate(0,${plotHeight})`).call(d3.axisBottom(xScale));
  g.append('g').call(d3.axisLeft(yScale));

  const clusterGroup = g.append('g').attr('class', 'clusters');

  const points = g.selectAll('.point')
    .data(clusterData)
    .enter()
    .append('circle')
    .attr('class', 'point')
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', 8)
    .attr('fill', d => positionColors[d.position])
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  // ========== DENDROGRAM ==========
  const dendWidth = 500;
  const dendHeight = 550;
  const dendMargin = { top: 30, right: 100, bottom: 30, left: 100 };

  const dendSvg = dendrogramContainer.append('svg')
    .attr('width', dendWidth)
    .attr('height', dendHeight);

  const dendG = dendSvg.append('g')
    .attr('transform', `translate(${dendMargin.left},${dendMargin.top})`);

  const dendPlotWidth = dendWidth - dendMargin.left - dendMargin.right;
  const dendPlotHeight = dendHeight - dendMargin.top - dendMargin.bottom;

  // Convert to D3 hierarchy
  function clusterToHierarchy(cluster) {
    if (!cluster.left) {
      return {
        name: clusterData[cluster.indices[0]].name,
        value: cluster.distance,
        indices: cluster.indices
      };
    }
    return {
      name: `Cluster ${cluster.indices.length}`,
      value: cluster.distance,
      indices: cluster.indices,
      children: [
        clusterToHierarchy(cluster.left),
        clusterToHierarchy(cluster.right)
      ]
    };
  }

  const hierarchy = d3.hierarchy(clusterToHierarchy(root));
  const cluster = d3.cluster().size([dendPlotHeight, dendPlotWidth]);
  cluster(hierarchy);

  // Draw links
  dendG.selectAll('.link')
    .data(hierarchy.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d => {
      return `M${d.source.y},${d.source.x}
              L${d.source.y},${d.target.x}
              L${d.target.y},${d.target.x}`;
    })
    .attr('fill', 'none')
    .attr('stroke', '#7f8c8d')
    .attr('stroke-width', 2);

  // Draw nodes
  const nodes = dendG.selectAll('.node')
    .data(hierarchy.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.y},${d.x})`)
    .style('cursor', 'pointer');

  nodes.append('circle')
    .attr('r', d => d.children ? 6 : 8)
    .attr('fill', d => {
      if (!d.children && d.data.indices) {
        return positionColors[clusterData[d.data.indices[0]].position];
      }
      return '#34495e';
    })
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  nodes.append('text')
    .attr('x', d => d.children ? -10 : 10)
    .attr('y', 4)
    .attr('text-anchor', d => d.children ? 'end' : 'start')
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .text(d => d.data.name);

  // Hover interactions
  nodes.on('mouseenter', function(event, d) {
    d3.select(this).select('circle')
      .transition().duration(200)
      .attr('r', d.children ? 10 : 12);

    if (d.data.indices) {
      highlightClusterOnPlot(d.data.indices, true);
    }
  })
  .on('mouseleave', function(event, d) {
    d3.select(this).select('circle')
      .transition().duration(200)
      .attr('r', d.children ? 6 : 8);

    if (d.data.indices) {
      highlightClusterOnPlot(d.data.indices, false);
    }
  });

  function highlightClusterOnPlot(indices, highlight) {
    // Clear previous hulls
    clusterGroup.selectAll('.hull').remove();

    if (highlight) {
      const hullPoints = indices.map(i => [xScale(clusterData[i].x), yScale(clusterData[i].y)]);

      if (hullPoints.length > 2) {
        const hull = d3.polygonHull(hullPoints);
        if (hull) {
          clusterGroup.append('path')
            .attr('class', 'hull')
            .attr('d', `M${hull.join('L')}Z`)
            .attr('fill', '#3498db')
            .attr('opacity', 0.2)
            .attr('stroke', '#3498db')
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', '5,5');
        }
      }

      points.filter((d, i) => indices.includes(i))
        .transition().duration(200)
        .attr('r', 12)
        .attr('stroke-width', 3);
    } else {
      points.transition().duration(200)
        .attr('r', 8)
        .attr('stroke-width', 2);
    }
  }
}
