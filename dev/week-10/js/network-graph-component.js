/**
 * Reusable Network Graph Visualization Component
 * Force-directed graph with dynamic threshold control
 * Based on the Hamming network implementation
 */

export async function initNetworkGraphComponent(containerId, config) {
  const {
    dataFile,
    width = 1200,
    height = 800,
    sliderLabel = 'Minimum similarity:',
    sliderMin = 0,
    sliderMax = 100,
    sliderStep = 1,
    sliderInitialValue = 0,
    getThresholdFromSlider = (val) => val / 100, // Default: slider value / 100
    formatThresholdDisplay = (val) => val.toFixed(2), // Default: 2 decimal places
    filterEdges = (edges, threshold) => edges.filter(e => e.weight >= threshold), // Default filter
    getEdgeStrokeWidth = (edge) => Math.sqrt((edge.weight - sliderMin/100) / (sliderMax/100 - sliderMin/100) * 9 + 1), // Scale to 1-10 range
    getEdgeTooltip = (edge) => `${edge.source} ↔ ${edge.target}: ${edge.weight.toFixed(2)}`,
    getStatsText = (nodes, edges, components) => {
      const connectedComponents = Array.from(components.values()).filter(comp => comp.length > 1).length;
      const isolatedNodes = Array.from(components.values()).filter(comp => comp.length === 1).length;

      let statsText = `${nodes.length} nodes, ${edges.length} connections`;
      if (connectedComponents > 0) {
        statsText += `, ${connectedComponents} component${connectedComponents !== 1 ? 's' : ''}`;
      }
      if (isolatedNodes > 0) {
        statsText += `, ${isolatedNodes} isolated`;
      }
      return statsText;
    }
  } = config;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  container.innerHTML = '<div style="text-align: center; padding: 50px; color: #ddd;"><p>Loading network...</p></div>';

  try {
    const response = await fetch(dataFile);
    const data = await response.json();
    renderGraph(container, data, config);
  } catch (error) {
    console.error('Error loading network:', error);
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #ff6b6b;"><p>Error loading network</p></div>';
  }
}

function renderGraph(container, data, config) {
  const { nodes: allNodes, edges: allEdges } = data;
  const {
    width,
    height,
    sliderLabel,
    sliderMin,
    sliderMax,
    sliderStep,
    sliderInitialValue,
    getThresholdFromSlider,
    formatThresholdDisplay,
    filterEdges,
    getEdgeStrokeWidth,
    getEdgeTooltip,
    getStatsText
  } = config;

  container.innerHTML = '';

  // Component color palette (vibrant, distinguishable colors)
  const componentColorPalette = [
    '#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557',
    '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#264653',
    '#8338ec', '#3a86ff', '#fb5607', '#ffbe0b', '#06ffa5',
    '#ff006e', '#8338ec', '#3a0ca3', '#4361ee', '#4cc9f0',
    '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#3f37c9',
    '#4895ef', '#4cc9f0', '#06ffa5', '#00f5ff', '#00bbf9'
  ];

  // League colors (kept for future use/legend)
  const leagueColors = {
    'Premier League': '#3d195b',
    'La Liga': '#ff6b35',
    'Serie A': '#004e89',
    'Bundesliga': '#c1121f',
    'Ligue 1': '#2d6a4f',
    'Primeira Liga': '#f72585',
    'Eredivisie': '#fb8500',
    'Other': '#6c757d'
  };

  // Component tracking state
  let componentColors = new Map(); // Maps component ID to color
  let nodeToComponent = new Map(); // Maps node ID to component ID
  let nextColorIndex = 0;

  // Create controls
  const controls = document.createElement('div');
  controls.style.cssText = 'text-align: center; margin-bottom: 15px;';

  const label = document.createElement('label');
  label.style.cssText = 'color: #ddd; font-size: 14px; margin-right: 10px;';
  label.textContent = sliderLabel;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(sliderMin);
  slider.max = String(sliderMax);
  slider.value = String(sliderInitialValue);
  slider.step = String(sliderStep);
  slider.style.cssText = 'width: 400px; vertical-align: middle; margin-right: 10px;';

  const valueDisplay = document.createElement('span');
  valueDisplay.style.cssText = 'color: #ddd; font-weight: bold; font-size: 14px; min-width: 60px; display: inline-block;';
  valueDisplay.textContent = formatThresholdDisplay(getThresholdFromSlider(sliderInitialValue));

  const statsDisplay = document.createElement('span');
  statsDisplay.style.cssText = 'color: #999; font-size: 12px; margin-left: 20px;';

  controls.appendChild(label);
  controls.appendChild(slider);
  controls.appendChild(valueDisplay);
  controls.appendChild(statsDisplay);
  container.appendChild(controls);

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.cssText = 'background: #f5f5f5; border-radius: 8px;';

  const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  svg.appendChild(edgesGroup);
  svg.appendChild(nodesGroup);
  svg.appendChild(labelsGroup);

  container.appendChild(svg);

  // State
  let currentThreshold = getThresholdFromSlider(sliderInitialValue);
  let nodes = [];
  let edges = [];
  let nodeElements = [];
  let edgeElements = [];
  let animationFrameId = null;
  let simulationParams = {
    alpha: 1.0,
    alphaDecay: 0.01,
    velocityDecay: 0.4
  };

  function filterData(threshold) {
    // Filter edges by threshold
    const filteredEdges = filterEdges(allEdges, threshold);

    // Keep ALL nodes on canvas, even if disconnected
    const filteredNodes = allNodes;

    return { nodes: filteredNodes, edges: filteredEdges };
  }

  // Find connected components using Union-Find
  function findConnectedComponents(nodes, edges) {
    const parent = new Map();
    const rank = new Map();

    // Initialize each node as its own component
    nodes.forEach(n => {
      parent.set(n.id, n.id);
      rank.set(n.id, 0);
    });

    function find(x) {
      if (parent.get(x) !== x) {
        parent.set(x, find(parent.get(x))); // Path compression
      }
      return parent.get(x);
    }

    function union(x, y) {
      const rootX = find(x);
      const rootY = find(y);

      if (rootX === rootY) return;

      // Union by rank
      if (rank.get(rootX) < rank.get(rootY)) {
        parent.set(rootX, rootY);
      } else if (rank.get(rootX) > rank.get(rootY)) {
        parent.set(rootY, rootX);
      } else {
        parent.set(rootY, rootX);
        rank.set(rootX, rank.get(rootX) + 1);
      }
    }

    // Union nodes connected by edges
    edges.forEach(e => union(e.source, e.target));

    // Group nodes by component
    const components = new Map();
    nodes.forEach(n => {
      const root = find(n.id);
      if (!components.has(root)) {
        components.set(root, []);
      }
      components.get(root).push(n.id);
    });

    return components;
  }

  // Assign colors to components with intelligent persistence
  function assignComponentColors(newComponents) {
    const oldNodeToComponent = new Map(nodeToComponent);
    const newNodeToComponent = new Map();

    // Build mapping from new components to old components
    const newComponentsArray = Array.from(newComponents.entries());

    // First pass: group new components by their old component ancestry
    const oldCompToNewComps = new Map(); // Maps old comp ID to array of [newCompId, newCompNodes, overlap]

    newComponentsArray.forEach(([newCompId, newCompNodes]) => {
      const oldComponentOverlap = new Map(); // Maps old component ID to overlap size

      newCompNodes.forEach(nodeId => {
        const oldCompId = oldNodeToComponent.get(nodeId);
        if (oldCompId) {
          oldComponentOverlap.set(oldCompId, (oldComponentOverlap.get(oldCompId) || 0) + 1);
        }
      });

      // Find the old component with maximum overlap
      let maxOverlap = 0;
      let bestOldComp = null;
      oldComponentOverlap.forEach((overlap, oldCompId) => {
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          bestOldComp = oldCompId;
        }
      });

      if (bestOldComp) {
        if (!oldCompToNewComps.has(bestOldComp)) {
          oldCompToNewComps.set(bestOldComp, []);
        }
        oldCompToNewComps.get(bestOldComp).push({
          newCompId,
          newCompNodes,
          overlap: maxOverlap
        });
      } else {
        // Completely new component with no ancestry
        if (!oldCompToNewComps.has(null)) {
          oldCompToNewComps.set(null, []);
        }
        oldCompToNewComps.get(null).push({
          newCompId,
          newCompNodes,
          overlap: 0
        });
      }
    });

    // Second pass: assign colors
    oldCompToNewComps.forEach((newCompsInfo, oldCompId) => {
      if (oldCompId === null) {
        // Brand new components - assign fresh colors
        newCompsInfo.forEach(({ newCompId }) => {
          componentColors.set(newCompId, componentColorPalette[nextColorIndex % componentColorPalette.length]);
          nextColorIndex++;
        });
      } else {
        // Descendants of an old component
        const oldColor = componentColors.get(oldCompId);

        if (newCompsInfo.length === 1) {
          // Simple continuation: one old comp -> one new comp
          const { newCompId } = newCompsInfo[0];
          componentColors.set(newCompId, oldColor || componentColorPalette[nextColorIndex++ % componentColorPalette.length]);
        } else {
          // Split: one old comp -> multiple new comps
          // Largest fragment keeps color, others get new colors
          newCompsInfo.sort((a, b) => b.newCompNodes.length - a.newCompNodes.length);

          newCompsInfo.forEach(({ newCompId }, idx) => {
            if (idx === 0) {
              // Largest fragment keeps the old color
              componentColors.set(newCompId, oldColor || componentColorPalette[nextColorIndex++ % componentColorPalette.length]);
            } else {
              // Smaller fragments get new colors
              componentColors.set(newCompId, componentColorPalette[nextColorIndex++ % componentColorPalette.length]);
            }
          });
        }
      }
    });

    // Update nodeToComponent mapping
    newComponents.forEach((compNodes, compId) => {
      compNodes.forEach(nodeId => {
        newNodeToComponent.set(nodeId, compId);
      });
    });

    nodeToComponent = newNodeToComponent;
  }

  function getNodeColor(nodeId) {
    const compId = nodeToComponent.get(nodeId);
    if (compId && componentColors.has(compId)) {
      return componentColors.get(compId);
    }
    return '#6c757d'; // Default gray
  }

  function updateGraph(threshold) {
    const { nodes: newNodes, edges: newEdges } = filterData(threshold);

    // Find connected components
    const components = findConnectedComponents(newNodes, newEdges);

    // Assign colors with persistence
    assignComponentColors(components);

    // Create node map for existing positions
    const oldNodeMap = new Map(nodes.map(n => [n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy }]));

    // Update nodes (preserve positions if they existed)
    nodes = newNodes.map(n => {
      const old = oldNodeMap.get(n.id);
      return {
        ...n,
        x: old ? old.x : Math.random() * width,
        y: old ? old.y : Math.random() * height,
        vx: old ? old.vx : 0,
        vy: old ? old.vy : 0
      };
    });

    edges = newEdges;

    // Reheat simulation when threshold changes significantly
    if (Math.abs(threshold - currentThreshold) > 0) {
      simulationParams.alpha = Math.min(1.0, simulationParams.alpha + 0.3);
    }

    currentThreshold = threshold;

    // Update stats
    statsDisplay.textContent = getStatsText(nodes, edges, components);

    // Redraw
    redraw();
  }

  function redraw() {
    // Clear groups
    edgesGroup.innerHTML = '';
    nodesGroup.innerHTML = '';

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Calculate node degrees
    const nodeDegrees = new Map();
    nodes.forEach(n => nodeDegrees.set(n.id, 0));
    edges.forEach(e => {
      nodeDegrees.set(e.source, (nodeDegrees.get(e.source) || 0) + 1);
      nodeDegrees.set(e.target, (nodeDegrees.get(e.target) || 0) + 1);
    });

    // Draw edges
    edgeElements = edges.map(edge => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('stroke', '#444');
      line.setAttribute('stroke-width', getEdgeStrokeWidth(edge));
      line.setAttribute('opacity', '0.6');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = getEdgeTooltip(edge);
      line.appendChild(title);

      edgesGroup.appendChild(line);
      return { element: line, data: edge };
    });

    // Draw nodes
    nodeElements = nodes.map(node => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const degree = nodeDegrees.get(node.id) || 0;
      const isIsolated = degree === 0;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const radius = isIsolated ? 2 : 3 + Math.sqrt(degree) * 2;
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', getNodeColor(node.id));
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', isIsolated ? '0.5' : '1.5');
      circle.setAttribute('opacity', isIsolated ? '0.3' : '1.0');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      const compId = nodeToComponent.get(node.id);
      const statusText = isIsolated ? 'isolated' : `${degree} connections`;
      title.textContent = `${node.id} (${node.league || 'Unknown'})\n${statusText}\nComponent: ${compId}`;
      circle.appendChild(title);

      group.appendChild(circle);

      // Label for high-degree nodes (but not isolated ones)
      if (degree >= 15) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#fff');
        text.setAttribute('pointer-events', 'none');

        // Support multi-line labels by splitting on \n
        const lines = node.id.split('\\n');
        const lineHeight = 12;
        const startY = radius + 12;

        lines.forEach((line, i) => {
          const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.setAttribute('x', '0');
          tspan.setAttribute('dy', i === 0 ? startY : lineHeight);
          tspan.textContent = line;
          text.appendChild(tspan);
        });

        group.appendChild(text);
      }

      nodesGroup.appendChild(group);
      return { element: group, data: node, degree };
    });

    updatePositions();
  }

  function updatePositions() {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    edgeElements.forEach(({ element, data: edge }) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (source && target) {
        element.setAttribute('x1', source.x);
        element.setAttribute('y1', source.y);
        element.setAttribute('x2', target.x);
        element.setAttribute('y2', target.y);
      }
    });

    nodeElements.forEach(({ element, data: node }) => {
      element.setAttribute('transform', `translate(${node.x}, ${node.y})`);
    });
  }

  function tick() {
    if (simulationParams.alpha < 0.001) {
      return;
    }

    // Apply forces
    applyForces();

    // Decay alpha
    simulationParams.alpha *= (1 - simulationParams.alphaDecay);

    // Update positions
    updatePositions();

    // Continue animation
    animationFrameId = requestAnimationFrame(tick);
  }

  function applyForces() {
    if (nodes.length === 0) return;

    const strength = simulationParams.alpha;

    // Simplified spring-based layout (better performance than Kamada-Kawai)
    const L0 = Math.min(width, height) / 5; // desired edge length
    const repulsionStrength = 5000;
    const attractionStrength = 0.1;

    // Initialize displacements
    nodes.forEach(n => {
      n.dispX = 0;
      n.dispY = 0;
    });

    // Repulsive forces between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const v = nodes[i];
        const u = nodes[j];
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        // Repulsion: F = k / d²
        const repulsion = repulsionStrength / distSq;
        const fx = (dx / dist) * repulsion;
        const fy = (dy / dist) * repulsion;

        v.dispX += fx;
        v.dispY += fy;
        u.dispX -= fx;
        u.dispY -= fy;
      }
    }

    // Attractive forces along edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Attraction: F = k * (d - L0)
        const attraction = attractionStrength * (dist - L0);
        const fx = (dx / dist) * attraction;
        const fy = (dy / dist) * attraction;

        source.dispX += fx;
        source.dispY += fy;
        target.dispX -= fx;
        target.dispY -= fy;
      }
    });

    // Apply displacements with cooling
    const temperature = strength * 100;
    nodes.forEach(n => {
      const dispMag = Math.sqrt(n.dispX * n.dispX + n.dispY * n.dispY) || 1;

      // Limit displacement by temperature
      n.x += (n.dispX / dispMag) * Math.min(dispMag, temperature);
      n.y += (n.dispY / dispMag) * Math.min(dispMag, temperature);

      // Keep nodes in bounds
      const margin = 20;
      n.x = Math.max(margin, Math.min(width - margin, n.x));
      n.y = Math.max(margin, Math.min(height - margin, n.y));
    });
  }

  // Slider interaction
  slider.addEventListener('input', (e) => {
    const sliderValue = parseInt(e.target.value);
    const threshold = getThresholdFromSlider(sliderValue);
    valueDisplay.textContent = formatThresholdDisplay(threshold);
    updateGraph(threshold);
  });

  // Initialize
  updateGraph(currentThreshold);
  tick();
}
