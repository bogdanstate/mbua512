/**
 * Annotated Summary Output
 *
 * Interactive R regression output with hover annotations
 * explaining each component of the summary.
 */

export function init(container, config = {}) {
  const annotations = [
    { pattern: "Std. Error", label: "Standard Error", explanation: "Uncertainty in the coefficient estimate. The lower the better - indicates more precise estimates.", color: "#e67e22" },
    { pattern: "t value", label: "T-Statistic", explanation: "Ratio of estimate to its standard error. The higher (in absolute value) the better - indicates stronger evidence.", color: "#16a085" },
    { pattern: "Pr(>|t|)", label: "P-value", explanation: "Probability of seeing this result if the true coefficient were 0. Lower = more significant.", color: "#e74c3c" },
    { pattern: "***", label: "Highly Significant", explanation: "Three stars (***) means p < 0.001. This predictor is very likely to have a real effect.", color: "#27ae60" },
    { pattern: "Residual standard error", label: "Residual Std. Error", explanation: "Average prediction error. Percentage error: 11.48 × 100 / mean(train_data$bp) ≈ 16%", color: "#3498db" },
    { pattern: "Adjusted R-squared", label: "Adjusted R²", explanation: "What % of variance is explained by the model, adjusted for number of predictors. Here ~6.6%.", color: "#9b59b6" },
    { pattern: "Estimate", label: "Coefficients", explanation: "β values: Intercept (58.9) is BP when BMI=0. Slope (0.42) means +1 BMI → +0.42 BP.", color: "#f39c12" }
  ];

  const summaryText = `Call:
lm(formula = bp ~ bmi, data = train_data, na.action = na.exclude)

Residuals:
    Min      1Q  Median      3Q     Max
-52.160  -7.404   0.179   7.261  53.629

Coefficients:
            Estimate Std. Error t value Pr(>|t|)
(Intercept) 58.89552    2.72033   21.65  < 2e-16 ***
bmi          0.42300    0.08088    5.23 2.85e-07 ***
---
Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

Residual standard error: 11.48 on 369 degrees of freedom
  (13 observations deleted due to missingness)
Multiple R-squared:  0.06901,	Adjusted R-squared:  0.06648
F-statistic: 27.35 on 1 and 369 DF,  p-value: 2.85e-07`;

  container.innerHTML = `
    <h2 style="font-size: 2em; color: #1a1a2e; font-weight: 400; margin-bottom: 12px; text-align: center;">
      Reading Regression Output
    </h2>
    <div style="display: flex; gap: 25px; padding: 0 20px;">
      <div style="flex: 1; position: relative;">
        <pre id="summaryPre" style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 13px; line-height: 1.7; background: #1e1e1e; color: #d4d4d4; padding: 20px; border-radius: 8px; margin: 0; white-space: pre; overflow-x: auto;"></pre>
      </div>
      <div id="annotationCards" style="width: 340px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;"></div>
    </div>
    <p style="text-align: center; color: #666; margin-top: 15px; font-size: 0.95em;">
      Hover over highlighted terms or cards to see explanations
    </p>
  `;

  const pre = container.querySelector('#summaryPre');
  const cardsContainer = container.querySelector('#annotationCards');

  // Create highlighted text
  let html = summaryText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  annotations.forEach((ann, idx) => {
    const escapedPattern = ann.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedPattern})`, 'g');
    html = html.replace(regex, `<span class="hl-${idx}" data-ann="${idx}" style="background: ${ann.color}33; border-bottom: 2px solid ${ann.color}; padding: 0 2px; cursor: pointer;">$1</span>`);
  });
  pre.innerHTML = html;

  // Create annotation cards
  annotations.forEach((ann, idx) => {
    const card = document.createElement('div');
    card.className = 'ann-card';
    card.dataset.ann = idx;
    card.style.cssText = `background: white; border-left: 4px solid ${ann.color}; padding: 12px 15px; border-radius: 0 8px 8px 0; box-shadow: 0 2px 6px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s;`;
    card.innerHTML = `
      <div style="font-weight: 600; color: ${ann.color}; margin-bottom: 5px; font-size: 13px;">
        <span style="width: 8px; height: 8px; background: ${ann.color}; border-radius: 50%; display: inline-block; margin-right: 6px;"></span>
        ${ann.label}
      </div>
      <div style="color: #555; font-size: 12px; line-height: 1.4;">${ann.explanation}</div>
    `;
    cardsContainer.appendChild(card);

    card.addEventListener('mouseenter', () => highlightPattern(idx, true));
    card.addEventListener('mouseleave', () => highlightPattern(idx, false));
  });

  function highlightPattern(idx, active) {
    const spans = pre.querySelectorAll(`.hl-${idx}`);
    const ann = annotations[idx];
    spans.forEach(span => {
      span.style.background = active ? ann.color + '66' : ann.color + '33';
      span.style.borderBottomWidth = active ? '3px' : '2px';
    });

    const cards = cardsContainer.querySelectorAll('.ann-card');
    cards.forEach((card, i) => {
      if (i === idx && active) {
        card.style.transform = 'translateX(-5px)';
        card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      } else {
        card.style.transform = 'translateX(0)';
        card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
      }
    });
  }

  // Add hover to spans in pre
  pre.querySelectorAll('[data-ann]').forEach(span => {
    span.addEventListener('mouseenter', () => {
      const idx = parseInt(span.dataset.ann);
      highlightPattern(idx, true);
    });
    span.addEventListener('mouseleave', () => {
      const idx = parseInt(span.dataset.ann);
      highlightPattern(idx, false);
    });
  });

  return {
    destroy() {}
  };
}

export default { init };
