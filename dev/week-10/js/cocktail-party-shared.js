/**
 * Shared Cocktail Party Visualization Framework
 * Reusable component for K-means, Hierarchical, and DBSCAN clustering demos
 */

export class CocktailPartyViz {
  constructor(containerId, algorithmConfig) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.config = algorithmConfig;

    // Party animation state
    this.people = [];
    this.originalPeople = [];
    this.conversationCircles = [];
    this.nextCircleId = 1;
    this.isAnimating = false;
    this.animationInterval = null;

    // Dimensions
    this.roomWidth = 20; // meters
    this.roomHeight = 15; // meters
    this.svgWidth = 1700;
    this.svgHeight = 750;
    this.margin = 50;

    // Scales
    this.scaleX = (this.svgWidth - 2 * this.margin) / this.roomWidth;
    this.scaleY = (this.svgHeight - 2 * this.margin) / this.roomHeight;

    // Color palette
    this.colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];
  }

  toScreenX(x) {
    return x * this.scaleX + this.margin;
  }

  toScreenY(y) {
    return y * this.scaleY + this.margin;
  }

  toRoomX(screenX) {
    return (screenX - this.margin) / this.scaleX;
  }

  toRoomY(screenY) {
    return (screenY - this.margin) / this.scaleY;
  }

  async init(dataFile = 'data/cocktail-party-positions.csv') {
    if (!this.container) {
      console.error(`Container ${this.containerId} not found`);
      return;
    }

    this.container.innerHTML = '<p>Loading cocktail party data...</p>';

    // Load CSV data
    const response = await fetch(dataFile);
    const csvText = await response.text();

    const lines = csvText.trim().split('\n');
    this.people = lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        id: parseInt(values[0]),
        x: parseFloat(values[1]),
        y: parseFloat(values[2]),
        trueGroup: parseInt(values[3]),
        vx: 0,
        vy: 0,
        seeking: false,
        targetCircle: null
      };
    });

    this.originalPeople = this.people.map(p => ({ ...p }));

    this.container.innerHTML = '';
    this.buildUI();
    this.render();
  }

  buildUI() {
    // Create controls
    const controls = document.createElement('div');
    controls.style.cssText = 'margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;';

    // Algorithm-specific controls (left side)
    const algoControls = document.createElement('span');
    this.config.createControls(algoControls, this);

    // Animation controls (right side)
    const animateButton = document.createElement('button');
    animateButton.textContent = 'Animate Party';
    animateButton.style.cssText = 'margin-left: 20px; padding: 8px 16px; background: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

    this.animateButton = animateButton;

    animateButton.addEventListener('click', () => {
      this.isAnimating = !this.isAnimating;
      if (this.isAnimating) {
        animateButton.textContent = 'Stop Animation';
        animateButton.style.background = '#f44336';
        this.startPartyAnimation();
      } else {
        animateButton.textContent = 'Animate Party';
        animateButton.style.background = '#9c27b0';
        this.stopPartyAnimation();
      }
    });

    controls.appendChild(algoControls);
    controls.appendChild(animateButton);
    this.container.appendChild(controls);

    // Create main content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = 'display: flex; gap: 20px; align-items: flex-start;';

    // Create rules box on the left
    const rulesBox = document.createElement('div');
    rulesBox.style.cssText = 'width: 280px; flex-shrink: 0; background: #f8f9fa; border: 2px solid #ddd; border-radius: 8px; padding: 20px; font-size: 0.85em; line-height: 1.6;';

    // Let algorithm provide its own info content
    rulesBox.innerHTML = this.config.getInfoBoxContent();

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', this.svgWidth);
    svg.setAttribute('height', this.svgHeight);
    svg.style.cssText = 'background: white; border: 2px solid #ddd; border-radius: 8px; flex: 1;';

    // Add clip path for room boundaries
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', `room-clip-${this.containerId}`);
    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clipRect.setAttribute('x', '0');
    clipRect.setAttribute('y', '0');
    clipRect.setAttribute('width', this.svgWidth);
    clipRect.setAttribute('height', this.svgHeight);
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    svg.appendChild(defs);

    this.svg = svg;

    contentWrapper.appendChild(rulesBox);
    contentWrapper.appendChild(svg);
    this.container.appendChild(contentWrapper);

    // Optional: Add secondary visualization below (e.g., dendrogram)
    if (this.config.createSecondaryViz) {
      const secondaryContainer = document.createElement('div');
      secondaryContainer.style.cssText = 'margin-top: 20px;';
      this.secondaryContainer = secondaryContainer;
      this.container.appendChild(secondaryContainer);
      this.config.createSecondaryViz(secondaryContainer, this);
    }
  }

  render() {
    // Clear SVG (keep only defs element which should be first child)
    const children = Array.from(this.svg.children);
    children.forEach(child => {
      if (child.tagName !== 'defs') {
        this.svg.removeChild(child);
      }
    });

    // Let algorithm render its visualization
    this.config.render(this.svg, this);
  }

  // ============================================================================
  // Party Animation Logic
  // ============================================================================

  startPartyAnimation() {
    if (this.animationInterval) return;

    // Initialize conversation circles from current clusters
    if (this.config.initializeCircles) {
      this.conversationCircles = this.config.initializeCircles(this);
    } else {
      // No circles defined - everyone seeks
      this.conversationCircles = [];
    }

    // Mark people as seeking or in circles based on initialization
    let inCircleCount = 0;
    let seekingCount = 0;

    this.people.forEach(person => {
      const inCircle = this.conversationCircles.some(c => c.members.includes(person.id));
      if (inCircle) {
        person.seeking = false;
        person.targetCircle = null;
        person.vx = 0;
        person.vy = 0;
        inCircleCount++;
      } else {
        person.seeking = true;
        person.targetCircle = this.findBestCircle(person);
        seekingCount++;
      }
    });

    console.log(`Party animation started: ${this.conversationCircles.length} circles, ${inCircleCount} people in circles, ${seekingCount} seeking`);

    this.animationInterval = setInterval(() => {
      this.updatePartyDynamics();
      this.render();
    }, 50);
  }

  stopPartyAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    // Reset people to original positions
    this.people.forEach((person, idx) => {
      person.x = this.originalPeople[idx].x;
      person.y = this.originalPeople[idx].y;
      person.vx = 0;
      person.vy = 0;
      person.seeking = false;
      person.targetCircle = null;
    });

    // Clear conversation circles
    this.conversationCircles = [];

    // Re-render at original positions
    this.render();
  }

  updatePartyDynamics() {
    const dt = 0.05;
    const conversationRadius = 1.5; // meters

    // Update conversation circles (splitting/merging)
    this.updateConversationCircles();

    // Update each person
    this.people.forEach(person => {
      if (person.seeking) {
        // Moving to join a circle
        if (person.targetCircle) {
          const circle = this.conversationCircles.find(c => c.id === person.targetCircle);
          if (circle) {
            const dx = circle.x - person.x;
            const dy = circle.y - person.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < conversationRadius) {
              // Joined the circle
              person.seeking = false;
              person.targetCircle = null;
              person.vx = 0;
              person.vy = 0;
              circle.members.push(person.id);
            } else {
              // Move toward circle at moderate speed
              const speed = 1.2; // m/s
              person.vx = (dx / dist) * speed;
              person.vy = (dy / dist) * speed;
            }
          }
        } else {
          // Random walk if no target
          person.vx += (Math.random() - 0.5) * 0.3;
          person.vy += (Math.random() - 0.5) * 0.3;
        }
      } else {
        // In a conversation circle
        const circle = this.conversationCircles.find(c => c.members.includes(person.id));
        if (circle) {
          // Random chance to leave based on circle size
          const leaveProb = this.getLeaveProb(circle.members.length);
          if (Math.random() < leaveProb) {
            circle.members = circle.members.filter(id => id !== person.id);
            person.seeking = true;
            person.targetCircle = this.findBestCircle(person);
          } else {
            // Gentle swaying in circle
            person.vx += (Math.random() - 0.5) * 0.15;
            person.vy += (Math.random() - 0.5) * 0.15;

            // Pull toward circle center to maintain formation
            const dx = circle.x - person.x;
            const dy = circle.y - person.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > conversationRadius * 0.5) {
              person.vx += (dx / dist) * 0.3;
              person.vy += (dy / dist) * 0.3;
            }
          }
        } else {
          // Not in any circle - seek one
          person.seeking = true;
          person.targetCircle = this.findBestCircle(person);
        }
      }

      // Personal space repulsion
      this.people.forEach(other => {
        if (other.id === person.id) return;
        const dx = person.x - other.x;
        const dy = person.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.5 && dist > 0.01) {
          const push = 0.2 / dist;
          person.vx += (dx / dist) * push;
          person.vy += (dy / dist) * push;
        }
      });

      // Speed limit
      const speed = Math.sqrt(person.vx * person.vx + person.vy * person.vy);
      const maxSpeed = 1.5; // m/s
      if (speed > maxSpeed) {
        person.vx = (person.vx / speed) * maxSpeed;
        person.vy = (person.vy / speed) * maxSpeed;
      }

      // Update position
      person.x += person.vx * dt;
      person.y += person.vy * dt;

      // Boundary constraints
      person.x = Math.max(1, Math.min(this.roomWidth - 1, person.x));
      person.y = Math.max(1, Math.min(this.roomHeight - 1, person.y));

      // Moderate damping
      person.vx *= 0.92;
      person.vy *= 0.92;
    });
  }

  updateConversationCircles() {
    // Recalculate circle centers
    this.conversationCircles.forEach(circle => {
      const members = this.people.filter(p => circle.members.includes(p.id));
      if (members.length > 0) {
        circle.x = members.reduce((sum, p) => sum + p.x, 0) / members.length;
        circle.y = members.reduce((sum, p) => sum + p.y, 0) / members.length;
      }
    });

    // Split large circles
    this.conversationCircles = this.conversationCircles.flatMap(circle => {
      if (circle.members.length >= 7) {
        // Split into two circles
        const half = Math.floor(circle.members.length / 2);
        const members1 = circle.members.slice(0, half);
        const members2 = circle.members.slice(half);

        const people1 = this.people.filter(p => members1.includes(p.id));
        const people2 = this.people.filter(p => members2.includes(p.id));

        return [
          {
            id: circle.id,
            members: members1,
            x: people1.reduce((sum, p) => sum + p.x, 0) / people1.length,
            y: people1.reduce((sum, p) => sum + p.y, 0) / people1.length
          },
          {
            id: this.nextCircleId++,
            members: members2,
            x: people2.reduce((sum, p) => sum + p.x, 0) / people2.length,
            y: people2.reduce((sum, p) => sum + p.y, 0) / people2.length
          }
        ];
      }
      return [circle];
    });

    // Merge small nearby circles
    for (let i = 0; i < this.conversationCircles.length; i++) {
      for (let j = i + 1; j < this.conversationCircles.length; j++) {
        const c1 = this.conversationCircles[i];
        const c2 = this.conversationCircles[j];
        const dist = Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2));

        if (dist < 2 && c1.members.length + c2.members.length <= 6) {
          // Merge circles
          c1.members = [...c1.members, ...c2.members];
          const allMembers = this.people.filter(p => c1.members.includes(p.id));
          c1.x = allMembers.reduce((sum, p) => sum + p.x, 0) / allMembers.length;
          c1.y = allMembers.reduce((sum, p) => sum + p.y, 0) / allMembers.length;
          this.conversationCircles.splice(j, 1);
          j--;
        }
      }
    }

    // Remove empty circles
    this.conversationCircles = this.conversationCircles.filter(c => c.members.length > 0);
  }

  getLeaveProb(circleSize) {
    if (circleSize <= 2) return 0.0005;
    if (circleSize <= 4) return 0.001;
    if (circleSize <= 6) return 0.002;
    return 0.01;
  }

  findBestCircle(person) {
    if (this.conversationCircles.length === 0) return null;

    // Prefer circles with 4-6 members, avoid large circles
    const scores = this.conversationCircles.map(circle => {
      const dist = Math.sqrt(Math.pow(person.x - circle.x, 2) + Math.pow(person.y - circle.y, 2));
      const sizeScore = circle.members.length >= 4 && circle.members.length <= 6 ? 2 : 1;
      const distScore = 1 / (dist + 0.5);
      return { circle, score: sizeScore * distScore };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0].circle.id;
  }

  // Helper to draw people as circles
  drawPeople(svg, assignments = null) {
    this.people.forEach(person => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', this.toScreenX(person.x));
      circle.setAttribute('cy', this.toScreenY(person.y));
      circle.setAttribute('r', '6');

      if (assignments) {
        const clusterIdx = assignments[person.id] || 0;
        circle.setAttribute('fill', this.colors[clusterIdx % this.colors.length]);
      } else {
        circle.setAttribute('fill', '#3498db');
      }

      circle.setAttribute('stroke', 'white');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('opacity', '0.8');

      svg.appendChild(circle);
    });
  }
}
