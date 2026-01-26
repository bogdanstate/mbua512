/**
 * Network Graph Visualization for Club Formation Similarity (Hamming Distance)
 * Wrapper around the reusable network component
 */

import { initNetworkGraphComponent } from './network-graph-component.js?v=7';

export async function initHammingNetworkGraph(containerId, options = {}) {
  const {
    dataFile = 'data/club-hamming-network.json',
    width = 1200,
    height = 800
  } = options;

  return initNetworkGraphComponent(containerId, {
    dataFile,
    width,
    height,
    sliderLabel: 'Minimum formation similarity:',
    sliderMin: 9,    // 9 = 0.09 Hamming similarity
    sliderMax: 91,   // 91 = 0.91 Hamming similarity
    sliderStep: 1,   // Steps of 0.01
    sliderInitialValue: 33, // Start at 0.33
    getThresholdFromSlider: (val) => val / 100,
    formatThresholdDisplay: (val) => val.toFixed(2),
    filterEdges: (edges, threshold) => edges.filter(e => e.weight >= threshold),
    getEdgeStrokeWidth: (edge) => {
      // Scale Hamming similarity (0.09-0.91) to visual range similar to Jaccard
      const scaledWeight = (edge.weight - 0.09) / (0.91 - 0.09) * 9 + 1;
      return Math.sqrt(scaledWeight);
    },
    getEdgeTooltip: (edge) => `${edge.source} ↔ ${edge.target}: ${edge.weight.toFixed(2)} formation similarity`,
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
