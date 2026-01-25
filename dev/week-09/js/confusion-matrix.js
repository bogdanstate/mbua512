/**
 * Confusion Matrix Metrics
 *
 * Interactive visualization showing TP, TN, FP, FN
 * and how they relate to precision, recall, etc.
 */

export function init(container, config = {}) {
  container.innerHTML = `
    <style>
      .cm-box { transition: all 0.2s ease; cursor: pointer; }
      .cm-box.highlight { filter: brightness(1.2); stroke-width: 5px !important; }
      .cm-box.dim { opacity: 0.25; }
      .formula-box { transition: all 0.2s ease; cursor: pointer; display: inline-block; }
      .formula-box.highlight { transform: scale(1.4); box-shadow: 0 0 12px rgba(0,0,0,0.4); }
      .formula-box.dim { opacity: 0.25; }
    </style>
    <h2 style="font-size: 2em; color: #1a1a2e; font-weight: 400; margin-bottom: 5px; text-align: center;">
      Confusion Matrix Metrics
    </h2>
    <div style="display: flex; justify-content: center; align-items: flex-start; gap: 40px;">
      <!-- Left side: Visual diagram -->
      <svg width="580" height="580" viewBox="0 0 580 580" id="cmDiagram">
        <!-- Top bar: Actual Positive / Actual Negative -->
        <rect class="cm-box" data-type="ap" x="60" y="15" width="220" height="85" fill="#bbdefb" stroke="#1976d2" stroke-width="3" rx="8"/>
        <text x="170" y="50" text-anchor="middle" font-size="20" fill="#333" pointer-events="none">Actual</text>
        <text x="170" y="80" text-anchor="middle" font-size="20" font-weight="600" fill="#1565c0" pointer-events="none">Positive</text>

        <rect class="cm-box" data-type="an" x="280" y="15" width="220" height="85" fill="#ffe0b2" stroke="#ff9800" stroke-width="3" rx="8"/>
        <text x="390" y="50" text-anchor="middle" font-size="20" fill="#333" pointer-events="none">Actual</text>
        <text x="390" y="80" text-anchor="middle" font-size="20" font-weight="600" fill="#e65100" pointer-events="none">Negative</text>

        <!-- Arrow -->
        <defs>
          <marker id="arrowhead2" markerWidth="12" markerHeight="9" refX="11" refY="4.5" orient="auto">
            <polygon points="0 0, 12 4.5, 0 9" fill="#666"/>
          </marker>
        </defs>
        <path d="M 280 120 L 280 160" stroke="#666" stroke-width="3" fill="none" marker-end="url(#arrowhead2)"/>
        <text x="280" y="145" text-anchor="middle" font-size="16" fill="#666">Prediction or</text>
        <text x="280" y="165" text-anchor="middle" font-size="16" fill="#666">Classification</text>

        <!-- Main confusion matrix visualization -->
        <!-- FN region (pink, outer) -->
        <rect class="cm-box" data-type="fn" x="60" y="185" width="220" height="280" fill="#ffcdd2" stroke="#e57373" stroke-width="3" rx="8"/>
        <text x="105" y="220" font-size="18" fill="#c62828" pointer-events="none">Predicted Wrongly</text>
        <text x="105" y="245" font-size="18" fill="#c62828" pointer-events="none">As Negative (FN)</text>

        <!-- TN region (light green, outer right) -->
        <rect class="cm-box" data-type="tn" x="280" y="185" width="220" height="150" fill="#c8e6c9" stroke="#81c784" stroke-width="3" rx="8"/>
        <text x="390" y="230" text-anchor="middle" font-size="18" fill="#2e7d32" pointer-events="none">Predicted Correctly</text>
        <text x="390" y="258" text-anchor="middle" font-size="18" fill="#2e7d32" pointer-events="none">As Negative (TN)</text>

        <!-- TP region (green, inner) -->
        <rect class="cm-box" data-type="tp" x="90" y="280" width="190" height="165" fill="#a5d6a7" stroke="#66bb6a" stroke-width="4" rx="8"/>
        <text x="185" y="350" text-anchor="middle" font-size="19" fill="#1b5e20" pointer-events="none">Predicted Correctly</text>
        <text x="185" y="378" text-anchor="middle" font-size="19" fill="#1b5e20" pointer-events="none">As Positive (TP)</text>

        <!-- FP region (orange/yellow) -->
        <rect class="cm-box" data-type="fp" x="280" y="335" width="220" height="130" fill="#fff3e0" stroke="#ffb74d" stroke-width="3" rx="8"/>
        <text x="390" y="385" text-anchor="middle" font-size="18" fill="#e65100" pointer-events="none">Predicted Wrongly</text>
        <text x="390" y="413" text-anchor="middle" font-size="18" fill="#e65100" pointer-events="none">As Positive (FP)</text>

        <!-- Annotations -->
        <text x="60" y="505" font-size="16" fill="#c62828">Minimize this to</text>
        <text x="60" y="530" font-size="16" font-weight="600" fill="#c62828">improve Recall</text>

        <text x="330" y="505" font-size="16" fill="#e65100">Minimize this to</text>
        <text x="330" y="530" font-size="16" font-weight="600" fill="#e65100">improve Precision</text>
        <text x="330" y="555" font-size="16" font-weight="600" fill="#e65100">and Specificity</text>
      </svg>

      <!-- Right side: Formulas -->
      <div style="display: flex; flex-direction: column; gap: 18px; padding-top: 15px;" id="cmFormulas">
        <!-- TPR -->
        <div style="display: flex; align-items: center; gap: 12px;" class="formula-row" data-uses="tp,fn">
          <span style="font-size: 1.2em; width: 140px; color: #333;"><strong>TPR</strong> (Recall) =</span>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="display: flex; gap: 5px;"><span class="formula-box" data-type="tp" style="width: 30px; height: 30px; background: #a5d6a7; border: 3px solid #66bb6a; border-radius: 5px;"></span></div>
            <div style="border-top: 3px solid #333; padding-top: 4px; display: flex; gap: 5px; align-items: center;">
              <span class="formula-box" data-type="tp" style="width: 30px; height: 30px; background: #a5d6a7; border: 3px solid #66bb6a; border-radius: 5px;"></span>
              <span style="font-size: 18px;">+</span>
              <span class="formula-box" data-type="fn" style="width: 30px; height: 30px; background: #ffcdd2; border: 3px solid #e57373; border-radius: 5px;"></span>
            </div>
          </div>
          <span style="font-size: 1.1em; color: #555;">= TP / (TP + FN)</span>
        </div>

        <!-- TNR -->
        <div style="display: flex; align-items: center; gap: 12px;" class="formula-row" data-uses="tn,fp">
          <span style="font-size: 1.2em; width: 140px; color: #333;"><strong>TNR</strong> (Specificity) =</span>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="display: flex; gap: 5px;"><span class="formula-box" data-type="tn" style="width: 30px; height: 30px; background: #c8e6c9; border: 3px solid #81c784; border-radius: 5px;"></span></div>
            <div style="border-top: 3px solid #333; padding-top: 4px; display: flex; gap: 5px; align-items: center;">
              <span class="formula-box" data-type="tn" style="width: 30px; height: 30px; background: #c8e6c9; border: 3px solid #81c784; border-radius: 5px;"></span>
              <span style="font-size: 18px;">+</span>
              <span class="formula-box" data-type="fp" style="width: 30px; height: 30px; background: #fff3e0; border: 3px solid #ffb74d; border-radius: 5px;"></span>
            </div>
          </div>
          <span style="font-size: 1.1em; color: #555;">= TN / (TN + FP)</span>
        </div>

        <!-- FNR -->
        <div style="display: flex; align-items: center; gap: 12px;" class="formula-row" data-uses="fn,tp">
          <span style="font-size: 1.2em; width: 140px; color: #333;"><strong>FNR</strong> =</span>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="display: flex; gap: 5px;"><span class="formula-box" data-type="fn" style="width: 30px; height: 30px; background: #ffcdd2; border: 3px solid #e57373; border-radius: 5px;"></span></div>
            <div style="border-top: 3px solid #333; padding-top: 4px; display: flex; gap: 5px; align-items: center;">
              <span class="formula-box" data-type="tp" style="width: 30px; height: 30px; background: #a5d6a7; border: 3px solid #66bb6a; border-radius: 5px;"></span>
              <span style="font-size: 18px;">+</span>
              <span class="formula-box" data-type="fn" style="width: 30px; height: 30px; background: #ffcdd2; border: 3px solid #e57373; border-radius: 5px;"></span>
            </div>
          </div>
          <span style="font-size: 1.1em; color: #555;">= FN / (TP + FN)</span>
        </div>

        <!-- FPR -->
        <div style="display: flex; align-items: center; gap: 12px;" class="formula-row" data-uses="fp,tn">
          <span style="font-size: 1.2em; width: 140px; color: #333;"><strong>FPR</strong> =</span>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="display: flex; gap: 5px;"><span class="formula-box" data-type="fp" style="width: 30px; height: 30px; background: #fff3e0; border: 3px solid #ffb74d; border-radius: 5px;"></span></div>
            <div style="border-top: 3px solid #333; padding-top: 4px; display: flex; gap: 5px; align-items: center;">
              <span class="formula-box" data-type="tn" style="width: 30px; height: 30px; background: #c8e6c9; border: 3px solid #81c784; border-radius: 5px;"></span>
              <span style="font-size: 18px;">+</span>
              <span class="formula-box" data-type="fp" style="width: 30px; height: 30px; background: #fff3e0; border: 3px solid #ffb74d; border-radius: 5px;"></span>
            </div>
          </div>
          <span style="font-size: 1.1em; color: #555;">= FP / (TN + FP)</span>
        </div>

        <!-- Precision -->
        <div style="display: flex; align-items: center; gap: 12px;" class="formula-row" data-uses="tp,fp">
          <span style="font-size: 1.2em; width: 140px; color: #333;"><strong>Precision</strong> =</span>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="display: flex; gap: 5px;"><span class="formula-box" data-type="tp" style="width: 30px; height: 30px; background: #a5d6a7; border: 3px solid #66bb6a; border-radius: 5px;"></span></div>
            <div style="border-top: 3px solid #333; padding-top: 4px; display: flex; gap: 5px; align-items: center;">
              <span class="formula-box" data-type="tp" style="width: 30px; height: 30px; background: #a5d6a7; border: 3px solid #66bb6a; border-radius: 5px;"></span>
              <span style="font-size: 18px;">+</span>
              <span class="formula-box" data-type="fp" style="width: 30px; height: 30px; background: #fff3e0; border: 3px solid #ffb74d; border-radius: 5px;"></span>
            </div>
          </div>
          <span style="font-size: 1.1em; color: #555;">= TP / (TP + FP)</span>
        </div>

        <!-- Accuracy -->
        <div style="display: flex; align-items: center; gap: 12px;" class="formula-row" data-uses="tp,tn,ap,an">
          <span style="font-size: 1.2em; width: 140px; color: #333;"><strong>Accuracy</strong> =</span>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="display: flex; gap: 5px;">
              <span class="formula-box" data-type="tp" style="width: 30px; height: 30px; background: #a5d6a7; border: 3px solid #66bb6a; border-radius: 5px;"></span>
              <span style="font-size: 18px;">+</span>
              <span class="formula-box" data-type="tn" style="width: 30px; height: 30px; background: #c8e6c9; border: 3px solid #81c784; border-radius: 5px;"></span>
            </div>
            <div style="border-top: 3px solid #333; padding-top: 4px; display: flex; gap: 5px; align-items: center;">
              <span class="formula-box" data-type="ap" style="width: 30px; height: 30px; background: #bbdefb; border: 3px solid #64b5f6; border-radius: 5px;"></span>
              <span style="font-size: 18px;">+</span>
              <span class="formula-box" data-type="an" style="width: 30px; height: 30px; background: #ffe0b2; border: 3px solid #ffb74d; border-radius: 5px;"></span>
            </div>
          </div>
          <span style="font-size: 1.1em; color: #555;">= (TP + TN) / Total</span>
        </div>

        <!-- Prevalence -->
        <div style="display: flex; align-items: center; gap: 12px;" class="formula-row" data-uses="ap,an">
          <span style="font-size: 1.2em; width: 140px; color: #333;"><strong>Prevalence</strong> =</span>
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="display: flex; gap: 5px;"><span class="formula-box" data-type="ap" style="width: 30px; height: 30px; background: #bbdefb; border: 3px solid #64b5f6; border-radius: 5px;"></span></div>
            <div style="border-top: 3px solid #333; padding-top: 4px; display: flex; gap: 5px; align-items: center;">
              <span class="formula-box" data-type="ap" style="width: 30px; height: 30px; background: #bbdefb; border: 3px solid #64b5f6; border-radius: 5px;"></span>
              <span style="font-size: 18px;">+</span>
              <span class="formula-box" data-type="an" style="width: 30px; height: 30px; background: #ffe0b2; border: 3px solid #ffb74d; border-radius: 5px;"></span>
            </div>
          </div>
          <span style="font-size: 1.1em; color: #555;">= (TP + FN) / Total</span>
        </div>
      </div>
    </div>
  `;

  const svgBoxes = container.querySelectorAll('.cm-box');
  const formulaBoxes = container.querySelectorAll('.formula-box');
  const allBoxes = [...svgBoxes, ...formulaBoxes];

  function highlightType(type, active) {
    allBoxes.forEach(box => {
      if (box.dataset.type === type) {
        box.classList.toggle('highlight', active);
      } else if (active) {
        box.classList.add('dim');
      } else {
        box.classList.remove('dim');
      }
    });
  }

  function clearAll() {
    allBoxes.forEach(box => box.classList.remove('highlight', 'dim'));
  }

  svgBoxes.forEach(box => {
    box.addEventListener('mouseenter', () => highlightType(box.dataset.type, true));
    box.addEventListener('mouseleave', clearAll);
  });

  formulaBoxes.forEach(box => {
    box.addEventListener('mouseenter', () => highlightType(box.dataset.type, true));
    box.addEventListener('mouseleave', clearAll);
  });

  return {
    destroy() {}
  };
}

export default { init };
