/**
 * WebR Cluster Analysis Smart Plot Editor
 * Interactive R code editor with Run button for cluster analysis
 */

// Import WebR from CDN
import { WebR } from 'https://cdn.jsdelivr.net/npm/webr@0.2.2/dist/webr.mjs';

// Singleton webR instance
let webRInstance = null;
let webRInitializing = false;

async function getWebR() {
  if (webRInstance) return webRInstance;

  if (webRInitializing) {
    // Wait for initialization to complete
    while (webRInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return webRInstance;
  }

  webRInitializing = true;
  webRInstance = new WebR();
  await webRInstance.init();
  await webRInstance.installPackages(['cluster']);
  webRInitializing = false;

  return webRInstance;
}

export async function initWebRClusterEditor(containerId, options = {}) {
  const {
    dataFile = 'data/injury-runner-sample.csv',
    initialCode = ''
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Create the smart plot interface
  container.innerHTML = `
    <div class="cluster-editor">
      <div class="cluster-editor__header">
        <span class="cluster-editor__title">R Code Editor</span>
        <button class="cluster-editor__btn" id="${containerId}-run-btn">
          <span class="icon">▶</span>
          <span>Run Code</span>
        </button>
      </div>
      <div class="cluster-editor__content">
        <textarea class="cluster-editor__editor" id="${containerId}-editor">${initialCode}</textarea>
        <div class="cluster-editor__output" id="${containerId}-output"></div>
      </div>
      <div class="cluster-editor__status" id="${containerId}-status">Ready to run</div>
    </div>
  `;

  const editor = document.getElementById(`${containerId}-editor`);
  const output = document.getElementById(`${containerId}-output`);
  const statusBar = document.getElementById(`${containerId}-status`);
  const runBtn = document.getElementById(`${containerId}-run-btn`);

  // Handle tab key in textarea
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
    }
  });

  // Run button handler
  runBtn.addEventListener('click', async () => {
    const code = editor.value;

    runBtn.disabled = true;
    statusBar.textContent = '⏳ Initializing webR...';
    statusBar.className = 'cluster-editor__status loading';
    output.style.display = 'none';
    editor.style.display = 'block';

    try {
      // Get or initialize webR
      const webR = await getWebR();
      statusBar.textContent = '⏳ Loading dataset...';

      // Load CSV data
      const response = await fetch(dataFile);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${dataFile}`);
      }
      const csvText = await response.text();
      const encoder = new TextEncoder();
      const csvBytes = encoder.encode(csvText);
      await webR.FS.writeFile('/data.csv', csvBytes);

      statusBar.textContent = '⏳ Running R code...';

      // Wrap user code to capture both plot and text output
      const wrappedCode = `
        # Start PNG device to capture any plots
        png('/plot.png', width = 1200, height = 800, res = 100, bg = '#1e1e1e')

        # Capture text output as well
        output <- capture.output({
          # Execute user code
          ${code}
        })

        # Close device
        dev.off()

        # Save text output
        writeLines(output, '/output.txt')
      `;

      // Execute wrapped code
      await webR.evalR(wrappedCode);

      // Check for plot output
      let hasPlot = false;
      try {
        const plotData = await webR.FS.readFile('/plot.png');
        // Check if PNG has actual content (more than just empty PNG header)
        hasPlot = plotData && plotData.length > 1000;
      } catch (e) {
        // No plot generated
      }

      // Get text output
      let textOutput = '';
      try {
        const outputData = await webR.FS.readFile('/output.txt');
        textOutput = new TextDecoder().decode(outputData);
      } catch (e) {
        console.log('No text output');
      }

      // Build output display
      let outputHTML = '';

      if (hasPlot) {
        // Display plot
        const pngData = await webR.FS.readFile('/plot.png');
        const blob = new Blob([pngData], { type: 'image/png' });
        const imageUrl = URL.createObjectURL(blob);

        outputHTML += `
          <img src="${imageUrl}" alt="Plot output" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); margin-bottom: 20px;">
        `;
      }

      if (textOutput && textOutput.trim()) {
        // Display text output
        outputHTML += `
          <pre class="r-text-output" style="background: #2e2e2e; color: #e0e0e0; padding: 15px; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', monospace; font-size: 0.85em;">${textOutput}</pre>
        `;
      }

      if (!outputHTML) {
        outputHTML = '<p style="color: #888;">Code executed successfully (no output)</p>';
      }

      outputHTML += `
        <button class="cluster-editor__back-btn" onclick="this.parentElement.style.display='none'; document.getElementById('${containerId}-editor').style.display='block'">← Back to Code</button>
      `;

      output.innerHTML = outputHTML;
      output.style.display = 'flex';
      editor.style.display = 'none';

      statusBar.textContent = '✓ Code executed successfully';
      statusBar.className = 'cluster-editor__status success';

    } catch (error) {
      console.error('WebR error:', error);
      statusBar.textContent = `✗ Error: ${error.message}`;
      statusBar.className = 'cluster-editor__status error';

      output.innerHTML = `
        <pre class="r-text-output error">${error.message}</pre>
        <button class="cluster-editor__back-btn" onclick="this.parentElement.style.display='none'; document.getElementById('${containerId}-editor').style.display='block'">← Back to Code</button>
      `;
      output.style.display = 'block';
      output.classList.add('text-output');
      editor.style.display = 'none';
    } finally {
      runBtn.disabled = false;
    }
  });
}
