/**
 * K-means Clustering Visualization for Cocktail Party Dataset
 * Interactive demo showing people clustering into conversational groups
 */

export async function initKMeansCocktailParty(containerId, options = {}) {
  const {
    dataFile = 'data/cocktail-party-positions.csv',
    width = 1000,
    height = 750
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  container.innerHTML = '<p>Loading cocktail party data...</p>';

  // Load CSV data
  const response = await fetch(dataFile);
  const csvText = await response.text();

  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const people = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      id: parseInt(values[0]),
      x: parseFloat(values[1]),
      y: parseFloat(values[2]),
      trueGroup: parseInt(values[3])
    };
  });

  container.innerHTML = '';

  // Create controls
  const controls = document.createElement('div');
  controls.style.cssText = 'margin-bottom: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;';

  const kSlider = document.createElement('input');
  kSlider.type = 'range';
  kSlider.min = '2';
  kSlider.max = '8';
  kSlider.value = '5';
  kSlider.style.cssText = 'width: 200px; margin: 0 10px;';

  const kValue = document.createElement('span');
  kValue.textContent = '5';
  kValue.style.cssText = 'font-weight: bold; font-size: 1.1em;';

  const runButton = document.createElement('button');
  runButton.textContent = 'Run K-means';
  runButton.style.cssText = 'margin-left: 20px; padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

  const animateButton = document.createElement('button');
  animateButton.textContent = 'Animate Party';
  animateButton.style.cssText = 'margin-left: 10px; padding: 8px 16px; background: #9c27b0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;';

  const iterationDisplay = document.createElement('span');
  iterationDisplay.style.cssText = 'margin-left: 20px; font-size: 0.9em; color: #666;';

  controls.appendChild(document.createTextNode('Number of clusters (k): '));
  controls.appendChild(kSlider);
  controls.appendChild(kValue);
  controls.appendChild(runButton);
  controls.appendChild(animateButton);
  controls.appendChild(iterationDisplay);
  container.appendChild(controls);

  // Create main content wrapper (SVG on left, rules on right)
  const contentWrapper = document.createElement('div');
  contentWrapper.style.cssText = 'display: flex; gap: 20px; align-items: flex-start;';

  // Create SVG (double width)
  const svgWidth = 1700;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', svgWidth);
  svg.setAttribute('height', height);
  svg.style.cssText = 'background: white; border: 2px solid #ddd; border-radius: 8px; flex-shrink: 0;';

  // Add clip path for room boundaries
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clipPath.setAttribute('id', 'room-clip');
  const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  clipRect.setAttribute('x', '0');
  clipRect.setAttribute('y', '0');
  clipRect.setAttribute('width', svgWidth);
  clipRect.setAttribute('height', height);
  clipPath.appendChild(clipRect);
  defs.appendChild(clipPath);
  svg.appendChild(defs);

  // Scale factors (room is 20x15m)
  const scaleX = (svgWidth - 100) / 20;
  const scaleY = (height - 100) / 15;
  const offsetX = 50;
  const offsetY = 50;

  const toScreenX = (x) => x * scaleX + offsetX;
  const toScreenY = (y) => y * scaleY + offsetY;

  // Create rules box on the left (wider)
  const rulesBox = document.createElement('div');
  rulesBox.style.cssText = 'width: 600px; flex-shrink: 0; background: #f8f9fa; border: 2px solid #ddd; border-radius: 8px; padding: 20px; font-size: 0.9em; line-height: 1.6;';
  rulesBox.innerHTML = `
    <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 1em;">Social Rules</h3>

    <p style="margin: 0 0 3px 0; font-weight: bold; color: #9c27b0;">Formation:</p>
    <p style="margin: 0 0 6px 0;">Target: 6 people<br>Split at 7+<br>Merge if ≤6</p>

    <p style="margin: 0 0 3px 0; font-weight: bold; color: #2a9d8f;">Leaving:</p>
    <p style="margin: 0 0 6px 0;">1-2: 0.05%<br>3-4: 0.1%<br>5-6: 0.2%<br>7+: 1.0%</p>

    <p style="margin: 0 0 3px 0; font-weight: bold; color: #e74c3c;">Movement:</p>
    <p style="margin: 0 0 6px 0;">0.5m bubble<br>Avoid groups<br>Repel circles</p>

    <p style="margin: 0 0 3px 0; font-weight: bold; color: #f39c12;">Joining:</p>
    <p style="margin: 0;">Seek groups<br>Prefer 4-6</p>
  `;

  contentWrapper.appendChild(rulesBox);
  contentWrapper.appendChild(svg);
  container.appendChild(contentWrapper);

  // Color palette for clusters
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];

  let centroids = [];
  let assignments = [];
  let isAnimating = false;
  let animationInterval = null;

  // Store original positions for reset
  const originalPeople = people.map(p => ({ ...p }));

  // Social dynamics state
  let conversationCircles = [];
  let nextCircleId = 1;

  kSlider.addEventListener('input', (e) => {
    kValue.textContent = e.target.value;
  });

  runButton.addEventListener('click', () => {
    const k = parseInt(kSlider.value);
    runKMeans(k);
  });

  animateButton.addEventListener('click', () => {
    isAnimating = !isAnimating;
    if (isAnimating) {
      animateButton.textContent = 'Stop Animation';
      animateButton.style.background = '#f44336';
      startPartyAnimation();
    } else {
      animateButton.textContent = 'Animate Party';
      animateButton.style.background = '#9c27b0';
      stopPartyAnimation();
    }
  });

  function runKMeans(k) {
    // Initialize centroids randomly
    centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPerson = people[Math.floor(Math.random() * people.length)];
      centroids.push({ x: randomPerson.x, y: randomPerson.y });
    }

    let iteration = 0;
    const maxIterations = 20;

    const iterate = () => {
      // Assignment step
      assignments = people.map(person => {
        let minDist = Infinity;
        let cluster = 0;

        centroids.forEach((centroid, i) => {
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
      for (let i = 0; i < k; i++) {
        const clusterPoints = people.filter((_, idx) => assignments[idx] === i);
        if (clusterPoints.length > 0) {
          const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
          const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;
          newCentroids.push({ x: avgX, y: avgY });
        } else {
          newCentroids.push(centroids[i]); // Keep old centroid if cluster is empty
        }
      }

      // Check convergence
      const converged = centroids.every((c, i) =>
        Math.abs(c.x - newCentroids[i].x) < 0.01 &&
        Math.abs(c.y - newCentroids[i].y) < 0.01
      );

      centroids = newCentroids;
      iteration++;

      render();
      iterationDisplay.textContent = `Iteration: ${iteration}${converged ? ' (Converged)' : ''}`;

      if (!converged && iteration < maxIterations) {
        setTimeout(iterate, 1000);
      }
    };

    iterate();
  }

  function drawVoronoi() {
    // Create a grid-based Voronoi diagram by sampling points
    const gridResolution = 20; // pixels per sample
    const roomWidth = 20 * scaleX;
    const roomHeight = 15 * scaleY;

    // Create polygons for each cluster by sampling the space
    const clusterRegions = new Array(centroids.length).fill(null).map(() => []);

    // Sample grid points and assign to nearest centroid
    for (let x = offsetX; x < offsetX + roomWidth; x += gridResolution) {
      for (let y = offsetY; y < offsetY + roomHeight; y += gridResolution) {
        // Convert screen to room coordinates
        const roomX = (x - offsetX) / scaleX;
        const roomY = (y - offsetY) / scaleY;

        // Find nearest centroid
        let minDist = Infinity;
        let nearestCluster = 0;

        centroids.forEach((centroid, i) => {
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

    // Draw Voronoi regions as filled rectangles
    clusterRegions.forEach((region, clusterIdx) => {
      const color = colors[clusterIdx % colors.length];

      region.forEach(point => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', point.x);
        rect.setAttribute('y', point.y);
        rect.setAttribute('width', gridResolution);
        rect.setAttribute('height', gridResolution);
        rect.setAttribute('fill', color);
        rect.setAttribute('opacity', '0.15');
        rect.setAttribute('stroke', 'none');
        svg.appendChild(rect);
      });
    });

    // Draw Voronoi cell boundaries (perpendicular bisectors)
    centroids.forEach((c1, i) => {
      centroids.forEach((c2, j) => {
        if (i >= j) return;

        // Calculate perpendicular bisector between two centroids
        const midX = (c1.x + c2.x) / 2;
        const midY = (c1.y + c2.y) / 2;

        // Direction perpendicular to the line connecting centroids
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const perpDx = -dy;
        const perpDy = dx;

        // Extend the perpendicular line across the entire space
        const scale = 100; // Large enough to cover the room
        const x1 = midX - perpDx * scale;
        const y1 = midY - perpDy * scale;
        const x2 = midX + perpDx * scale;
        const y2 = midY + perpDy * scale;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', toScreenX(x1));
        line.setAttribute('y1', toScreenY(y1));
        line.setAttribute('x2', toScreenX(x2));
        line.setAttribute('y2', toScreenY(y2));
        line.setAttribute('stroke', '#666');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '5,5');
        line.setAttribute('opacity', '0.4');

        // Clip to room boundaries
        line.setAttribute('clip-path', 'url(#room-clip)');
        svg.appendChild(line);
      });
    });
  }

  function startPartyAnimation() {
    // Initialize people state
    people.forEach(person => {
      person.vx = 0;
      person.vy = 0;
      person.circleId = null;
      person.state = 'wandering'; // 'wandering', 'approaching', 'in_circle'
      person.timeInState = 0;
    });

    // Create a few initial conversation circles
    conversationCircles = [];
    for (let i = 0; i < 5; i++) {
      const randomPerson = people[Math.floor(Math.random() * people.length)];
      createCircle(randomPerson.x + (Math.random() - 0.5) * 2, randomPerson.y + (Math.random() - 0.5) * 2);
    }

    animationInterval = setInterval(() => {
      updateSocialDynamics();
      updateMovement();
      render();
    }, 50);
  }

  function createCircle(x, y) {
    conversationCircles.push({
      id: nextCircleId++,
      x: x,
      y: y,
      members: [],
      createdAt: Date.now(),
      repelledCircles: [] // Track circles that recently split from this one
    });
  }

  function updateSocialDynamics() {
    // Remove empty circles
    conversationCircles = conversationCircles.filter(c => c.members.length > 0);

    // Update circle positions (average of members)
    conversationCircles.forEach(circle => {
      if (circle.members.length > 0) {
        circle.x = circle.members.reduce((sum, p) => sum + p.x, 0) / circle.members.length;
        circle.y = circle.members.reduce((sum, p) => sum + p.y, 0) / circle.members.length;
      }
    });

    // Apply repulsion between all circles to prevent overlap
    for (let i = 0; i < conversationCircles.length; i++) {
      for (let j = i + 1; j < conversationCircles.length; j++) {
        const c1 = conversationCircles[i];
        const c2 = conversationCircles[j];

        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calculate radii (same formula as movement)
        const r1 = c1.members.length <= 3 ? 0.3 + c1.members.length * 0.05 : 0.5 + c1.members.length * 0.08;
        const r2 = c2.members.length <= 3 ? 0.3 + c2.members.length * 0.05 : 0.5 + c2.members.length * 0.08;
        const minDist = r1 + r2 + 0.5; // Minimum distance between circle edges

        if (dist < minDist && dist > 0.1) {
          // Push circles apart
          const overlap = minDist - dist;
          const pushForce = overlap * 0.1;
          const pushX = (dx / dist) * pushForce;
          const pushY = (dy / dist) * pushForce;

          c1.x -= pushX * 0.5;
          c1.y -= pushY * 0.5;
          c2.x += pushX * 0.5;
          c2.y += pushY * 0.5;

          // Keep in bounds
          c1.x = Math.max(1, Math.min(19, c1.x));
          c1.y = Math.max(1, Math.min(14, c1.y));
          c2.x = Math.max(1, Math.min(19, c2.x));
          c2.y = Math.max(1, Math.min(14, c2.y));
        }
      }
    }

    // Handle circle splitting (size 7+, optimal is 6)
    conversationCircles.slice().forEach(circle => {
      if (circle.members.length >= 7 && Math.random() < 0.03) {
        splitCircle(circle);
      }
    });

    // Handle circle merging (small nearby circles)
    for (let i = 0; i < conversationCircles.length; i++) {
      for (let j = i + 1; j < conversationCircles.length; j++) {
        const c1 = conversationCircles[i];
        const c2 = conversationCircles[j];

        // Only merge small circles (2-4 people each)
        if (c1.members.length <= 4 && c2.members.length <= 4) {
          const totalSize = c1.members.length + c2.members.length;
          // Only merge if result is size 6 or less (optimal size)
          if (totalSize <= 6) {
            const dx = c2.x - c1.x;
            const dy = c2.y - c1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Merge if very close (within 2m)
            if (dist < 2 && Math.random() < 0.01) {
              mergeCircles(c1, c2);
              break; // Exit inner loop after merge
            }
          }
        }
      }
    }

    // Update each person's behavior
    people.forEach(person => {
      person.timeInState++;

      if (person.state === 'in_circle') {
        const circle = conversationCircles.find(c => c.id === person.circleId);

        // Must stay in conversation for at least 100 time steps (5 seconds) - it's rude to leave immediately!
        const minStayTime = 100;

        // Leave probability inversely proportional to group size - much harder to leave small intimate groups
        if (person.timeInState > minStayTime && circle) {
          const groupSize = circle.members.length;
          let leaveProb;

          if (groupSize <= 2) {
            leaveProb = 0.0005;  // Very sticky - almost never leave a 1-on-1 or pair
          } else if (groupSize <= 4) {
            leaveProb = 0.001;   // Still quite sticky for small groups
          } else if (groupSize <= 6) {
            leaveProb = 0.002;   // Optimal size, moderate stickiness
          } else {
            leaveProb = 0.01;    // Large groups easier to leave
          }

          if (Math.random() < leaveProb) {
            leaveCircle(person);
          }
        }
      } else if (person.state === 'wandering') {
        // Check if person is in a singleton circle (alone)
        const myCircle = conversationCircles.find(c => c.members.includes(person));
        const isSingleton = myCircle && myCircle.members.length === 1;

        // Singletons are more eager to join, others wait longer
        const minWaitTime = isSingleton ? 5 : 20;
        const searchProb = isSingleton ? 0.15 : 0.05;

        // Look for circles to join
        if (person.timeInState > minWaitTime && Math.random() < searchProb) {
          const nearbyCircles = conversationCircles.filter(c => {
            // Don't join your own singleton circle
            if (isSingleton && c === myCircle) return false;

            const dist = Math.sqrt(Math.pow(person.x - c.x, 2) + Math.pow(person.y - c.y, 2));
            return dist < 5 && c.members.length < 8;
          });

          if (nearbyCircles.length > 0) {
            // Prefer larger circles (up to 7 people)
            nearbyCircles.sort((a, b) => b.members.length - a.members.length);
            const targetCircle = nearbyCircles[0];

            // Higher probability to join medium-sized circles (4-6 people)
            const baseProb = isSingleton ? 0.5 : 0.3;
            const sizeBonus = targetCircle.members.length >= 4 && targetCircle.members.length <= 6 ? 0.2 : 0.0;
            const joinProb = Math.min(0.9, baseProb + targetCircle.members.length * 0.1 + sizeBonus);
            if (Math.random() < joinProb) {
              // If in a singleton, leave it first
              if (isSingleton) {
                leaveCircle(person);
              }

              person.state = 'approaching';
              person.targetCircleId = targetCircle.id;
              person.timeInState = 0;
            }
          } else if (!isSingleton && Math.random() < 0.01) {
            // Start a new circle (only if not already in one)
            createCircle(person.x, person.y);
            joinCircle(person, conversationCircles[conversationCircles.length - 1]);
          }
        }
      } else if (person.state === 'approaching') {
        const targetCircle = conversationCircles.find(c => c.id === person.targetCircleId);
        if (targetCircle) {
          const dist = Math.sqrt(Math.pow(person.x - targetCircle.x, 2) + Math.pow(person.y - targetCircle.y, 2));
          if (dist < 1.2) {
            joinCircle(person, targetCircle);
          }
        } else {
          // Circle disappeared
          person.state = 'wandering';
          person.timeInState = 0;
        }
      }
    });
  }

  function splitCircle(circle) {
    if (circle.members.length < 4) return;

    // Split into two groups
    const half = Math.floor(circle.members.length / 2);
    const group1 = circle.members.slice(0, half);
    const group2 = circle.members.slice(half);

    // Create new circle for group2 with offset
    const angle = Math.random() * Math.PI * 2;
    const offset = 3; // meters
    const newCircle = {
      id: nextCircleId++,
      x: circle.x + offset * Math.cos(angle),
      y: circle.y + offset * Math.sin(angle),
      members: [],
      createdAt: Date.now(),
      repelledCircles: [circle.id]
    };

    circle.repelledCircles.push(newCircle.id);
    conversationCircles.push(newCircle);

    // Reassign members
    circle.members = group1;
    group2.forEach(person => {
      person.circleId = newCircle.id;
      newCircle.members.push(person);
    });
  }

  function mergeCircles(circle1, circle2) {
    // Move all members from circle2 to circle1
    circle2.members.forEach(person => {
      person.circleId = circle1.id;
      circle1.members.push(person);
    });

    // Clear circle2 (will be removed by filter)
    circle2.members = [];
  }

  function joinCircle(person, circle) {
    person.state = 'in_circle';
    person.circleId = circle.id;
    person.timeInState = 0;
    circle.members.push(person);
  }

  function leaveCircle(person) {
    const circle = conversationCircles.find(c => c.id === person.circleId);
    if (circle) {
      circle.members = circle.members.filter(p => p !== person);
    }
    person.state = 'wandering';
    person.circleId = null;
    person.timeInState = 0;
  }

  function updateMovement() {
    people.forEach(person => {
      let targetX, targetY;

      if (person.state === 'in_circle') {
        // Stand in circle around the center
        const circle = conversationCircles.find(c => c.id === person.circleId);
        if (circle) {
          const memberIndex = circle.members.indexOf(person);
          const totalMembers = circle.members.length;
          const angle = (memberIndex / totalMembers) * Math.PI * 2 + Date.now() / 10000; // Slow rotation
          // Very tight circles for 2-3 people, gradually larger for more
          const radius = totalMembers <= 3 ? 0.3 + totalMembers * 0.05 : 0.5 + totalMembers * 0.08;

          targetX = circle.x + radius * Math.cos(angle);
          targetY = circle.y + radius * Math.sin(angle);

          // Apply repulsion from recently split circles
          circle.repelledCircles.forEach(repelledId => {
            const repelled = conversationCircles.find(c => c.id === repelledId);
            if (repelled) {
              const dx = circle.x - repelled.x;
              const dy = circle.y - repelled.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 5) {
                const repelForce = 0.05;
                circle.x += (dx / dist) * repelForce;
                circle.y += (dy / dist) * repelForce;
              }
            }
          });
        } else {
          person.state = 'wandering';
          targetX = person.x + (Math.random() - 0.5) * 4;
          targetY = person.y + (Math.random() - 0.5) * 4;
        }
      } else if (person.state === 'approaching') {
        const targetCircle = conversationCircles.find(c => c.id === person.targetCircleId);
        if (targetCircle) {
          targetX = targetCircle.x;
          targetY = targetCircle.y;
        } else {
          person.state = 'wandering';
          targetX = person.x + (Math.random() - 0.5) * 4;
          targetY = person.y + (Math.random() - 0.5) * 4;
        }
      } else {
        // Wandering - random walk
        if (!person.targetX || Math.random() < 0.02) {
          person.targetX = Math.random() * 18 + 1;
          person.targetY = Math.random() * 13 + 1;
        }
        targetX = person.targetX;
        targetY = person.targetY;
      }

      // Move towards target
      let dx = targetX - person.x;
      let dy = targetY - person.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Apply avoidance forces from conversation circles (if wandering or approaching)
      if (person.state !== 'in_circle') {
        conversationCircles.forEach(circle => {
          if (circle.members.length > 0) {
            const circleRadius = circle.members.length <= 3 ? 0.3 + circle.members.length * 0.05 : 0.5 + circle.members.length * 0.08;
            const avoidRadius = circleRadius + 0.8; // Give extra space to avoid

            const circleDx = person.x - circle.x;
            const circleDy = person.y - circle.y;
            const circleDist = Math.sqrt(circleDx * circleDx + circleDy * circleDy);

            if (circleDist < avoidRadius && circleDist > 0.1) {
              // Push away from circle
              const avoidForce = (avoidRadius - circleDist) / avoidRadius * 0.15;
              dx += (circleDx / circleDist) * avoidForce;
              dy += (circleDy / circleDist) * avoidForce;
            }
          }
        });
      }

      // Apply personal space avoidance from other people
      people.forEach(other => {
        if (other === person) return;

        const otherDx = person.x - other.x;
        const otherDy = person.y - other.y;
        const otherDist = Math.sqrt(otherDx * otherDx + otherDy * otherDy);

        // Personal space bubble of 0.5m
        const personalSpace = 0.5;

        if (otherDist < personalSpace && otherDist > 0.1) {
          // Push away from other person
          const avoidForce = (personalSpace - otherDist) / personalSpace * 0.2;
          dx += (otherDx / otherDist) * avoidForce;
          dy += (otherDy / otherDist) * avoidForce;
        }
      });

      const finalDist = Math.sqrt(dx * dx + dy * dy);
      if (finalDist > 0.1) {
        const accel = person.state === 'in_circle' ? 0.03 : 0.02;
        person.vx += (dx / finalDist) * accel;
        person.vy += (dy / finalDist) * accel;
      }

      // Damping
      person.vx *= 0.92;
      person.vy *= 0.92;

      // Update position
      person.x += person.vx;
      person.y += person.vy;

      // Keep in bounds
      person.x = Math.max(0.5, Math.min(19.5, person.x));
      person.y = Math.max(0.5, Math.min(14.5, person.y));
    });
  }

  function stopPartyAnimation() {
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
    }
  }

  function render() {
    svg.innerHTML = '';

    // Draw room boundaries
    const room = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    room.setAttribute('x', offsetX);
    room.setAttribute('y', offsetY);
    room.setAttribute('width', 20 * scaleX);
    room.setAttribute('height', 15 * scaleY);
    room.setAttribute('fill', '#fafafa');
    room.setAttribute('stroke', '#999');
    room.setAttribute('stroke-width', '2');
    svg.appendChild(room);

    // Draw Voronoi diagram if centroids exist
    if (centroids.length > 0) {
      drawVoronoi();
    }

    // Draw conversation circles (if animating)
    if (isAnimating) {
      conversationCircles.forEach(circle => {
        if (circle.members.length > 0) {
          const radius = circle.members.length <= 3 ? 0.3 + circle.members.length * 0.05 : 0.5 + circle.members.length * 0.08;
          const circleEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circleEl.setAttribute('cx', toScreenX(circle.x));
          circleEl.setAttribute('cy', toScreenY(circle.y));
          circleEl.setAttribute('r', radius * scaleX);
          circleEl.setAttribute('fill', 'none');
          circleEl.setAttribute('stroke', '#2196f3');
          circleEl.setAttribute('stroke-width', '2');
          circleEl.setAttribute('stroke-dasharray', '5,5');
          circleEl.setAttribute('opacity', '0.4');
          svg.appendChild(circleEl);

          // Add text showing circle size
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', toScreenX(circle.x));
          text.setAttribute('y', toScreenY(circle.y));
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('font-size', '11');
          text.setAttribute('fill', '#2196f3');
          text.setAttribute('font-weight', 'bold');
          text.textContent = circle.members.length;
          svg.appendChild(text);
        }
      });
    }

    // Draw people
    people.forEach((person, idx) => {
      const cluster = assignments[idx] !== undefined ? assignments[idx] : -1;
      const color = cluster >= 0 ? colors[cluster % colors.length] : '#999';

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', toScreenX(person.x));
      circle.setAttribute('cy', toScreenY(person.y));
      circle.setAttribute('r', '6');
      circle.setAttribute('fill', color);
      circle.setAttribute('stroke', '#333');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('opacity', '0.8');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      let tooltipText = `Person ${person.id}\nPosition: (${person.x.toFixed(1)}, ${person.y.toFixed(1)})m`;
      if (cluster >= 0) {
        tooltipText += `\nK-means cluster: ${cluster + 1}`;
      }
      if (isAnimating && person.state) {
        tooltipText += `\nState: ${person.state}`;
        if (person.circleId) {
          const circle = conversationCircles.find(c => c.id === person.circleId);
          tooltipText += `\nCircle size: ${circle ? circle.members.length : '?'}`;
        }
      }
      title.textContent = tooltipText;
      circle.appendChild(title);

      svg.appendChild(circle);
    });

    // Draw centroids
    centroids.forEach((centroid, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      // Centroid marker (cross)
      const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line1.setAttribute('x1', toScreenX(centroid.x) - 10);
      line1.setAttribute('y1', toScreenY(centroid.y));
      line1.setAttribute('x2', toScreenX(centroid.x) + 10);
      line1.setAttribute('y2', toScreenY(centroid.y));
      line1.setAttribute('stroke', colors[i % colors.length]);
      line1.setAttribute('stroke-width', '3');

      const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line2.setAttribute('x1', toScreenX(centroid.x));
      line2.setAttribute('y1', toScreenY(centroid.y) - 10);
      line2.setAttribute('x2', toScreenX(centroid.x));
      line2.setAttribute('y2', toScreenY(centroid.y) + 10);
      line2.setAttribute('stroke', colors[i % colors.length]);
      line2.setAttribute('stroke-width', '3');

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `Centroid ${i + 1}\nPosition: (${centroid.x.toFixed(2)}, ${centroid.y.toFixed(2)})m`;

      g.appendChild(line1);
      g.appendChild(line2);
      g.appendChild(title);
      svg.appendChild(g);
    });

    // Legend removed - visualization is self-explanatory with tooltips
  }

  // Initial render
  render();
  iterationDisplay.textContent = 'Click "Run K-means" to start clustering';
}
