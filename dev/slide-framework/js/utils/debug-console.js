/**
 * On-screen debug console for mobile debugging
 *
 * Shows console.log, console.error, and console.warn messages
 * directly on the page in a draggable overlay.
 */

export class DebugConsole {
  constructor(options = {}) {
    this.maxMessages = options.maxMessages || 50;
    this.position = options.position || 'bottom-right';
    this.messages = [];
    this.isMinimized = false;

    this._createUI();
    this._interceptConsole();
  }

  _createUI() {
    // Container
    this.container = document.createElement('div');
    this.container.className = 'debug-console';
    this.container.style.cssText = `
      position: fixed;
      ${this.position.includes('bottom') ? 'bottom: 10px;' : 'top: 10px;'}
      ${this.position.includes('right') ? 'right: 10px;' : 'left: 10px;'}
      width: 90%;
      max-width: 500px;
      max-height: 300px;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #00ff00;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      background: #00ff00;
      color: #000;
      padding: 8px 12px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      user-select: none;
    `;
    header.innerHTML = `
      <span>🐛 Debug Console</span>
      <div>
        <button id="debug-copy" style="margin-right: 5px; padding: 2px 8px; cursor: pointer;">📋</button>
        <button id="debug-clear" style="margin-right: 5px; padding: 2px 8px; cursor: pointer;">Clear</button>
        <button id="debug-minimize" style="padding: 2px 8px; cursor: pointer;">−</button>
      </div>
    `;
    this.container.appendChild(header);

    // Messages container
    this.messagesEl = document.createElement('div');
    this.messagesEl.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      color: #00ff00;
      line-height: 1.4;
    `;
    this.container.appendChild(this.messagesEl);

    // Add to page
    document.body.appendChild(this.container);

    // Event listeners
    document.getElementById('debug-copy').addEventListener('click', () => this.copyToClipboard());
    document.getElementById('debug-clear').addEventListener('click', () => this.clear());
    document.getElementById('debug-minimize').addEventListener('click', () => this.toggle());

    // Make draggable
    this._makeDraggable(header);

    this.log('Debug console initialized');
  }

  _makeDraggable(handle) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY;

    handle.addEventListener('touchstart', (e) => {
      initialX = e.touches[0].clientX;
      initialY = e.touches[0].clientY;

      const rect = this.container.getBoundingClientRect();
      currentX = rect.left;
      currentY = rect.top;

      isDragging = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;

      e.preventDefault();

      const dx = e.touches[0].clientX - initialX;
      const dy = e.touches[0].clientY - initialY;

      this.container.style.left = `${currentX + dx}px`;
      this.container.style.top = `${currentY + dy}px`;
      this.container.style.right = 'auto';
      this.container.style.bottom = 'auto';
    });

    document.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  _interceptConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog.apply(console, args);
      this.log(args.join(' '));
    };

    console.error = (...args) => {
      originalError.apply(console, args);
      this.error(args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn.apply(console, args);
      this.warn(args.join(' '));
    };
  }

  _addMessage(message, type = 'log') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      log: '#00ff00',
      error: '#ff0000',
      warn: '#ffaa00'
    };

    this.messages.push({ message, type, timestamp });

    // Limit messages
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    const msgEl = document.createElement('div');
    msgEl.style.cssText = `
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 255, 0, 0.2);
      color: ${colors[type]};
    `;
    msgEl.innerHTML = `
      <span style="opacity: 0.6;">[${timestamp}]</span> ${this._escapeHtml(message)}
    `;

    this.messagesEl.appendChild(msgEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  log(message) {
    this._addMessage(message, 'log');
  }

  error(message) {
    this._addMessage(message, 'error');
  }

  warn(message) {
    this._addMessage(message, 'warn');
  }

  async copyToClipboard() {
    const text = this.messages.map(m => `[${m.timestamp}] ${m.message}`).join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        this.log('✓ Copied to clipboard');
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.log('✓ Copied to clipboard (fallback)');
      }
    } catch (err) {
      this.error('Failed to copy: ' + err.message);
    }
  }

  clear() {
    this.messages = [];
    this.messagesEl.innerHTML = '';
    this.log('Console cleared');
  }

  toggle() {
    this.isMinimized = !this.isMinimized;
    this.messagesEl.style.display = this.isMinimized ? 'none' : 'block';
    document.getElementById('debug-minimize').textContent = this.isMinimized ? '+' : '−';
  }

  destroy() {
    this.container.remove();
  }
}

// Initialize debug console when URL has ?debug parameter
export function initDebugConsole() {
  // Only enable when URL has ?debug parameter
  const hasDebugParam = window.location.search.includes('debug');

  if (hasDebugParam) {
    window.debugConsole = new DebugConsole();
    console.log('Debug console enabled via URL parameter');
  }
}
