/**
 * Chihuahua Detector
 *
 * Humorous example applying confusion matrix metrics
 * to a "chihuahua vs muffin" classifier.
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <style>
      .chihuahua-container { cursor: pointer; }
      .chihuahua-container:hover .tail { animation: wagTail 0.2s ease-in-out infinite alternate; }
      .chihuahua-container:hover .front-leg { animation: moveFrontLeg 0.3s ease-in-out infinite alternate; }
      .chihuahua-container:hover .back-leg { animation: moveBackLeg 0.3s ease-in-out infinite alternate-reverse; }
      .chihuahua-container:hover .ear-left { animation: wiggleEar 0.4s ease-in-out infinite alternate; }
      .chihuahua-container:hover .ear-right { animation: wiggleEar 0.4s ease-in-out infinite alternate-reverse; }
      @keyframes wagTail {
        0% { transform: rotate(-20deg); }
        100% { transform: rotate(30deg); }
      }
      @keyframes moveFrontLeg {
        0% { transform: rotate(-15deg); }
        100% { transform: rotate(15deg); }
      }
      @keyframes moveBackLeg {
        0% { transform: rotate(-10deg); }
        100% { transform: rotate(10deg); }
      }
      @keyframes wiggleEar {
        0% { transform: rotate(-5deg); }
        100% { transform: rotate(5deg); }
      }
    </style>
    <h2 style="font-size: 2.2em; color: #1a1a2e; font-weight: 400; margin-bottom: 5px; text-align: center;">Chihuahua Detector</h2>
    <p style="font-size: 1.1em; color: #666; margin-bottom: 10px; text-align: center;">Testing our model on 100 images (10 chihuahuas, 90 muffins)</p>
    <div style="display: flex; justify-content: center; align-items: flex-start; gap: 30px;">
      <!-- Animated Chihuahua -->
      <div class="chihuahua-container" style="padding-top: 30px;">
        <svg width="140" height="180" viewBox="0 0 140 180">
          <!-- Body -->
          <ellipse cx="70" cy="110" rx="35" ry="28" fill="#d4a574"/>
          <!-- Back leg -->
          <g class="back-leg" style="transform-origin: 45px 125px;">
            <rect x="40" y="125" width="12" height="35" rx="5" fill="#c4956a"/>
            <ellipse cx="46" cy="162" rx="8" ry="5" fill="#b8896a"/>
          </g>
          <!-- Back leg 2 -->
          <g class="back-leg" style="transform-origin: 85px 125px;">
            <rect x="80" y="125" width="12" height="35" rx="5" fill="#c4956a"/>
            <ellipse cx="86" cy="162" rx="8" ry="5" fill="#b8896a"/>
          </g>
          <!-- Front leg -->
          <g class="front-leg" style="transform-origin: 50px 115px;">
            <rect x="45" y="115" width="10" height="40" rx="4" fill="#d4a574"/>
            <ellipse cx="50" cy="157" rx="7" ry="4" fill="#c4956a"/>
          </g>
          <!-- Front leg 2 -->
          <g class="front-leg" style="transform-origin: 82px 115px;">
            <rect x="77" y="115" width="10" height="40" rx="4" fill="#d4a574"/>
            <ellipse cx="82" cy="157" rx="7" ry="4" fill="#c4956a"/>
          </g>
          <!-- Tail -->
          <g class="tail" style="transform-origin: 30px 100px;">
            <path d="M 30 100 Q 10 85 15 65" stroke="#d4a574" stroke-width="8" fill="none" stroke-linecap="round"/>
          </g>
          <!-- Head -->
          <circle cx="70" cy="55" r="30" fill="#d4a574"/>
          <!-- Ear left -->
          <g class="ear-left" style="transform-origin: 48px 35px;">
            <path d="M 48 35 L 35 10 L 55 25 Z" fill="#d4a574"/>
            <path d="M 48 33 L 40 18 L 52 28 Z" fill="#e8b894"/>
          </g>
          <!-- Ear right -->
          <g class="ear-right" style="transform-origin: 92px 35px;">
            <path d="M 92 35 L 105 10 L 85 25 Z" fill="#d4a574"/>
            <path d="M 92 33 L 100 18 L 88 28 Z" fill="#e8b894"/>
          </g>
          <!-- Snout -->
          <ellipse cx="70" cy="65" rx="12" ry="10" fill="#e8c9a8"/>
          <!-- Nose -->
          <ellipse cx="70" cy="60" rx="5" ry="4" fill="#333"/>
          <!-- Eyes -->
          <circle cx="58" cy="50" r="8" fill="#fff"/>
          <circle cx="82" cy="50" r="8" fill="#fff"/>
          <circle cx="58" cy="50" r="5" fill="#333"/>
          <circle cx="82" cy="50" r="5" fill="#333"/>
          <circle cx="56" cy="48" r="2" fill="#fff"/>
          <circle cx="80" cy="48" r="2" fill="#fff"/>
          <!-- Mouth -->
          <path d="M 65 70 Q 70 75 75 70" stroke="#333" stroke-width="2" fill="none"/>
        </svg>
        <p style="text-align: center; font-size: 0.85em; color: #888; margin-top: 5px;">Hover me!</p>
      </div>

      <!-- Confusion Matrix -->
      <svg width="520" height="420" viewBox="0 0 520 420">
        <!-- Title -->
        <text x="310" y="30" text-anchor="middle" font-size="20" font-weight="600" fill="#333">Predicted</text>

        <!-- Column headers -->
        <text x="220" y="65" text-anchor="middle" font-size="18" fill="#333">Chihuahua</text>
        <text x="390" y="65" text-anchor="middle" font-size="18" fill="#333">Muffin</text>

        <!-- Row label (rotated) -->
        <text x="30" y="210" text-anchor="middle" font-size="20" font-weight="600" fill="#333" transform="rotate(-90, 30, 210)">Actual</text>

        <!-- Row headers -->
        <text x="85" y="155" text-anchor="middle" font-size="18" fill="#333">Chihuahua</text>
        <text x="85" y="285" text-anchor="middle" font-size="18" fill="#333">Muffin</text>

        <!-- Matrix cells -->
        <!-- True Positive (top-left) - green -->
        <rect x="130" y="85" width="170" height="110" fill="#c8e6c9" stroke="#4caf50" stroke-width="3" rx="10"/>
        <text x="215" y="125" text-anchor="middle" font-size="16" fill="#2e7d32">True Positive</text>
        <text x="215" y="170" text-anchor="middle" font-size="42" font-weight="bold" fill="#1b5e20">9</text>

        <!-- False Negative (top-right) - red -->
        <rect x="300" y="85" width="170" height="110" fill="#ffcdd2" stroke="#e53935" stroke-width="3" rx="10"/>
        <text x="385" y="125" text-anchor="middle" font-size="16" fill="#c62828">False Negative</text>
        <text x="385" y="170" text-anchor="middle" font-size="42" font-weight="bold" fill="#b71c1c">1</text>

        <!-- False Positive (bottom-left) - red -->
        <rect x="130" y="195" width="170" height="110" fill="#ffcdd2" stroke="#e53935" stroke-width="3" rx="10"/>
        <text x="215" y="235" text-anchor="middle" font-size="16" fill="#c62828">False Positive</text>
        <text x="215" y="280" text-anchor="middle" font-size="42" font-weight="bold" fill="#b71c1c">27</text>

        <!-- True Negative (bottom-right) - green -->
        <rect x="300" y="195" width="170" height="110" fill="#c8e6c9" stroke="#4caf50" stroke-width="3" rx="10"/>
        <text x="385" y="235" text-anchor="middle" font-size="16" fill="#2e7d32">True Negative</text>
        <text x="385" y="280" text-anchor="middle" font-size="42" font-weight="bold" fill="#1b5e20">63</text>

        <!-- Totals -->
        <text x="215" y="330" text-anchor="middle" font-size="14" fill="#666">n=36</text>
        <text x="385" y="330" text-anchor="middle" font-size="14" fill="#666">n=64</text>
        <text x="490" y="155" text-anchor="middle" font-size="14" fill="#666">n=10</text>
        <text x="490" y="265" text-anchor="middle" font-size="14" fill="#666">n=90</text>
      </svg>

      <!-- Metrics panel -->
      <div style="padding-top: 20px;">
        <div style="background: #f5f5f5; padding: 20px 25px; border-radius: 10px; margin-bottom: 15px;">
          <p style="font-size: 1.2em; margin: 0 0 12px 0; color: #333;"><strong>Metrics:</strong></p>
          <p style="font-size: 1.1em; margin: 6px 0; color: #444;">
            <strong>Accuracy:</strong> (9+63)/100 = <span style="color: #1976d2; font-weight: 600;">72%</span>
          </p>
          <p style="font-size: 1.1em; margin: 6px 0; color: #444;">
            <strong>Precision:</strong> 9/(9+27) = <span style="color: #1976d2; font-weight: 600;">25%</span>
          </p>
          <p style="font-size: 1.1em; margin: 6px 0; color: #444;">
            <strong>Recall:</strong> 9/(9+1) = <span style="color: #1976d2; font-weight: 600;">90%</span>
          </p>
          <p style="font-size: 1.1em; margin: 6px 0; color: #444;">
            <strong>Specificity:</strong> 63/(63+27) = <span style="color: #1976d2; font-weight: 600;">70%</span>
          </p>
        </div>
        <div style="background: #fff3e0; padding: 15px 20px; border-radius: 10px; border-left: 5px solid #ff9800;">
          <p style="font-size: 1em; color: #e65100; margin: 0;">
            <strong>Problem:</strong> High recall but low precision — the model is too eager to call everything a chihuahua!
          </p>
        </div>
      </div>
    </div>
    <p style="font-size: 0.85em; color: #888; margin-top: 8px; text-align: center;">
      Inspired by Karen Zack's viral "Chihuahua or Muffin" meme (2016). Data simulated for illustration.
    </p>
  `;

  return {
    destroy() {}
  };
}

export default { init };
