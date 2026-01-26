/**
 * Formation Hamming Distance Heatmap with Interactive Hierarchical Clustering Dendrogram
 */

export async function initFormationHeatmap(containerId, options = {}) {
  const {
    dataFile = 'data/formations/formation-hamming-distance.csv',
    title = 'Formation Hamming Distance',
    colorScheme = 'Blues'
  } = options;

  console.log(`[Formation Heatmap] Initializing ${containerId} with ${dataFile}`);

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[Formation Heatmap] Container ${containerId} not found`);
    return;
  }

  // Clear container first
  container.innerHTML = '';

  // Get container dimensions dynamically
  const width = container.offsetWidth || container.clientWidth || 1400;
  const height = container.offsetHeight || container.clientHeight || 700;

  console.log(`[Formation Heatmap] Container dimensions: ${width}x${height}`);

  // Load data
  try {
    const response = await fetch(dataFile);
    if (!response.ok) {
      console.error(`[Formation Heatmap] Failed to fetch ${dataFile}: ${response.status}`);
      container.innerHTML = `<div style="padding: 20px; color: red;">Failed to load data: ${response.status}</div>`;
      return;
    }
    const csvText = await response.text();
    console.log(`[Formation Heatmap] Data loaded, ${csvText.length} characters`);

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const teams = headers.slice(1); // Skip 'Team' column

    const distanceMatrix = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = values.slice(1).map(Number);
      distanceMatrix.push(row);
    }

    // Hierarchical clustering with dendrogram structure
    const clusterResult = performClusteringWithDendrogram(distanceMatrix, teams);
    const { order: clusterOrder, dendrogram } = clusterResult;

    // Reorder matrix based on clustering
    const orderedMatrix = [];
    const orderedTeams = [];
    for (let i of clusterOrder) {
      orderedTeams.push(teams[i]);
      const row = [];
      for (let j of clusterOrder) {
        row.push(distanceMatrix[i][j]);
      }
      orderedMatrix.push(row);
    }

    // Find max distance for color scale
    const maxDistance = Math.max(...orderedMatrix.flat());

    // Layout parameters
    const legendWidth = 20;
    const legendLabelSpace = 45;

    // Margins with more space for rotated labels and tooltips
    const margin = {
      top: 40,
      right: legendWidth + legendLabelSpace + 15,
      bottom: 150,
      left: 150
    };

    // Calculate cell size
    const availableWidth = width - margin.left - margin.right;
    const availableHeight = height - margin.top - margin.bottom;

    const cellSize = Math.min(
      availableWidth / orderedTeams.length,
      availableHeight / orderedTeams.length
    );

    const heatmapWidth = cellSize * orderedTeams.length;
    const heatmapHeight = cellSize * orderedTeams.length;

    console.log(`[Formation Heatmap] Available: ${availableWidth.toFixed(0)}x${availableHeight.toFixed(0)}, Cell: ${cellSize.toFixed(1)}px, Heatmap: ${heatmapWidth.toFixed(0)}x${heatmapHeight.toFixed(0)}`);

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Heatmap group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale - use Blues for Formation
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxDistance]);

    // Draw cells with class for selection
    orderedMatrix.forEach((row, i) => {
      row.forEach((value, j) => {
        const cell = g.append('rect')
          .attr('class', `cell cell-row-${i} cell-col-${j}`)
          .attr('x', j * cellSize)
          .attr('y', i * cellSize)
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('fill', colorScale(value))
          .attr('stroke', 'white')
          .attr('stroke-width', 0.5);

        cell.append('title')
          .text(`${orderedTeams[i]} vs ${orderedTeams[j]}: ${value.toFixed(1)}`);
      });
    });

    // Function to highlight cluster
    function highlightCluster(originalIndices) {
      if (!originalIndices) {
        // Reset all
        g.selectAll('.cell')
          .attr('stroke', 'white')
          .attr('stroke-width', 0.5)
          .attr('opacity', 1);
        g.selectAll('.x-label text')
          .style('fill', '#000')
          .style('font-weight', '500');
        g.selectAll('.y-label text')
          .style('fill', '#000')
          .style('font-weight', '500');
        return;
      }

      // Map original indices to reordered positions
      const reorderedIndices = originalIndices.map(origIdx => clusterOrder.indexOf(origIdx));

      // Dim all cells
      g.selectAll('.cell').attr('opacity', 0.2);

      // Dim all labels
      g.selectAll('.x-label text')
        .style('fill', '#999')
        .style('font-weight', '500');
      g.selectAll('.y-label text')
        .style('fill', '#999')
        .style('font-weight', '500');

      // Highlight selected cluster cells and labels
      reorderedIndices.forEach(i => {
        // Highlight labels
        g.select(`.x-label-${i}`).selectAll('text')
          .style('fill', '#1e40af')
          .style('font-weight', 'bold');
        g.select(`.y-label-${i}`).selectAll('text')
          .style('fill', '#1e40af')
          .style('font-weight', 'bold');

        // Highlight cells
        reorderedIndices.forEach(j => {
          g.select(`.cell-row-${i}.cell-col-${j}`)
            .attr('opacity', 1)
            .attr('stroke', '#1e40af')
            .attr('stroke-width', 2);
        });
      });
    }

    // X-axis labels - team names at 45 degrees
    orderedTeams.forEach((team, i) => {
      const labelGroup = g.append('g')
        .attr('class', `x-label x-label-${i}`)
        .attr('transform', `translate(${(i + 0.5) * cellSize}, ${heatmapHeight + 10}) rotate(45)`);

      labelGroup.append('text')
        .attr('text-anchor', 'start')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .text(team);
    });

    // Y-axis labels - team names at 45 degrees
    orderedTeams.forEach((team, i) => {
      const labelGroup = g.append('g')
        .attr('class', `y-label y-label-${i}`)
        .attr('transform', `translate(-10, ${(i + 0.5) * cellSize}) rotate(-45)`);

      labelGroup.append('text')
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '500')
        .text(team);
    });

    // Draw dendrogram in the designated container (in the left column)
    const dendrogramContainer = document.getElementById(`${containerId}-dendrogram`);
    if (dendrogramContainer) {
      const dendroWidth = dendrogramContainer.offsetWidth || 400;
      const dendroHeight = dendrogramContainer.offsetHeight || 150;

      const dendroSvg = d3.select(dendrogramContainer)
        .append('svg')
        .attr('width', dendroWidth)
        .attr('height', dendroHeight);

      const dendroG = dendroSvg.append('g')
        .attr('transform', `translate(40, 20)`);

      drawDendrogram(dendroG, dendrogram, dendroWidth - 80, dendroHeight - 40, 'vertical',
                     clusterOrder, highlightCluster);
    }

    // Title - moved below heatmap with extra space for tooltips
    svg.append('text')
      .attr('x', margin.left + heatmapWidth / 2)
      .attr('y', margin.top + heatmapHeight + 130)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(title);

    // Legend - positioned to the right of heatmap
    const legendHeight = heatmapHeight;
    const legendX = margin.left + heatmapWidth + 20;
    const legendY = margin.top;

    const legendScale = d3.scaleLinear()
      .domain([maxDistance, 0])  // Reversed for vertical
      .range([0, legendHeight]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(6)
      .tickFormat(d => d.toFixed(0));

    const defs = svg.append('defs');
    const gradientId = `legend-gradient-${containerId}`;
    const linearGradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');

    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      linearGradient.append('stop')
        .attr('offset', `${(i / numStops) * 100}%`)
        .attr('stop-color', colorScale(maxDistance - (i / numStops) * maxDistance));
    }

    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', `url(#${gradientId})`)
      .attr('stroke', '#999')
      .attr('stroke-width', 1);

    svg.append('g')
      .attr('transform', `translate(${legendX + legendWidth},${legendY})`)
      .call(legendAxis);

    svg.append('text')
      .attr('x', legendX + legendWidth + 50)
      .attr('y', legendY - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text('Distance');

    // Instructions - moved below heatmap
    svg.append('text')
      .attr('x', margin.left + heatmapWidth / 2)
      .attr('y', margin.top + heatmapHeight + 145)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('Click dendrogram branches to highlight team clusters');

    // Add click-to-reset on background
    svg.on('click', function(event) {
      if (event.target.tagName === 'svg') {
        highlightCluster(null);
      }
    });

    console.log(`[Formation Heatmap] Visualization complete for ${containerId}`);
  } catch (error) {
    console.error(`[Formation Heatmap] Error:`, error);
    container.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
  }
}

/**
 * Hierarchical clustering with full dendrogram structure
 * Returns both the final ordering and the tree structure
 */
function performClusteringWithDendrogram(distanceMatrix, teams) {
  const n = teams.length;

  // Initialize clusters - each is a node in the tree
  let clusters = teams.map((_, i) => ({
    indices: [i],
    left: null,
    right: null,
    distance: 0,
    id: i
  }));

  const distances = distanceMatrix.map(row => [...row]);
  let nextId = n; // For internal nodes

  while (clusters.length > 1) {
    // Find closest pair of clusters
    let minDist = Infinity;
    let minI = -1, minJ = -1;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        // Single linkage: minimum distance between any pair
        let dist = Infinity;
        for (let ci of clusters[i].indices) {
          for (let cj of clusters[j].indices) {
            dist = Math.min(dist, distances[ci][cj]);
          }
        }
        if (dist < minDist) {
          minDist = dist;
          minI = i;
          minJ = j;
        }
      }
    }

    // Merge clusters
    if (minI !== -1 && minJ !== -1) {
      const newCluster = {
        indices: clusters[minI].indices.concat(clusters[minJ].indices),
        left: clusters[minI],
        right: clusters[minJ],
        distance: minDist,
        id: nextId++
      };

      // Remove old clusters and add new one
      clusters = clusters.filter((_, idx) => idx !== minI && idx !== minJ);
      clusters.push(newCluster);
    } else {
      break;
    }
  }

  // Extract order from dendrogram via in-order traversal
  const root = clusters[0];
  const order = [];

  function inOrderTraversal(node) {
    if (node.left === null && node.right === null) {
      // Leaf node
      order.push(node.indices[0]);
    } else {
      if (node.left) inOrderTraversal(node.left);
      if (node.right) inOrderTraversal(node.right);
    }
  }

  inOrderTraversal(root);

  return { order, dendrogram: root };
}

/**
 * Get maximum distance in dendrogram
 */
function getMaxDistance(node) {
  if (node.left === null && node.right === null) {
    return node.distance;
  }
  return Math.max(
    node.distance,
    node.left ? getMaxDistance(node.left) : 0,
    node.right ? getMaxDistance(node.right) : 0
  );
}

/**
 * Draw dendrogram visualization
 */
function drawDendrogram(g, dendrogram, width, height, orientation, clusterOrder, highlightCallback) {
  const numLeaves = dendrogram.indices.length;
  const maxDist = dendrogram.distance;

  function drawNode(node, depth = 0) {
    if (!node.left && !node.right) {
      const leafIdx = clusterOrder.indexOf(node.indices[0]);
      const pos = orientation === 'vertical'
        ? (leafIdx / (numLeaves - 1)) * width
        : (leafIdx / (numLeaves - 1)) * height;
      return { pos, dist: 0 };
    }

    const leftResult = drawNode(node.left, depth + 1);
    const rightResult = drawNode(node.right, depth + 1);

    const pos = (leftResult.pos + rightResult.pos) / 2;
    const dist = (node.distance / maxDist) * (orientation === 'vertical' ? height : width);

    const g2 = g.append('g')
      .attr('class', 'dendrogram-branch')
      .style('cursor', 'pointer')
      .on('click', function(event) {
        event.stopPropagation();
        highlightCallback(node.indices);
      });

    if (orientation === 'vertical') {
      // Vertical dendrogram
      g2.append('line')
        .attr('x1', leftResult.pos)
        .attr('y1', leftResult.dist)
        .attr('x2', leftResult.pos)
        .attr('y2', dist)
        .attr('stroke', '#666')
        .attr('stroke-width', 1.5);

      g2.append('line')
        .attr('x1', rightResult.pos)
        .attr('y1', rightResult.dist)
        .attr('x2', rightResult.pos)
        .attr('y2', dist)
        .attr('stroke', '#666')
        .attr('stroke-width', 1.5);

      g2.append('line')
        .attr('x1', leftResult.pos)
        .attr('y1', dist)
        .attr('x2', rightResult.pos)
        .attr('y2', dist)
        .attr('stroke', '#666')
        .attr('stroke-width', 1.5);

      // Clickable area
      g2.append('rect')
        .attr('x', Math.min(leftResult.pos, rightResult.pos) - 3)
        .attr('y', Math.min(leftResult.dist, rightResult.dist))
        .attr('width', Math.abs(rightResult.pos - leftResult.pos) + 6)
        .attr('height', dist - Math.min(leftResult.dist, rightResult.dist) + 1)
        .attr('fill', 'transparent');
    }

    g2.append('title')
      .text(`Cluster of ${node.indices.length} teams\nDistance: ${node.distance.toFixed(1)}\nClick to highlight`);

    return { pos, dist };
  }

  drawNode(dendrogram);
}
