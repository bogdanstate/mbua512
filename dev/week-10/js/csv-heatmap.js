/**
 * CSV Heatmap Generator
 * Loads pre-computed similarity matrices from CSV and renders interactive heatmaps
 */

export async function initCSVHeatmap(containerId, options = {}) {
  const {
    dataFile = 'data/jaccard-matrix.csv',
    title = 'Heatmap',
    subtitle = '',
    colorScheme = 'reds', // 'reds', 'blues', 'oranges'
    width = 900,
    height = 800,
    fontSize = 11,
    excludeDiagonal = false,
    selectiveLabels = null  // Array of club names to label, or null for all
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Create loading indicator
  container.innerHTML = `
    <div style="text-align: center; padding: 50px; color: #ddd;">
      <p>Loading visualization...</p>
    </div>
  `;

  try {
    // Fetch and parse CSV
    const response = await fetch(dataFile);
    const csvText = await response.text();
    const data = parseCSV(csvText);

    // Render heatmap
    renderHeatmap(container, data, { title, subtitle, colorScheme, width, height, fontSize, excludeDiagonal, selectiveLabels });

  } catch (error) {
    console.error('Error loading heatmap:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #ff6b6b;">
        <p>Error loading visualization</p>
      </div>
    `;
  }
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').slice(1); // Skip first column header
  const labels = [];
  const matrix = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    labels.push(parts[0].replace(/^"|"$/g, '')); // Remove quotes
    matrix.push(parts.slice(1).map(v => parseFloat(v)));
  }

  return { labels, matrix };
}

function renderHeatmap(container, data, options) {
  const { labels, matrix } = data;
  const { title, subtitle, colorScheme, width, height, fontSize, excludeDiagonal, selectiveLabels } = options;

  const n = labels.length;
  const cellSize = Math.min((width - 200) / n, (height - 200) / n);
  const actualWidth = cellSize * n + 200;
  const actualHeight = cellSize * n + 150;

  // Color schemes
  const colorSchemes = {
    reds: ['#fff5f0', '#fee5d9', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#99000d'],
    blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'],
    oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#8c2d04']
  };

  const colors = colorSchemes[colorScheme] || colorSchemes.reds;

  // Get color for value
  function getColor(value) {
    const index = Math.floor(value * (colors.length - 1));
    return colors[Math.max(0, Math.min(index, colors.length - 1))];
  }

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', actualWidth);
  svg.setAttribute('height', actualHeight);
  svg.setAttribute('viewBox', `0 0 ${actualWidth} ${actualHeight}`);
  svg.style.cssText = 'max-width: 100%; height: auto; background: white; border-radius: 8px;';

  // Title
  const titleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  titleText.setAttribute('x', actualWidth / 2);
  titleText.setAttribute('y', 30);
  titleText.setAttribute('text-anchor', 'middle');
  titleText.setAttribute('font-size', '18');
  titleText.setAttribute('font-weight', 'bold');
  titleText.setAttribute('fill', '#2c3e50');
  titleText.textContent = title;
  titleGroup.appendChild(titleText);

  if (subtitle) {
    const subtitleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitleText.setAttribute('x', actualWidth / 2);
    subtitleText.setAttribute('y', 50);
    subtitleText.setAttribute('text-anchor', 'middle');
    subtitleText.setAttribute('font-size', '12');
    subtitleText.setAttribute('fill', '#7f8c8d');
    subtitleText.textContent = subtitle;
    titleGroup.appendChild(subtitleText);
  }
  svg.appendChild(titleGroup);

  // Create heatmap group
  const heatmapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  heatmapGroup.setAttribute('transform', `translate(150, 70)`);

  // Draw cells
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // Skip diagonal if excludeDiagonal is true
      if (excludeDiagonal && i === j) {
        // Draw a light gray cell for diagonal
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', j * cellSize);
        rect.setAttribute('y', i * cellSize);
        rect.setAttribute('width', cellSize);
        rect.setAttribute('height', cellSize);
        rect.setAttribute('fill', '#f5f5f5');
        rect.setAttribute('stroke', '#e0e0e0');
        rect.setAttribute('stroke-width', '0.5');
        heatmapGroup.appendChild(rect);
        continue;
      }

      const value = matrix[i][j];
      const x = j * cellSize;
      const y = i * cellSize;

      // Cell rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', cellSize);
      rect.setAttribute('height', cellSize);
      rect.setAttribute('fill', getColor(value));
      rect.setAttribute('stroke', '#e0e0e0');
      rect.setAttribute('stroke-width', '0.5');

      // Add tooltip
      const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      titleElement.textContent = `${labels[i]} × ${labels[j]}: ${value.toFixed(3)}`;
      rect.appendChild(titleElement);

      heatmapGroup.appendChild(rect);

      // Cell text (only show if cell size is large enough)
      if (cellSize > 15) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + cellSize / 2);
        text.setAttribute('y', y + cellSize / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', Math.max(5, cellSize / 6));
        text.setAttribute('fill', value > 0.5 ? 'white' : 'black');
        text.setAttribute('pointer-events', 'none');
        text.textContent = value.toFixed(2);
        heatmapGroup.appendChild(text);
      }
    }
  }

  // Determine which labels to show
  const shouldShowLabel = (labelText) => {
    if (!selectiveLabels) return true;  // Show all if no selection
    return selectiveLabels.includes(labelText);
  };

  // Row labels
  for (let i = 0; i < n; i++) {
    if (shouldShowLabel(labels[i])) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', -5);
      label.setAttribute('y', i * cellSize + cellSize / 2);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('font-size', fontSize);
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('fill', '#2c3e50');
      label.textContent = labels[i];
      heatmapGroup.appendChild(label);
    } else if (selectiveLabels) {
      // Show tick mark for unlabeled clubs
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', -5);
      tick.setAttribute('y1', i * cellSize + cellSize / 2);
      tick.setAttribute('x2', -2);
      tick.setAttribute('y2', i * cellSize + cellSize / 2);
      tick.setAttribute('stroke', '#ccc');
      tick.setAttribute('stroke-width', '1');
      heatmapGroup.appendChild(tick);
    }
  }

  // Column labels
  for (let j = 0; j < n; j++) {
    if (shouldShowLabel(labels[j])) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', j * cellSize + cellSize / 2);
      label.setAttribute('y', -5);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('font-size', fontSize);
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('fill', '#2c3e50');
      label.setAttribute('transform', `rotate(-45, ${j * cellSize + cellSize / 2}, -5)`);
      label.textContent = labels[j];
      heatmapGroup.appendChild(label);
    } else if (selectiveLabels) {
      // Show tick mark for unlabeled clubs
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', j * cellSize + cellSize / 2);
      tick.setAttribute('y1', -5);
      tick.setAttribute('x2', j * cellSize + cellSize / 2);
      tick.setAttribute('y2', -2);
      tick.setAttribute('stroke', '#ccc');
      tick.setAttribute('stroke-width', '1');
      heatmapGroup.appendChild(tick);
    }
  }

  svg.appendChild(heatmapGroup);

  // Clear container and add SVG
  container.innerHTML = '';
  container.appendChild(svg);
}
