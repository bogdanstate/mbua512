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

      // Execute user code
      await webR.evalR(code);

      // Check for plot output
      let hasPlot = false;
      try {
        await webR.FS.readFile('/plot.png');
        hasPlot = true;
      } catch (e) {
        // No plot generated
      }

      if (hasPlot) {
        // Display plot
        const pngData = await webR.FS.readFile('/plot.png');
        const blob = new Blob([pngData], { type: 'image/png' });
        const imageUrl = URL.createObjectURL(blob);

        output.innerHTML = `
          <img src="${imageUrl}" alt="Plot output" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          <button class="cluster-editor__back-btn" onclick="this.parentElement.style.display='none'; document.getElementById('${containerId}-editor').style.display='block'">← Back to Code</button>
        `;
        output.style.display = 'flex';
        editor.style.display = 'none';
      } else {
        // Try to get text output
        let textOutput = 'Code executed successfully (no output)';
        try {
          const result = await webR.evalR(`
            capture.output({
              ${code}
            })
          `);
          const resultData = await result.toArray();
          if (resultData && resultData.length > 0) {
            textOutput = resultData.join('\n');
          }
        } catch (e) {
          console.log('No text output');
        }

        output.innerHTML = `
          <pre class="r-text-output">${textOutput}</pre>
          <button class="cluster-editor__back-btn" onclick="this.parentElement.style.display='none'; document.getElementById('${containerId}-editor').style.display='block'">← Back to Code</button>
        `;
        output.style.display = 'block';
        output.classList.add('text-output');
        editor.style.display = 'none';
      }

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
