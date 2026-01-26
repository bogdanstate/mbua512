/**
 * Slide Manifest - Defines all slide sections to be loaded
 *
 * This file controls which slides are included in the presentation and in what order.
 * To add/remove/reorder sections, simply modify this array.
 */

export const slideManifest = [
  {
    name: 'Title & Introduction',
    file: 'slides/title.html',
    description: 'Course title, goals, and what is a cluster definition',
    enabled: true
  },
  {
    name: 'What is a Cluster?',
    file: 'slides/cluster-concept.html',
    description: 'Interactive 5-step progression: raw points → coordinates → distances → clusters → dendrogram',
    enabled: true
  },
  {
    name: 'Clustering Methods & Distance Intro',
    file: 'slides/clustering-methods-intro.html',
    description: 'Common clustering methods (graph-based, density-based) and introduction to distance measures',
    enabled: true
  },
  {
    name: 'Euclidean Distance',
    file: 'slides/euclidean.html',
    description: 'Straight-line distance with player starting positions (X-Y coordinates)',
    enabled: true
  },
  {
    name: 'Manhattan Distance',
    file: 'slides/manhattan.html',
    description: 'Grid-based distance with player starting positions (X-Y coordinates)',
    enabled: true
  },
  {
    name: 'Jaccard Similarity',
    file: 'slides/jaccard.html',
    description: 'Set-based similarity measure with player transfer examples',
    enabled: true
  },
  {
    name: 'Hamming Distance',
    file: 'slides/hamming.html',
    description: 'Categorical distance measure with formation analysis',
    enabled: true
  },
  {
    name: 'Cosine Similarity',
    file: 'slides/cosine.html',
    description: 'Angle-based similarity with ball possession patterns',
    enabled: true
  },
  {
    name: 'K-means Clustering Demo',
    file: 'slides/kmeans-demo.html',
    description: 'Interactive K-means clustering demonstration with cocktail party data',
    enabled: true
  },
  {
    name: 'Solutions',
    file: 'slides/solutions.html',
    description: 'Step-by-step solutions for cluster analysis - only visible with ?solution query parameter',
    enabled: true,
    requiresQueryParam: 'solution'
  },
  {
    name: 'Cluster Analysis Example',
    file: 'slides/cluster-analysis-example.html',
    description: 'Real-world cluster analysis with injury prediction dataset using webR',
    enabled: true
  }
].filter(section => section.enabled);
