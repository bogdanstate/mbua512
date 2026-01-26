/**
 * Hierarchical Clustering Algorithm Configuration for Cocktail Party
 */

import { CocktailPartyViz } from './cocktail-party-shared.js';

export async function initHierarchicalCocktailParty(containerId, options = {}) {
  const {
    dataFile = 'data/cocktail-party-positions.csv',
    width = 1000,
    height = 750
  } = options;

  const config = {
    // Algorithm state
    root: null,
    history: [],
    maxHeight: 0,
    currentStep: 0,
    cuttingHeight: 0,
    isAutoRunning: false,
    autoInterval: null,

    // UI elements
    stepButton: null,
    resetButton: null,
    autoButton: null,
    stepDisplay: null,
    cutSlider: null,
    cutValue: null,
    clusterCount: null,
    dendSvg: null,

    createControls(container, viz) {
      this.stepButton = document.createElement('button');
      this.stepButton.textContent = 'Step Forward';
      this.stepButton.style.cssText = 'padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

      this.resetButton = document.createElement('button');
      this.resetButton.textContent = 'Reset';
      this.resetButton.style.cssText = 'margin-left: 10px; padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

      this.autoButton = document.createElement('button');
      this.autoButton.textContent = 'Auto-Run';
      this.autoButton.style.cssText = 'margin-left: 10px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

      this.stepDisplay = document.createElement('span');
      this.stepDisplay.style.cssText = 'margin-left: 20px; font-size: 0.9em; color: #666;';

      const cutSliderLabel = document.createElement('label');
      cutSliderLabel.textContent = 'Cut height: ';
      cutSliderLabel.style.cssText = 'margin-left: 30px; font-size: 0.9em;';

      this.cutSlider = document.createElement('input');
      this.cutSlider.type = 'range';
      this.cutSlider.min = '0';
      this.cutSlider.max = '100';
      this.cutSlider.value = '70';
      this.cutSlider.style.cssText = 'width: 120px; margin: 0 10px;';

      this.cutValue = document.createElement('span');
      this.cutValue.style.cssText = 'font-weight: bold; font-size: 0.9em;';

      this.clusterCount = document.createElement('span');
      this.clusterCount.style.cssText = 'margin-left: 15px; font-size: 0.9em; color: #2196f3; font-weight: bold;';

      // Event handlers
      this.stepButton.addEventListener('click', () => {
        if (this.currentStep < this.history.length) {
          this.currentStep++;
          viz.render();
        }
      });

      this.resetButton.addEventListener('click', () => {
        this.currentStep = 0;
        this.isAutoRunning = false;
        if (this.autoInterval) {
          clearInterval(this.autoInterval);
          this.autoInterval = null;
        }
        this.autoButton.textContent = 'Auto-Run';
        this.autoButton.style.background = '#2196f3';
        viz.render();
      });

      this.autoButton.addEventListener('click', () => {
        if (this.isAutoRunning) {
          this.isAutoRunning = false;
          clearInterval(this.autoInterval);
          this.autoInterval = null;
          this.autoButton.textContent = 'Auto-Run';
          this.autoButton.style.background = '#2196f3';
        } else {
          this.isAutoRunning = true;
          this.autoButton.textContent = 'Stop';
          this.autoButton.style.background = '#f44336';

          this.autoInterval = setInterval(() => {
            if (this.currentStep < this.history.length) {
              this.currentStep++;
              viz.render();
            } else {
              this.isAutoRunning = false;
              clearInterval(this.autoInterval);
              this.autoInterval = null;
              this.autoButton.textContent = 'Auto-Run';
              this.autoButton.style.background = '#2196f3';
            }
          }, 300);
        }
      });

      this.cutSlider.addEventListener('input', (e) => {
        const percentage = parseInt(e.target.value);
        this.cuttingHeight = (percentage / 100) * this.maxHeight;
        viz.render();
      });

      container.appendChild(this.stepButton);
      container.appendChild(this.resetButton);
      container.appendChild(this.autoButton);
      container.appendChild(this.stepDisplay);
      container.appendChild(cutSliderLabel);
      container.appendChild(this.cutSlider);
      container.appendChild(this.cutValue);
      container.appendChild(this.clusterCount);
    },

    getInfoBoxContent() {
      return `
        <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 1em;">Algorithm Steps</h3>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #4caf50;">1. Start</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">Each person is their own cluster (100 clusters)</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #2196f3;">2. Find Closest</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">Calculate distances between all cluster pairs</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #9c27b0;">3. Merge</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">Combine the two closest clusters</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #ff9800;">4. Repeat</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">Continue until all in one cluster</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #e74c3c;">5. Cut Tree</p>
        <p style="margin: 0 0 4px 0; font-size: 0.95em;">Choose height threshold for K clusters</p>

        <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px;">
          <p style="margin: 0; font-size: 0.85em; color: #1565c0;">
            <strong>Linkage:</strong> Complete
          </p>
        </div>
      `;
    },

    createSecondaryViz(container, viz) {
      const dendTitle = document.createElement('h3');
      dendTitle.textContent = 'Dendrogram';
      dendTitle.style.cssText = 'text-align: center; margin: 20px 0 10px 0; color: #2c3e50;';

      this.dendSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.dendSvg.setAttribute('width', '1200');
      this.dendSvg.setAttribute('height', '300');
      this.dendSvg.style.cssText = 'display: block; margin: 0 auto; background: white; border: 2px solid #ddd; border-radius: 8px;';

      container.appendChild(dendTitle);
      container.appendChild(this.dendSvg);

      // Run hierarchical clustering
      console.log('Running hierarchical clustering...');
      const result = this.hierarchicalClustering(viz.people);
      this.root = result.root;
      this.history = result.history;
      this.maxHeight = Math.max(...this.history.map(h => h.distance));
      this.cuttingHeight = this.maxHeight * 0.7;
      console.log(`Clustering complete: ${this.history.length} merges`);
    },

    distance(p1, p2) {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    },

    clusterDistance(cluster1, cluster2) {
      let maxDist = 0;
      for (const p1 of cluster1.points) {
        for (const p2 of cluster2.points) {
          const d = this.distance(p1, p2);
          if (d > maxDist) maxDist = d;
        }
      }
      return maxDist;
    },

    hierarchicalClustering(points) {
      const clusters = points.map((p, i) => ({
        id: i,
        points: [p],
        left: null,
        right: null,
        height: 0
      }));

      const mergeHistory = [];

      while (clusters.length > 1) {
        let minDist = Infinity;
        let mergeI = -1, mergeJ = -1;

        for (let i = 0; i < clusters.length; i++) {
          for (let j = i + 1; j < clusters.length; j++) {
            const dist = this.clusterDistance(clusters[i], clusters[j]);
            if (dist < minDist) {
              minDist = dist;
              mergeI = i;
              mergeJ = j;
            }
          }
        }

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

        clusters.splice(Math.max(mergeI, mergeJ), 1);
        clusters.splice(Math.min(mergeI, mergeJ), 1);
        clusters.push(newCluster);
      }

      return { root: clusters[0], history: mergeHistory };
    },

    getClustersAtHeight(node, height, clusters = []) {
      if (!node) return clusters;

      if (node.height <= height) {
        clusters.push(node.points);
      } else {
        this.getClustersAtHeight(node.left, height, clusters);
        this.getClustersAtHeight(node.right, height, clusters);
      }

      return clusters;
    },

    initializeCircles(viz) {
      const clusters = this.getClustersAtHeight(this.root, this.cuttingHeight);
      const circles = [];

      clusters.forEach(clusterPoints => {
        const members = clusterPoints.map(p => p.id);
        if (members.length > 0) {
          circles.push({
            id: viz.nextCircleId++,
            members: members,
            x: clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length,
            y: clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length
          });
        }
      });

      return circles;
    },

    render(svg, viz) {
      // Check if clustering has been run
      if (!this.root || !this.history) {
        // Just draw people with default color
        viz.drawPeople(svg);
        return;
      }

      const clusters = this.getClustersAtHeight(this.root, this.cuttingHeight);
      const pointToCluster = new Map();

      clusters.forEach((clusterPoints, idx) => {
        clusterPoints.forEach(p => {
          pointToCluster.set(p.id, idx % viz.colors.length);
        });
      });

      // Draw people with cluster colors
      const assignments = {};
      viz.people.forEach(p => {
        assignments[p.id] = pointToCluster.get(p.id) || 0;
      });
      viz.drawPeople(svg, assignments);

      // Draw conversation circles if animating
      if (viz.isAnimating) {
        viz.conversationCircles.forEach(circle => {
          const circleEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circleEl.setAttribute('cx', viz.toScreenX(circle.x));
          circleEl.setAttribute('cy', viz.toScreenY(circle.y));
          circleEl.setAttribute('r', viz.toScreenX(1.5) - viz.margin);
          circleEl.setAttribute('fill', 'none');
          circleEl.setAttribute('stroke', '#9c27b0');
          circleEl.setAttribute('stroke-width', '2');
          circleEl.setAttribute('stroke-dasharray', '5,5');
          circleEl.setAttribute('opacity', '0.5');
          svg.appendChild(circleEl);
        });
      }

      // Update displays
      this.stepDisplay.textContent = this.currentStep === this.history.length
        ? `Complete! (${this.history.length} merges)`
        : `Step ${this.currentStep} / ${this.history.length}`;

      const percentage = Math.round((this.cuttingHeight / this.maxHeight) * 100);
      this.cutValue.textContent = `${this.cuttingHeight.toFixed(1)}m`;
      this.clusterCount.textContent = `${clusters.length} clusters`;

      this.stepButton.disabled = this.currentStep >= this.history.length;
      this.stepButton.style.opacity = this.stepButton.disabled ? '0.5' : '1';

      // Draw dendrogram
      this.drawDendrogram(viz);
    },

    drawDendrogram(viz) {
      // Check if dendSvg exists and clustering is complete
      if (!this.dendSvg || !this.root || !this.history) {
        return;
      }

      while (this.dendSvg.firstChild) {
        this.dendSvg.removeChild(this.dendSvg.firstChild);
      }

      const margin = { top: 20, right: 30, bottom: 30, left: 50 };
      const width = 1200 - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${margin.left},${margin.top})`);

      // Assign leaf positions
      let leafPosition = 0;
      const leafPositions = new Map();

      const assignLeafPositions = (node) => {
        if (!node) return;
        if (node.points.length === 1) {
          leafPositions.set(node.id, leafPosition);
          leafPosition++;
        } else {
          assignLeafPositions(node.left);
          assignLeafPositions(node.right);
        }
      };
      assignLeafPositions(this.root);

      const getClusterX = (node) => {
        if (node.points.length === 1) {
          return (leafPositions.get(node.id) / viz.people.length) * width;
        } else {
          const leftX = getClusterX(node.left);
          const rightX = getClusterX(node.right);
          return (leftX + rightX) / 2;
        }
      };

      const heightScale = height / (this.maxHeight * 1.1);

      const drawNode = (node) => {
        if (!node || !node.left || !node.right) return;

        const x = getClusterX(node);
        const y = height - node.height * heightScale;
        const leftX = getClusterX(node.left);
        const leftY = height - node.left.height * heightScale;
        const rightX = getClusterX(node.right);
        const rightY = height - node.right.height * heightScale;

        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', x);
        vLine.setAttribute('y1', y);
        vLine.setAttribute('x2', x);
        vLine.setAttribute('y2', Math.max(leftY, rightY));
        vLine.setAttribute('stroke', '#666');
        vLine.setAttribute('stroke-width', '1.5');
        g.appendChild(vLine);

        const hLineLeft = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLineLeft.setAttribute('x1', x);
        hLineLeft.setAttribute('y1', leftY);
        hLineLeft.setAttribute('x2', leftX);
        hLineLeft.setAttribute('y2', leftY);
        hLineLeft.setAttribute('stroke', '#666');
        hLineLeft.setAttribute('stroke-width', '1.5');
        g.appendChild(hLineLeft);

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
      };

      // Only draw up to current step
      let stepNode = this.root;
      for (let i = 0; i < this.currentStep && i < this.history.length; i++) {
        stepNode = this.history[i].cluster;
      }
      drawNode(stepNode);

      // Cutting line
      const cutY = height - this.cuttingHeight * heightScale;
      const cutLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      cutLine.setAttribute('x1', '0');
      cutLine.setAttribute('y1', cutY);
      cutLine.setAttribute('x2', width);
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
      yAxis.setAttribute('y2', height);
      yAxis.setAttribute('stroke', '#333');
      yAxis.setAttribute('stroke-width', '2');
      g.appendChild(yAxis);

      // Y-axis label
      const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yLabel.setAttribute('x', -height / 2);
      yLabel.setAttribute('y', -35);
      yLabel.setAttribute('transform', 'rotate(-90)');
      yLabel.setAttribute('text-anchor', 'middle');
      yLabel.setAttribute('font-size', '11');
      yLabel.setAttribute('fill', '#333');
      yLabel.textContent = 'Distance (m)';
      g.appendChild(yLabel);

      this.dendSvg.appendChild(g);
    }
  };

  const party = new CocktailPartyViz(containerId, config);
  await party.init(dataFile);
}
