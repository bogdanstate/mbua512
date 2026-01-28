/**
 * RStudio-style Viewport Component
 * 4-panel layout: Code Editor, Plot Viewer, Console Output, Interactive Console
 * Features: resizable panels, maximize/minimize, reusable component
 */

import { WebR } from 'https://cdn.jsdelivr.net/npm/webr@0.2.2/dist/webr.mjs';

// Singleton webR instance
let webRInstance = null;
let webRInitializing = false;

async function getWebR() {
  if (webRInstance) return webRInstance;

  if (webRInitializing) {
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

export async function initRStudioViewport(containerId, options = {}) {
  const {
    dataFile = 'data/injury-runner-sample.csv',
    initialCode = '# Load the data\ndata <- read.csv(\'/data.csv\')\nhead(data)'
  } = options;

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  // Create the RStudio-style layout
  container.innerHTML = `
    <style>
      .rstudio-viewport {
        width: 100%;
        height: 700px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 4px;
        background: #1e1e1e;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
      }

      .rstudio-panel {
        background: #252526;
        border: 1px solid #3e3e42;
        display: flex;
        flex-direction: column;
        position: relative;
        min-width: 0;
        min-height: 0;
      }

      .rstudio-panel.maximized {
        grid-column: 1 / -1;
        grid-row: 1 / -1;
        z-index: 10;
      }

      .rstudio-panel.hidden {
        display: none;
      }

      .rstudio-panel-header {
        background: #2d2d30;
        color: #cccccc;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #3e3e42;
        user-select: none;
      }

      .rstudio-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .rstudio-panel-actions {
        display: flex;
        gap: 4px;
      }

      .rstudio-panel-btn {
        background: transparent;
        border: none;
        color: #cccccc;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
        transition: background 0.2s;
      }

      .rstudio-panel-btn:hover {
        background: #3e3e42;
      }

      .rstudio-panel-content {
        flex: 1;
        overflow: auto;
        padding: 0;
        min-height: 0;
      }

      .rstudio-editor {
        width: 100%;
        height: 100%;
        background: #1e1e1e;
        color: #d4d4d4;
        border: none;
        padding: 12px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        resize: none;
        outline: none;
      }

      .rstudio-plot-viewer {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        overflow: auto;
        padding: 12px;
        box-sizing: border-box;
      }

      .rstudio-plot-viewer img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .rstudio-plot-viewer .placeholder {
        color: #6e6e6e;
        font-size: 14px;
      }

      .rstudio-console {
        width: 100%;
        height: 100%;
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 12px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .rstudio-interactive-console {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .rstudio-console-output {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        background: #1e1e1e;
        color: #d4d4d4;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .rstudio-console-input {
        display: flex;
        align-items: center;
        background: #252526;
        border-top: 1px solid #3e3e42;
        padding: 8px 12px;
      }

      .rstudio-console-prompt {
        color: #4ec9b0;
        margin-right: 8px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
      }

      .rstudio-console-input input {
        flex: 1;
        background: transparent;
        border: none;
        color: #d4d4d4;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        outline: none;
      }

      .rstudio-run-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #0e639c;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        z-index: 5;
        transition: background 0.2s;
      }

      .rstudio-run-btn:hover {
        background: #1177bb;
      }

      .rstudio-run-btn:disabled {
        background: #3e3e42;
        cursor: not-allowed;
      }

      .console-error {
        color: #f48771;
      }

      .console-success {
        color: #4ec9b0;
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .rstudio-viewport {
          grid-template-columns: 1fr;
          grid-template-rows: auto auto auto auto;
          height: auto;
          min-height: 600px;
        }

        .rstudio-panel {
          min-height: 200px;
        }

        .rstudio-run-btn {
          position: static;
          margin: 8px;
        }
      }
    </style>

    <div class="rstudio-viewport">
      <!-- Panel 1: Code Editor -->
      <div class="rstudio-panel" id="${containerId}-editor-panel">
        <div class="rstudio-panel-header">
          <div class="rstudio-panel-title">
            <span>📝</span>
            <span>Code Editor</span>
          </div>
          <div class="rstudio-panel-actions">
            <button class="rstudio-panel-btn" onclick="window.rstudioMaximize('${containerId}-editor-panel')" title="Maximize">⬜</button>
          </div>
        </div>
        <div class="rstudio-panel-content">
          <textarea class="rstudio-editor" id="${containerId}-editor">${initialCode}</textarea>
          <button class="rstudio-run-btn" id="${containerId}-run-btn">
            <span>▶</span>
            <span>Run Code</span>
          </button>
        </div>
      </div>

      <!-- Panel 2: Plot Viewer -->
      <div class="rstudio-panel" id="${containerId}-plot-panel">
        <div class="rstudio-panel-header">
          <div class="rstudio-panel-title">
            <span>📊</span>
            <span>Plots</span>
          </div>
          <div class="rstudio-panel-actions">
            <button class="rstudio-panel-btn" onclick="window.rstudioClearPlot('${containerId}')" title="Clear">✕</button>
            <button class="rstudio-panel-btn" onclick="window.rstudioMaximize('${containerId}-plot-panel')" title="Maximize">⬜</button>
          </div>
        </div>
        <div class="rstudio-panel-content">
          <div class="rstudio-plot-viewer" id="${containerId}-plot">
            <div class="placeholder">No plots yet. Run code to generate plots.</div>
          </div>
        </div>
      </div>

      <!-- Panel 3: Console Output -->
      <div class="rstudio-panel" id="${containerId}-output-panel">
        <div class="rstudio-panel-header">
          <div class="rstudio-panel-title">
            <span>📋</span>
            <span>Console Output</span>
          </div>
          <div class="rstudio-panel-actions">
            <button class="rstudio-panel-btn" onclick="window.rstudioClearConsole('${containerId}')" title="Clear">✕</button>
            <button class="rstudio-panel-btn" onclick="window.rstudioMaximize('${containerId}-output-panel')" title="Maximize">⬜</button>
          </div>
        </div>
        <div class="rstudio-panel-content">
          <div class="rstudio-console" id="${containerId}-console"></div>
        </div>
      </div>

      <!-- Panel 4: Interactive Console -->
      <div class="rstudio-panel" id="${containerId}-interactive-panel">
        <div class="rstudio-panel-header">
          <div class="rstudio-panel-title">
            <span>💬</span>
            <span>R Console</span>
          </div>
          <div class="rstudio-panel-actions">
            <button class="rstudio-panel-btn" onclick="window.rstudioClearInteractive('${containerId}')" title="Clear">✕</button>
            <button class="rstudio-panel-btn" onclick="window.rstudioMaximize('${containerId}-interactive-panel')" title="Maximize">⬜</button>
          </div>
        </div>
        <div class="rstudio-panel-content">
          <div class="rstudio-interactive-console">
            <div class="rstudio-console-output" id="${containerId}-interactive-output"></div>
            <div class="rstudio-console-input">
              <span class="rstudio-console-prompt">&gt;</span>
              <input type="text" id="${containerId}-interactive-input" placeholder="Enter R command...">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Store state
  const state = {
    maximizedPanel: null
  };

  // Global helper functions for panel actions
  window.rstudioMaximize = (panelId) => {
    const panel = document.getElementById(panelId);
    const viewport = panel.closest('.rstudio-viewport');
    const allPanels = viewport.querySelectorAll('.rstudio-panel');

    if (state.maximizedPanel === panelId) {
      // Restore
      allPanels.forEach(p => {
        p.classList.remove('maximized', 'hidden');
      });
      state.maximizedPanel = null;
    } else {
      // Maximize
      allPanels.forEach(p => {
        if (p.id === panelId) {
          p.classList.add('maximized');
          p.classList.remove('hidden');
        } else {
          p.classList.add('hidden');
          p.classList.remove('maximized');
        }
      });
      state.maximizedPanel = panelId;
    }
  };

  window.rstudioClearPlot = (containerId) => {
    const plotViewer = document.getElementById(`${containerId}-plot`);
    plotViewer.innerHTML = '<div class="placeholder">No plots yet. Run code to generate plots.</div>';
  };

  window.rstudioClearConsole = (containerId) => {
    const console = document.getElementById(`${containerId}-console`);
    console.textContent = '';
  };

  window.rstudioClearInteractive = (containerId) => {
    const interactiveOutput = document.getElementById(`${containerId}-interactive-output`);
    interactiveOutput.textContent = '';
  };

  // Get DOM elements
  const editor = document.getElementById(`${containerId}-editor`);
  const runBtn = document.getElementById(`${containerId}-run-btn`);
  const consoleOutput = document.getElementById(`${containerId}-console`);
  const plotViewer = document.getElementById(`${containerId}-plot`);
  const interactiveInput = document.getElementById(`${containerId}-interactive-input`);
  const interactiveOutput = document.getElementById(`${containerId}-interactive-output`);

  // Helper: Append to console
  const appendConsole = (text, className = '') => {
    const line = document.createElement('div');
    if (className) line.className = className;
    line.textContent = text;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  };

  // Helper: Append to interactive console
  const appendInteractive = (text, className = '') => {
    const line = document.createElement('div');
    if (className) line.className = className;
    line.textContent = text;
    interactiveOutput.appendChild(line);
    interactiveOutput.scrollTop = interactiveOutput.scrollHeight;
  };

  // Handle tab key in editor
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
    appendConsole('> Running code...', 'console-success');

    try {
      const webR = await getWebR();

      // Load CSV data if not already loaded
      try {
        await webR.FS.readFile('/data.csv');
      } catch (e) {
        const response = await fetch(dataFile);
        if (!response.ok) throw new Error(`Failed to fetch ${dataFile}`);
        const csvText = await response.text();
        const encoder = new TextEncoder();
        const csvBytes = encoder.encode(csvText);
        await webR.FS.writeFile('/data.csv', csvBytes);
        appendConsole('✓ Dataset loaded', 'console-success');
      }

      // Wrap code to capture plot and output
      const wrappedCode = `
        png('/plot.png', width = 600, height = 400, res = 100, bg = 'white')
        output <- capture.output({
          ${code}
        })
        dev.off()
        writeLines(output, '/output.txt')
      `;

      await webR.evalR(wrappedCode);

      // Get text output
      try {
        const outputData = await webR.FS.readFile('/output.txt');
        const textOutput = new TextDecoder().decode(outputData);
        if (textOutput.trim()) {
          appendConsole(textOutput);
        }
      } catch (e) {
        // No output
      }

      // Check for plot
      try {
        const plotData = await webR.FS.readFile('/plot.png');
        if (plotData && plotData.length > 1000) {
          const blob = new Blob([plotData], { type: 'image/png' });
          const imageUrl = URL.createObjectURL(blob);
          plotViewer.innerHTML = `<img src="${imageUrl}" alt="Plot output">`;
          appendConsole('✓ Plot generated', 'console-success');
        }
      } catch (e) {
        // No plot
      }

      appendConsole('✓ Code executed successfully', 'console-success');
    } catch (error) {
      appendConsole(`✗ Error: ${error.message}`, 'console-error');
    } finally {
      runBtn.disabled = false;
    }
  });

  // Interactive console handler
  interactiveInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const command = interactiveInput.value.trim();
      if (!command) return;

      appendInteractive(`> ${command}`);
      interactiveInput.value = '';

      try {
        const webR = await getWebR();

        // Load data if not loaded
        try {
          await webR.FS.readFile('/data.csv');
        } catch (err) {
          const response = await fetch(dataFile);
          if (response.ok) {
            const csvText = await response.text();
            const encoder = new TextEncoder();
            await webR.FS.writeFile('/data.csv', encoder.encode(csvText));
          }
        }

        // Execute command and capture output
        const result = await webR.evalR(`
          capture.output({
            ${command}
          })
        `);

        const resultData = await result.toArray();
        if (resultData && resultData.length > 0) {
          appendInteractive(resultData.join('\n'));
        } else {
          appendInteractive('(no output)');
        }
      } catch (error) {
        appendInteractive(`Error: ${error.message}`, 'console-error');
      }
    }
  });

  // Initialize message
  appendConsole('R environment ready. Load data with: data <- read.csv(\'/data.csv\')', 'console-success');
  appendInteractive('R console ready. Type commands and press Enter.', 'console-success');
}
