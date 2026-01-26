/**
 * Jaccard Similarity Heatmap with Interactive Hierarchical Clustering Dendrogram
 * Jaccard similarity: |A ∩ B| / |A ∪ B| for player transfer sets
 */

export async function initJaccardHeatmap(containerId, options = {}) {
  const {
    dataFile = 'data/jaccard-matrix.csv',
    title = 'Jaccard Similarity',
    colorScheme = 'Oranges'
  } = options;

  console.log(`[Jaccard Heatmap] Initializing ${containerId} with ${dataFile}`);

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[Jaccard Heatmap] Container ${containerId} not found`);
    return;
  }

  // Clear container first
  container.innerHTML = '';

  // Get container dimensions dynamically
  const width = container.offsetWidth || container.clientWidth || 1400;
  const height = container.offsetHeight || container.clientHeight || 700;

  console.log(`[Jaccard Heatmap] Container dimensions: ${width}x${height}`);

  // Load data
  try {
    const response = await fetch(dataFile);
    if (!response.ok) {
      console.error(`[Jaccard Heatmap] Failed to fetch ${dataFile}: ${response.status}`);
      container.innerHTML = `<div style="padding: 20px; color: red;">Failed to load data: ${response.status}</div>`;
      return;
    }
    const csvText = await response.text();
    console.log(`[Jaccard Heatmap] Data loaded, ${csvText.length} characters`);

    // Parse CSV
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const clubs = headers.slice(1); // Skip 'club' column

    const similarityMatrix = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = values.slice(1).map(Number);
      similarityMatrix.push(row);
    }

    // Hierarchical clustering with dendrogram structure
    const clusterResult = performClusteringWithDendrogram(similarityMatrix, clubs);
    const { order: clusterOrder, dendrogram } = clusterResult;

    // Reorder matrix based on clustering
    const orderedMatrix = [];
    const orderedClubs = [];
    for (let i of clusterOrder) {
      orderedClubs.push(clubs[i]);
      const row = [];
      for (let j of clusterOrder) {
        row.push(similarityMatrix[i][j]);
      }
      orderedMatrix.push(row);
    }

    // Find max similarity for color scale (excluding diagonal)
    const maxSimilarity = Math.max(...orderedMatrix.flat().filter((v, idx) => {
      const i = Math.floor(idx / orderedClubs.length);
      const j = idx % orderedClubs.length;
      return i !== j;
    }));

    // Use a focused scale (0-10% instead of 0-100%) to show meaningful variation
    const scaleMax = Math.min(0.10, maxSimilarity * 1.2);  // Cap at 10% or 120% of max

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
      availableWidth / orderedClubs.length,
      availableHeight / orderedClubs.length
    );

    const heatmapWidth = cellSize * orderedClubs.length;
    const heatmapHeight = cellSize * orderedClubs.length;

    console.log(`[Jaccard Heatmap] Available: ${availableWidth.toFixed(0)}x${availableHeight.toFixed(0)}, Cell: ${cellSize.toFixed(1)}px, Heatmap: ${heatmapWidth.toFixed(0)}x${heatmapHeight.toFixed(0)}`);

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Heatmap group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale - use Oranges for Jaccard with focused range
    const colorScale = d3.scaleSequential(d3.interpolateOranges)
      .domain([0, scaleMax]);

    // Draw heatmap cells
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
          .text(`${orderedClubs[i]} vs ${orderedClubs[j]}: ${(value * 100).toFixed(1)}% similarity`);
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
          .style('fill', '#d95f0e')
          .style('font-weight', 'bold');
        g.select(`.y-label-${i}`).selectAll('text')
          .style('fill', '#d95f0e')
          .style('font-weight', 'bold');

        // Highlight cells
        reorderedIndices.forEach(j => {
          g.select(`.cell-row-${i}.cell-col-${j}`)
            .attr('opacity', 1)
            .attr('stroke', '#d95f0e')
            .attr('stroke-width', 2);
        });
      });
    }

    // X-axis labels - club names only at 45 degrees
    orderedClubs.forEach((club, i) => {
      const labelGroup = g.append('g')
        .attr('class', `x-label x-label-${i}`)
        .attr('transform', `translate(${(i + 0.5) * cellSize}, ${heatmapHeight + 10}) rotate(45)`);

      labelGroup.append('text')
        .attr('text-anchor', 'start')
        .style('font-size', '16px')
        .style('font-weight', '500')
        .text(club);
    });

    // Y-axis labels - club names at 45 degrees
    orderedClubs.forEach((club, i) => {
      const labelGroup = g.append('g')
        .attr('class', `y-label y-label-${i}`)
        .attr('transform', `translate(-10, ${(i + 0.5) * cellSize}) rotate(-45)`);

      labelGroup.append('text')
        .attr('text-anchor', 'end')
        .attr('alignment-baseline', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '500')
        .text(club);
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
      .domain([scaleMax, 0])  // Reversed for vertical
      .range([0, legendHeight]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(6)
      .tickFormat(d => (d * 100).toFixed(1) + '%');

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
        .attr('stop-color', colorScale(scaleMax - (i / numStops) * scaleMax));
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
      .text('Similarity');

    // Instructions - moved below heatmap
    svg.append('text')
      .attr('x', margin.left + heatmapWidth / 2)
      .attr('y', margin.top + heatmapHeight + 145)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('Click dendrogram branches to highlight club clusters');

    // Add click-to-reset on background
    svg.on('click', function(event) {
      if (event.target.tagName === 'svg') {
        highlightCluster(null);
      }
    });

    console.log(`[Jaccard Heatmap] Visualization complete for ${containerId}`);
  } catch (error) {
    console.error(`[Jaccard Heatmap] Error:`, error);
    container.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
  }
}

/**
 * Hierarchical clustering with full dendrogram structure
 * Note: For similarity matrices, we convert to distance (1 - similarity)
 */
function performClusteringWithDendrogram(similarityMatrix, labels) {
  // Convert similarity to distance
  const distanceMatrix = similarityMatrix.map(row =>
    row.map(sim => 1 - sim)
  );

  const n = labels.length;
  const clusters = labels.map((label, i) => ({ indices: [i], distance: 0 }));

  while (clusters.length > 1) {
    let minDist = Infinity;
    let minPair = null;

    // Find closest pair
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const dist = calculateClusterDistance(clusters[i], clusters[j], distanceMatrix);
        if (dist < minDist) {
          minDist = dist;
          minPair = [i, j];
        }
      }
    }

    if (!minPair) break;

    const [i, j] = minPair;
    const newCluster = {
      indices: [...clusters[i].indices, ...clusters[j].indices],
      distance: minDist,
      left: clusters[i],
      right: clusters[j]
    };

    clusters.splice(Math.max(i, j), 1);
    clusters.splice(Math.min(i, j), 1);
    clusters.push(newCluster);
  }

  const dendrogram = clusters[0];
  const order = extractOrder(dendrogram);

  return { order, dendrogram };
}

function calculateClusterDistance(cluster1, cluster2, distanceMatrix) {
  let sum = 0;
  let count = 0;
  for (let i of cluster1.indices) {
    for (let j of cluster2.indices) {
      sum += distanceMatrix[i][j];
      count++;
    }
  }
  return sum / count;
}

function extractOrder(node, order = []) {
  if (!node.left && !node.right) {
    order.push(node.indices[0]);
  } else {
    if (node.left) extractOrder(node.left, order);
    if (node.right) extractOrder(node.right, order);
  }
  return order;
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
      .text(`Cluster of ${node.indices.length} clubs\nSimilarity: ${((1 - node.distance) * 100).toFixed(1)}%\nClick to highlight`);

    return { pos, dist };
  }

  drawNode(dendrogram);
}
