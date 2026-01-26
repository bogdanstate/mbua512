/**
 * K-means Algorithm Configuration for Cocktail Party
 */

import { CocktailPartyViz } from './cocktail-party-shared.js';

export async function initKMeansCocktailParty(containerId, options = {}) {
  const {
    dataFile = 'data/cocktail-party-positions.csv',
    width = 1000,
    height = 750
  } = options;

  const config = {
    // Algorithm state
    k: 5,
    centroids: [],
    assignments: [],
    iteration: 0,

    // UI elements (will be set in createControls)
    kSlider: null,
    kValue: null,
    runButton: null,
    iterationDisplay: null,

    createControls(container, viz) {
      this.kSlider = document.createElement('input');
      this.kSlider.type = 'range';
      this.kSlider.min = '2';
      this.kSlider.max = '8';
      this.kSlider.value = '5';
      this.kSlider.style.cssText = 'width: 200px; margin: 0 10px;';

      this.kValue = document.createElement('span');
      this.kValue.textContent = '5';
      this.kValue.style.cssText = 'font-weight: bold; font-size: 1.1em;';

      this.runButton = document.createElement('button');
      this.runButton.textContent = 'Run K-means';
      this.runButton.style.cssText = 'margin-left: 20px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

      this.iterationDisplay = document.createElement('span');
      this.iterationDisplay.style.cssText = 'margin-left: 20px; font-size: 0.9em; color: #666;';

      this.kSlider.addEventListener('input', (e) => {
        this.kValue.textContent = e.target.value;
        this.k = parseInt(e.target.value);
      });

      this.runButton.addEventListener('click', () => {
        this.runKMeans(viz);
      });

      container.appendChild(document.createTextNode('Number of clusters (k): '));
      container.appendChild(this.kSlider);
      container.appendChild(this.kValue);
      container.appendChild(this.runButton);
      container.appendChild(this.iterationDisplay);
    },

    getInfoBoxContent() {
      return `
        <h3 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 1em;">Social Rules</h3>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #9c27b0;">Formation:</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">Target: 6 people<br>Split at 7+<br>Merge if ≤6</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #2a9d8f;">Leaving:</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">1-2: 0.05%<br>3-4: 0.1%<br>5-6: 0.2%<br>7+: 1.0%</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #e74c3c;">Movement:</p>
        <p style="margin: 0 0 10px 0; font-size: 0.95em;">0.5m bubble<br>Avoid groups<br>Repel circles</p>

        <p style="margin: 0 0 6px 0; font-weight: bold; color: #f39c12;">Joining:</p>
        <p style="margin: 0; font-size: 0.95em;">Seek groups<br>Prefer 4-6</p>
      `;
    },

    initializeCircles(viz) {
      // Create circles from current K-means clusters
      const circles = [];
      for (let i = 0; i < this.k; i++) {
        const members = viz.people
          .filter((_, idx) => this.assignments[idx] === i)
          .map(p => p.id);

        if (members.length > 0) {
          const clusterPeople = viz.people.filter(p => members.includes(p.id));
          circles.push({
            id: viz.nextCircleId++,
            members: members,
            x: clusterPeople.reduce((sum, p) => sum + p.x, 0) / clusterPeople.length,
            y: clusterPeople.reduce((sum, p) => sum + p.y, 0) / clusterPeople.length
          });
        }
      }
      return circles;
    },

    render(svg, viz) {
      // Draw Voronoi regions if centroids exist
      if (this.centroids.length > 0) {
        this.drawVoronoi(svg, viz);
      }

      // Draw people with cluster colors
      const assignments = {};
      viz.people.forEach((p, idx) => {
        assignments[p.id] = this.assignments[idx] || 0;
      });
      viz.drawPeople(svg, assignments);

      // Draw centroids
      this.centroids.forEach((centroid, i) => {
        const cx = viz.toScreenX(centroid.x);
        const cy = viz.toScreenY(centroid.y);

        // Centroid marker
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const size = 12;
        marker.setAttribute('d', `M ${cx},${cy - size} L ${cx + size},${cy + size} L ${cx - size},${cy + size} Z`);
        marker.setAttribute('fill', viz.colors[i % viz.colors.length]);
        marker.setAttribute('stroke', '#333');
        marker.setAttribute('stroke-width', '2');
        svg.appendChild(marker);
      });

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

    drawVoronoi(svg, viz) {
      const gridResolution = 20;
      const roomWidthPx = viz.roomWidth * viz.scaleX;
      const roomHeightPx = viz.roomHeight * viz.scaleY;

      const clusterRegions = new Array(this.centroids.length).fill(null).map(() => []);

      // Sample grid points
      for (let x = viz.margin; x < viz.margin + roomWidthPx; x += gridResolution) {
        for (let y = viz.margin; y < viz.margin + roomHeightPx; y += gridResolution) {
          const roomX = viz.toRoomX(x);
          const roomY = viz.toRoomY(y);

          // Find nearest centroid
          let minDist = Infinity;
          let nearestCluster = 0;

          this.centroids.forEach((centroid, i) => {
            const dist = Math.sqrt(
              Math.pow(roomX - centroid.x, 2) +
              Math.pow(roomY - centroid.y, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              nearestCluster = i;
            }
          });

          clusterRegions[nearestCluster].push({ x, y });
        }
      }

      // Draw Voronoi regions
      clusterRegions.forEach((points, i) => {
        points.forEach(pt => {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', pt.x);
          rect.setAttribute('y', pt.y);
          rect.setAttribute('width', gridResolution);
          rect.setAttribute('height', gridResolution);
          rect.setAttribute('fill', viz.colors[i % viz.colors.length]);
          rect.setAttribute('opacity', '0.15');
          svg.appendChild(rect);
        });
      });
    },

    runKMeans(viz) {
      // Initialize centroids randomly
      this.centroids = [];
      for (let i = 0; i < this.k; i++) {
        const randomPerson = viz.people[Math.floor(Math.random() * viz.people.length)];
        this.centroids.push({ x: randomPerson.x, y: randomPerson.y });
      }

      this.iteration = 0;
      const maxIterations = 20;

      const iterate = () => {
        // Assignment step
        this.assignments = viz.people.map(person => {
          let minDist = Infinity;
          let cluster = 0;

          this.centroids.forEach((centroid, i) => {
            const dist = Math.sqrt(
              Math.pow(person.x - centroid.x, 2) +
              Math.pow(person.y - centroid.y, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              cluster = i;
            }
          });

          return cluster;
        });

        // Update step
        const newCentroids = [];
        for (let i = 0; i < this.k; i++) {
          const clusterPoints = viz.people.filter((_, idx) => this.assignments[idx] === i);
          if (clusterPoints.length > 0) {
            const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
            const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;
            newCentroids.push({ x: avgX, y: avgY });
          } else {
            newCentroids.push(this.centroids[i]);
          }
        }

        // Check convergence
        const converged = this.centroids.every((c, i) =>
          Math.abs(c.x - newCentroids[i].x) < 0.01 &&
          Math.abs(c.y - newCentroids[i].y) < 0.01
        );

        this.centroids = newCentroids;
        this.iteration++;

        viz.render();
        this.iterationDisplay.textContent = `Iteration: ${this.iteration}${converged ? ' (Converged)' : ''}`;

        if (!converged && this.iteration < maxIterations) {
          setTimeout(iterate, 1000);
        }
      };

      iterate();
    }
  };

  const party = new CocktailPartyViz(containerId, config);
  await party.init(dataFile);
}
