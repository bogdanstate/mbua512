/**
 * Network Graph Visualization for Club Transfer Networks
 * Wrapper around the reusable network component
 */

import { initNetworkGraphComponent } from './network-graph-component.js?v=7';

export async function initNetworkGraph(containerId, options = {}) {
  console.log('[Jaccard] initNetworkGraph called for container:', containerId);
  const {
    dataFile = 'data/club-network.json',
    width = 1200,
    height = 800
  } = options;

  console.log('[Jaccard] Calling initNetworkGraphComponent with config');
  return initNetworkGraphComponent(containerId, {
    dataFile,
    width,
    height,
    sliderLabel: 'Minimum Jaccard similarity:',
    sliderMin: 10,   // 10 = 0.010 Jaccard similarity
    sliderMax: 50,   // 50 = 0.050 Jaccard similarity
    sliderStep: 1,   // Steps of 0.001
    sliderInitialValue: 10, // Start at 0.010
    getThresholdFromSlider: (val) => val / 1000,
    formatThresholdDisplay: (val) => val.toFixed(3),
    filterEdges: (edges, threshold) => edges.filter(e => e.weight >= threshold),
    getEdgeStrokeWidth: (edge) => {
      // Use sharedCount if available, otherwise scale the Jaccard similarity
      if (edge.sharedCount !== undefined) {
        return Math.sqrt(edge.sharedCount);
      }
      // Fallback: scale Jaccard similarity (0.010-0.050) to visual range
      const scaledWeight = (edge.weight - 0.010) / (0.050 - 0.010) * 9 + 1;
      return Math.sqrt(scaledWeight);
    },
    getEdgeTooltip: (edge) => {
      if (edge.sharedCount !== undefined) {
        return `${edge.source} ↔ ${edge.target}: ${edge.sharedCount} shared player${edge.sharedCount !== 1 ? 's' : ''} (${edge.weight.toFixed(3)} Jaccard)`;
      }
      return `${edge.source} ↔ ${edge.target}: ${edge.weight.toFixed(3)} Jaccard similarity`;
    },
    getStatsText: (nodes, edges, components) => {
      const connectedComponents = Array.from(components.values()).filter(comp => comp.length > 1).length;
      const isolatedNodes = Array.from(components.values()).filter(comp => comp.length === 1).length;

      let statsText = `${nodes.length} clubs, ${edges.length} connections`;
      if (connectedComponents > 0) {
        statsText += `, ${connectedComponents} component${connectedComponents !== 1 ? 's' : ''}`;
      }
      if (isolatedNodes > 0) {
        statsText += `, ${isolatedNodes} isolated`;
      }
      return statsText;
    }
  });
}
