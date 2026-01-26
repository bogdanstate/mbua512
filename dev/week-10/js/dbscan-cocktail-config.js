/**
 * DBSCAN Algorithm Configuration for Cocktail Party
 */

import { CocktailPartyViz } from './cocktail-party-shared.js';

export async function initDBSCANCocktailParty(containerId, options = {}) {
  const {
    dataFile = 'data/cocktail-party-positions.csv',
    width = 1000,
    height = 750
  } = options;

  const config = {
    // Algorithm state
    eps: 1.5, // neighborhood radius in meters
    minPts: 3, // minimum points to form a cluster
    clusters: [],
    assignments: {},
    noise: new Set(),

    // UI elements
    epsSlider: null,
    epsValue: null,
    minPtsSlider: null,
    minPtsValue: null,
    runButton: null,
    statusDisplay: null,

    createControls(container, viz) {
      const epsLabel = document.createElement('label');
      epsLabel.textContent = 'ε (radius): ';
      epsLabel.style.cssText = 'font-size: 0.9em;';

      this.epsSlider = document.createElement('input');
      this.epsSlider.type = 'range';
      this.epsSlider.min = '0.5';
      this.epsSlider.max = '3';
      this.epsSlider.step = '0.1';
      this.epsSlider.value = '1.5';
      this.epsSlider.style.cssText = 'width: 150px; margin: 0 10px;';

      this.epsValue = document.createElement('span');
      this.epsValue.textContent = '1.5m';
      this.epsValue.style.cssText = 'font-weight: bold; font-size: 0.9em;';

      const minPtsLabel = document.createElement('label');
      minPtsLabel.textContent = 'MinPts: ';
      minPtsLabel.style.cssText = 'margin-left: 20px; font-size: 0.9em;';

      this.minPtsSlider = document.createElement('input');
      this.minPtsSlider.type = 'range';
      this.minPtsSlider.min = '2';
      this.minPtsSlider.max = '10';
      this.minPtsSlider.value = '3';
      this.minPtsSlider.style.cssText = 'width: 120px; margin: 0 10px;';

      this.minPtsValue = document.createElement('span');
      this.minPtsValue.textContent = '3';
      this.minPtsValue.style.cssText = 'font-weight: bold; font-size: 0.9em;';

      this.runButton = document.createElement('button');
      this.runButton.textContent = 'Run DBSCAN';
      this.runButton.style.cssText = 'margin-left: 20px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

      this.statusDisplay = document.createElement('span');
      this.statusDisplay.style.cssText = 'margin-left: 20px; font-size: 0.9em; color: #666;';

      this.epsSlider.addEventListener('input', (e) => {
        this.eps = parseFloat(e.target.value);
        this.epsValue.textContent = `${this.eps.toFixed(1)}m`;
      });

      this.minPtsSlider.addEventListener('input', (e) => {
        this.minPts = parseInt(e.target.value);
        this.minPtsValue.textContent = this.minPts.toString();
      });

      this.runButton.addEventListener('click', () => {
        this.runDBSCAN(viz);
      });

      container.appendChild(epsLabel);
      container.appendChild(this.epsSlider);
      container.appendChild(this.epsValue);
      container.appendChild(minPtsLabel);
      container.appendChild(this.minPtsSlider);
      container.appendChild(this.minPtsValue);
      container.appendChild(this.runButton);
      container.appendChild(this.statusDisplay);
    },

    getInfoBoxContent() {
      return `
        <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 1em;">Algorithm Steps</h3>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #2196f3;">1. Find Neighbors</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">For each point, find all points within ε distance</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #4caf50;">2. Core Points</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">Points with ≥ MinPts neighbors are core points</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #9c27b0;">3. Expand Clusters</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">From each core point, expand cluster by adding reachable points</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #e74c3c;">4. Mark Noise</p>
        <p style="margin: 0 0 4px 0; font-size: 0.95em;">Points not in any cluster are noise/outliers</p>

        <div style="margin-top: 15px; padding: 10px; background: #fff3e0; border-radius: 4px;">
          <p style="margin: 0; font-size: 0.85em; color: #e65100;">
            <strong>Note:</strong> DBSCAN finds clusters of arbitrary shape and automatically identifies outliers
          </p>
        </div>
      `;
    },

    initializeCircles(viz) {
      // Create circles from DBSCAN clusters
      const circles = [];
      this.clusters.forEach((clusterPoints, idx) => {
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
      // If DBSCAN hasn't been run, just draw people with default color
      if (this.clusters.length === 0) {
        viz.drawPeople(svg);
      } else {
        // Draw epsilon circles around core points
        viz.people.forEach(person => {
          if (!this.noise.has(person.id)) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', viz.toScreenX(person.x));
            circle.setAttribute('cy', viz.toScreenY(person.y));
            circle.setAttribute('r', viz.toScreenX(this.eps) - viz.margin);
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', '#e3f2fd');
            circle.setAttribute('stroke-width', '1');
            circle.setAttribute('opacity', '0.3');
            svg.appendChild(circle);
          }
        });

        // Draw people with cluster colors
        viz.people.forEach(person => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', viz.toScreenX(person.x));
          circle.setAttribute('cy', viz.toScreenY(person.y));

          if (this.noise.has(person.id)) {
            // Noise points - gray and smaller
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#95a5a6');
            circle.setAttribute('stroke', '#666');
            circle.setAttribute('stroke-width', '1');
            circle.setAttribute('opacity', '0.5');
          } else {
            // Cluster points
            circle.setAttribute('r', '6');
            const clusterIdx = this.assignments[person.id] || 0;
            circle.setAttribute('fill', viz.colors[clusterIdx % viz.colors.length]);
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '1.5');
            circle.setAttribute('opacity', '0.8');
          }

          svg.appendChild(circle);
        });
      }

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
    },

    distance(p1, p2) {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    },

    getNeighbors(person, people) {
      return people.filter(p =>
        p.id !== person.id && this.distance(person, p) <= this.eps
      );
    },

    runDBSCAN(viz) {
      console.log(`Running DBSCAN with ε=${this.eps}, MinPts=${this.minPts}`);

      this.clusters = [];
      this.assignments = {};
      this.noise = new Set();

      const visited = new Set();
      const clustered = new Set();
      let clusterIdx = 0;

      viz.people.forEach(person => {
        if (visited.has(person.id)) return;
        visited.add(person.id);

        const neighbors = this.getNeighbors(person, viz.people);

        if (neighbors.length < this.minPts) {
          // Mark as noise (might change later if reached from core point)
          this.noise.add(person.id);
        } else {
          // Start new cluster
          const cluster = [];
          this.expandCluster(person, neighbors, cluster, visited, clustered, viz.people);

          if (cluster.length > 0) {
            this.clusters.push(cluster);
            cluster.forEach(p => {
              this.assignments[p.id] = clusterIdx;
              this.noise.delete(p.id); // Remove from noise if it was there
            });
            clusterIdx++;
          }
        }
      });

      viz.render();
      this.statusDisplay.textContent = `${this.clusters.length} clusters, ${this.noise.size} noise points`;
      console.log(`DBSCAN complete: ${this.clusters.length} clusters, ${this.noise.size} noise points`);
    },

    expandCluster(person, neighbors, cluster, visited, clustered, people) {
      cluster.push(person);
      clustered.add(person.id);

      let i = 0;
      while (i < neighbors.length) {
        const neighbor = neighbors[i];

        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          const neighborNeighbors = this.getNeighbors(neighbor, people);

          if (neighborNeighbors.length >= this.minPts) {
            // Neighbor is also a core point, add its neighbors
            neighborNeighbors.forEach(nn => {
              if (!neighbors.some(n => n.id === nn.id)) {
                neighbors.push(nn);
              }
            });
          }
        }

        if (!clustered.has(neighbor.id)) {
          cluster.push(neighbor);
          clustered.add(neighbor.id);
        }

        i++;
      }
    }
  };

  const party = new CocktailPartyViz(containerId, config);
  await party.init(dataFile);
}
