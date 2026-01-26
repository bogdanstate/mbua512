/**
 * Formation Network Graph Visualization
 * Shows European Big 5 leagues clubs connected by formation similarity
 */

export async function initFormationNetwork(containerId, options = {}) {
  const {
    dataFile = 'data/formations/formation-network.json',
    width = 1200,
    height = 800,
    minEdgeWeight = 0.30,
    maxEdgeWeight = 0.95
  } = options;

  console.log(`[Formation Network] Initializing ${containerId} with ${dataFile}`);

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[Formation Network] Container ${containerId} not found`);
    return;
  }

  // Load network data
  try {
    const response = await fetch(dataFile);
    if (!response.ok) {
      console.error(`[Formation Network] Failed to fetch ${dataFile}: ${response.status}`);
      container.innerHTML = `<div style="padding: 20px; color: red;">Failed to load data: ${response.status}</div>`;
      return;
    }
    const data = await response.json();
    console.log(`[Formation Network] Loaded ${data.nodes.length} nodes, ${data.edges.length} edges`);

    let currentThreshold = minEdgeWeight;

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', '#f8f9fa');

  const g = svg.append('g');

  // Add zoom
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // League colors
  const leagueColors = {
    'Premier League': '#3b1053',
    'La Liga': '#ee8707',
    'Serie A': '#008fd7',
    'Bundesliga': '#d20515',
    'Ligue 1': '#dae025'
  };

  // Create links and nodes groups
  const linkGroup = g.append('g').attr('class', 'links');
  const nodeGroup = g.append('g').attr('class', 'nodes');

  // Force simulation with boundary constraints
  const nodeRadius = 8;
  const padding = 20;

  const simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30))
    .force('boundary', () => {
      // Keep nodes within canvas bounds
      data.nodes.forEach(node => {
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });
    });

  // Stats display
  const statsDiv = d3.select(container)
    .insert('div', 'svg')
    .style('margin-bottom', '10px')
    .style('padding', '10px')
    .style('background', '#fff')
    .style('border-radius', '4px')
    .style('font-size', '14px');

  // Slider control
  const sliderDiv = d3.select(container)
    .insert('div', 'svg')
    .style('margin-bottom', '15px')
    .style('padding', '10px')
    .style('background', '#fff')
    .style('border-radius', '4px');

  const label = sliderDiv.append('label')
    .style('margin-right', '10px')
    .style('font-size', '14px')
    .text('Minimum formation similarity: ');

  const valueSpan = sliderDiv.append('span')
    .style('font-weight', 'bold')
    .text(currentThreshold.toFixed(2));

  sliderDiv.append('br');

  const slider = sliderDiv.append('input')
    .attr('type', 'range')
    .attr('min', Math.floor(minEdgeWeight * 100))
    .attr('max', Math.floor(maxEdgeWeight * 100))
    .attr('value', Math.floor(currentThreshold * 100))
    .attr('step', 1)
    .style('width', '400px')
    .style('margin-top', '5px')
    .on('input', function() {
      currentThreshold = +this.value / 100;
      valueSpan.text(currentThreshold.toFixed(2));
      updateGraph();
    });

  // Component detection (Union-Find)
  class UnionFind {
    constructor(elements) {
      this.parent = new Map();
      this.rank = new Map();
      elements.forEach(e => {
        this.parent.set(e, e);
        this.rank.set(e, 0);
      });
    }

    find(x) {
      if (this.parent.get(x) !== x) {
        this.parent.set(x, this.find(this.parent.get(x)));
      }
      return this.parent.get(x);
    }

    union(x, y) {
      const rootX = this.find(x);
      const rootY = this.find(y);

      if (rootX === rootY) return;

      if (this.rank.get(rootX) < this.rank.get(rootY)) {
        this.parent.set(rootX, rootY);
      } else if (this.rank.get(rootX) > this.rank.get(rootY)) {
        this.parent.set(rootY, rootX);
      } else {
        this.parent.set(rootY, rootX);
        this.rank.set(rootX, this.rank.get(rootX) + 1);
      }
    }

    getComponents() {
      const components = new Map();
      this.parent.forEach((_, node) => {
        const root = this.find(node);
        if (!components.has(root)) {
          components.set(root, []);
        }
        components.get(root).push(node);
      });
      return Array.from(components.values());
    }
  }

  // Component colors (persistent)
  const componentColorScheme = d3.schemeCategory10;
  let componentColors = new Map();
  let colorIndex = 0;

  function updateGraph() {
    // Filter edges by threshold
    const filteredEdges = data.edges.filter(e => e.weight >= currentThreshold);

    // Detect components
    const uf = new UnionFind(data.nodes.map(n => n.id));
    filteredEdges.forEach(e => uf.union(e.source.id || e.source, e.target.id || e.target));
    const components = uf.getComponents();

    // Assign component colors (persistent coloring)
    components.forEach(component => {
      const componentId = component.sort().join(',');
      if (!componentColors.has(componentId)) {
        componentColors.set(componentId, componentColorScheme[colorIndex % componentColorScheme.length]);
        colorIndex++;
      }
    });

    // Map nodes to component colors
    const nodeComponentColors = new Map();
    components.forEach(component => {
      const componentId = component.sort().join(',');
      const color = componentColors.get(componentId);
      component.forEach(nodeId => nodeComponentColors.set(nodeId, color));
    });

    // Update links
    const link = linkGroup.selectAll('line')
      .data(filteredEdges, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

    link.exit().remove();

    const linkEnter = link.enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', d => Math.sqrt(d.weight * 10));

    const linkMerge = linkEnter.merge(link);

    // Update nodes
    const node = nodeGroup.selectAll('g')
      .data(data.nodes, d => d.id);

    node.exit().remove();

    const nodeEnter = node.enter().append('g')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));

    nodeEnter.append('circle')
      .attr('r', 8)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    nodeEnter.append('text')
      .attr('dx', 12)
      .attr('dy', 4)
      .style('font-size', '10px')
      .style('pointer-events', 'none')
      .text(d => d.id);

    nodeEnter.append('title');

    const nodeMerge = nodeEnter.merge(node);

    nodeMerge.select('circle')
      .attr('fill', d => {
        const componentColor = nodeComponentColors.get(d.id);
        return componentColor || leagueColors[d.league] || '#999';
      })
      .attr('opacity', d => nodeComponentColors.has(d.id) ? 1 : 0.3);

    nodeMerge.select('title')
      .text(d => `${d.id}\n${d.league}\nFormation: ${d.formation}`);

    // Update simulation
    simulation.nodes(data.nodes);
    simulation.force('link').links(filteredEdges);
    simulation.alpha(0.3).restart();

    simulation.on('tick', () => {
      linkMerge
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeMerge.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Update stats
    statsDiv.html(`
      <strong>Network Statistics:</strong>
      Nodes: ${data.nodes.length} |
      Edges: ${filteredEdges.length} |
      Components: ${components.length} |
      Avg Degree: ${(filteredEdges.length * 2 / data.nodes.length).toFixed(1)}
    `);
  }

  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Initial render
  updateGraph();
  console.log(`[Formation Network] Visualization complete for ${containerId}`);
  } catch (error) {
    console.error(`[Formation Network] Error:`, error);
    container.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
  }
}
