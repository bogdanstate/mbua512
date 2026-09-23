---
marp: true
theme: mbua512
paginate: true
title: "MBUA512 — Regression and Prediction"
---

<!-- _class: title -->

# Regression and Prediction

## MBUA 512

---
<!-- _class: section -->

# Regression Analysis
---
```sql-live db=stats_demo layout=rows height=500
WITH d AS (
  SELECT sqm AS x, price_k AS y
  FROM   housing
),
stats AS (
  SELECT AVG(x) AS mx, AVG(y) AS my FROM d
),
sums AS (
  SELECT SUM((d.x - s.mx) * (d.y - s.my)) AS sxy,
         SUM(POW(d.x - s.mx, 2))          AS sxx,
         SUM(POW(d.y - s.my, 2))          AS syy
  FROM   d CROSS JOIN stats s
)
SELECT ROUND(sxy / SQRT(sxx * syy), 3) AS r
FROM   sums;
```

<!-- r in SQL — where we got to -->
<!-- The correlation deck built this query one piece at a time: deviations, their products, their squares, then a square root. This is the finished article, pointed at the housing data the rest of this deck uses. Expect r = 0.939. -->
<!-- Everything that follows turns this single number into a LINE: the slope is r rescaled from SD units into real ones, and the intercept follows from the means. -->

---
<!-- _class: quote -->

"Linear regression is a method that summarizes how the average values of a numerical outcome variable vary over subpopulations defined by linear functions of predictors."

— **Gelman & Hill (2007)**

"Offers a concise summary of the mean of the response variable as a function of the explanatory variable through two parameters: the slope and the intercept."

— **Ramsey & Schafer (2002)**

<!-- Gelman, A., & Hill, J. (2007). Data analysis using regression and multilevel/hierarchical models. Cambridge University Press. Ramsey, F. L., & Schafer, D. W. (2002). The statistical sleuth (2nd ed.). Duxbury Press. -->
---
# Use regression for: Description

![Two groups with different slopes](asset:two-groups.png)

*To see, on average, how much groups differ on an outcome.*
---
# Use regression for: Prediction

![A prediction with a 95% interval](asset:prediction-interval.png)

*To predict, on average, the expected change in the outcome as the predictors change — with an honest range around it.*
---
# Examples

- Predicting the average height of a child from their parents' height
- Looking at the average yield of a crop for a given rainfall and temperature
- Describing the average income of a person, stratified by education, parental income and other socio-economic information

<!-- suggestion: the old deck gave each of these its own slide with a full-bleed Unsplash photograph. They are merged here; split them again if you want the pictures back. -->
---
<!-- _class: section -->

# Regression Basics
---
# Variables in regression

- **Y** = the **response variable** (continuous). Also called the *dependent variable*.
- **X₁, X₂, … Xₙ** = the **predictor** or **explanatory variables** (continuous, discrete or categorical).
---
# Simple regression — one explanatory variable

![Housing price against floor area with a fitted line](asset:simple-regression.png)

*50 properties. price = 80.94 + 3.000 × m², r = 0.939.*
---
# Multiple regression — the line becomes a plane

![Two views of a regression plane over floor area and rooms](asset:multiple-regression-plane.png)

*With two predictors the fit is a plane. With more, it is something we can no longer draw.*

<!-- suggestion: the closed-form SQL we build in this lecture stops being pleasant at two predictors — it needs matrix algebra. Say so out loud: the idea generalises, the hand computation does not. -->
---
```sql-live db=stats_demo layout=rows height=291
SELECT COUNT(*)                   AS readings,
       COUNT(temp_c)              AS with_temperature,
       MIN(temp_c)                AS coldest,
       MAX(temp_c)                AS hottest,
       ROUND(AVG(temp_c), 1)      AS mean_temp
FROM   sensor_readings;
```


<!-- Counting what is actually there -->
<!-- COUNT(*) counts rows. COUNT(temp_c) counts rows where temp_c is known. -->
<!-- **Run it.** 120 rows, 102 temperatures — the sensor failed 18 times, and every average is over the 102. -->
<!-- *`sensor_readings` is synthetic, made for this example.* -->
<!-- This is the only table in the deck with missing values, and it is synthetic for exactly that reason: none of the real or ported datasets has a single gap, and inventing one would have been dishonest. Worth saying "synthetic" out loud here. -->
---
# Linear regression

The regression of Y on X is:

**yᵢ = β₀ + β₁ · xᵢ + εᵢ**,  for i = 1, …, N

- **β₀** (the intercept) — where the line crosses the Y axis, i.e. the value of Y when X = 0
- **β₁** (the slope) — the increase in Y for a one-unit increase in X
---
# The two numbers a line is made of

![The intercept and the slope marked on the housing fit](asset:beta-anatomy.png)
---
```sql-live db=stats_demo layout=rows height=546
WITH d AS (
  SELECT sqm AS x, price_k AS y FROM housing
),
stats AS (
  SELECT AVG(x) AS mx, AVG(y) AS my,
         STDDEV_SAMP(x) AS sx, STDDEV_SAMP(y) AS sy
  FROM   d
),
sums AS (
  SELECT SUM((d.x - s.mx) * (d.y - s.my)) AS sxy,
         SUM(POW(d.x - s.mx, 2))          AS sxx,
         SUM(POW(d.y - s.my, 2))          AS syy
  FROM   d CROSS JOIN stats s
)
SELECT ROUND(sums.sxy / SQRT(sums.sxx * sums.syy), 3)                                  AS r,
       ROUND((sums.sxy / SQRT(sums.sxx * sums.syy)) * stats.sy / stats.sx, 3)          AS slope
FROM   sums CROSS JOIN stats;
```


<!-- Slope = r × (SD of y) ÷ (SD of x) -->
<!-- Slope: for one more unit of x, how many units of y. It is r, rescaled into real units. -->
<!-- **Run it.** Expect r = 0.939 and slope = **3.000**: each extra square metre is worth about 3 thousand. -->
---
```sql-live db=stats_demo layout=rows height=476
WITH d AS (
  SELECT sqm AS x, price_k AS y FROM housing
),
stats AS (
  SELECT AVG(x) AS mx, AVG(y) AS my FROM d
),
fit AS (
  SELECT 3.000 AS slope, s.mx AS mx, s.my AS my
  FROM   stats s
)
SELECT ROUND(mx, 2)               AS mean_sqm,
       ROUND(my, 2)               AS mean_price,
       ROUND(my - slope * mx, 2)  AS intercept
FROM   fit;
```


<!-- The line passes through the averages -->
<!-- The line always passes through (average x, average y) — that fixes the intercept. -->
<!-- **Run it.** The slope came from the last slide; all this one needs is the two averages. Expect intercept **80.93**. -->
<!-- The slope is a literal here on purpose. It was derived on the previous slide, and re-deriving it would bury this slide's single idea — that once you know the slope, the intercept is forced by the requirement that the line pass through (x̄, ȳ) — under fifteen lines the students have already read. -->
<!-- Note 80.93, not the 80.94 the fuller query gives: the exact slope is 2.99989, and rounding it to 3.000 before computing the intercept moves the answer by a cent. Worth mentioning if a student spots it — it is a real lesson about rounding intermediate values. -->
---
# Fitted values and residuals

![Residuals drawn as vertical gaps to the line](asset:residuals.png)

- **Fitted value:** ŷᵢ = β₀ + β₁ · xᵢ — what the line says
- **Residual:** εᵢ = yᵢ − ŷᵢ — what the line missed
---
```sql-live db=stats_demo layout=rows limit=5 height=414
WITH fit AS (
  SELECT 3.000 AS slope, 80.94 AS intercept
)
SELECT h.sqm,
       h.price_k,
       ROUND(f.intercept + f.slope * h.sqm, 1)              AS predicted,
       ROUND(h.price_k - (f.intercept + f.slope * h.sqm), 1) AS residual
FROM   housing h CROSS JOIN fit f
ORDER  BY residual DESC
LIMIT  10;
```


<!-- Predicted and residual, row by row -->
<!-- Predicted = the line's answer. Residual = what the line missed. -->
<!-- **Change it.** `ORDER BY residual` (no `DESC`) shows the other end — the houses the line most overprices. -->
<!-- The slope and intercept are written as literals here on purpose: the point of this slide is the per-row arithmetic, and re-deriving them inside the query would bury it under five CTEs the students have already seen. -->
---
# Least squares: move the line and watch

![Three lines with their residuals and SSR](asset:wrong-lines.png)

*Move the line anywhere else and the squared misses get bigger.*
---
# SSR — the total of the squared misses

![Residual squares drawn on the housing scatter](asset:ssr-squares.png)

**SSR = Σ εᵢ² = Σ (yᵢ − ŷᵢ)²**

*The least-squares line is the one that makes this total as small as it can be: 93,044.*
---
# One lowest point

![SSR against candidate slopes, a parabola](asset:ssr-curve.png)

*There is exactly one slope at the bottom — and a formula that finds it without searching.*

<!-- suggestion: the old slide called this "gradient descent", but it was an easeOutCubic animation sliding to the closed-form answer — nothing was being minimised. This is the honest picture: SSR really is a parabola in the slope, and least squares is its minimum. -->
---
```sql-live db=stats_demo layout=rows height=268
WITH fit AS (
  SELECT 3.000 AS slope, 80.94 AS intercept
)
SELECT ROUND(SUM(POW(h.price_k - (f.intercept + f.slope * h.sqm), 2)), 0) AS ssr
FROM   housing h CROSS JOIN fit f;
```


<!-- SSR in SQL -->
<!-- Square every miss, add them up. Least squares makes this as small as it can be. -->
<!-- **Run it.** Expect **93,044** — the same number as on the picture. -->
---
# Is it a good model?

**R² = 1 − SSR / TSS**, where **TSS = Σ (yᵢ − ȳ)²**

R² is the proportion of the total variability that the regression model explains.

*For a simple linear regression, **R² = ρ²**.*
---
# Two roads, one number

![TSS and SSR side by side](asset:r2-ssr-tss.png)
---
```sql-live db=stats_demo layout=rows height=430
WITH fit AS (
  SELECT 3.000 AS slope, 80.94 AS intercept
),
parts AS (
  SELECT SUM(POW(h.price_k - (f.intercept + f.slope * h.sqm), 2)) AS ssr,
         SUM(POW(h.price_k - (SELECT AVG(price_k) FROM housing), 2)) AS sst
  FROM   housing h CROSS JOIN fit f
)
SELECT ROUND(ssr, 0)            AS ssr,
       ROUND(sst, 0)            AS sst,
       ROUND(1 - ssr / sst, 3)  AS r_squared
FROM   parts;
```


<!-- R² in SQL -->
<!-- Two roads, one number: 1 − SSR/SST, and r squared. -->
<!-- **Run it.** Expect SSR 93,044, SST 791,883 and **R² = 0.883** — which is 0.939² exactly. -->
---
# How to win at statistics

![R² and adjusted R² as junk predictors are added](asset:r2-inflation.png)

*Add predictors made of pure noise and R² climbs anyway. Adjusted R² does not fall for it.*

<!-- suggestion: the old slide typed its R² values in — nothing was fitted. These are real fits on real (seeded) noise, which is why R² does not climb smoothly: noise sometimes helps by luck. That IS the lesson. -->
---
# Adjusted R²

**Adj. R² = 1 − (1 − R²)(n − 1) / (n − p − 1)**

- **n** = number of observations
- **p** = number of predictors
- **dF** = n − p − 1 (degrees of freedom)

The adjusted R² accounts for the degrees of freedom and is preferable to R² when comparing models of different sizes.

**Warning:** neither R² nor adjusted R² tells you how well the model will predict a **new** observation.
---
```sql-live db=stats_demo layout=rows height=549
WITH d AS (
  SELECT sqm AS x, price_k AS y
  FROM   housing
  WHERE  is_train = 1
),
stats AS (
  SELECT AVG(x) AS mx, AVG(y) AS my,
         STDDEV_SAMP(x) AS sx, STDDEV_SAMP(y) AS sy FROM d
),
sums AS (
  SELECT SUM((d.x - s.mx) * (d.y - s.my)) AS sxy,
         SUM(POW(d.x - s.mx, 2))          AS sxx,
         SUM(POW(d.y - s.my, 2))          AS syy
  FROM   d CROSS JOIN stats s
)
SELECT ROUND(sxy / SQRT(sxx * syy), 3)                 AS r,
       ROUND(sxy / sxx, 3)                             AS slope
FROM   sums CROSS JOIN stats;
```


<!-- Fit on half the data -->
<!-- Fit on half the data. Keep the other half to check. -->
<!-- **Change it.** Make `is_train = 1` into `is_train = 0` and compare. -->
---
# Reading regression output

```annotated-code lang=r sep=@@@
Call:
lm(formula = price_k ~ sqm, data = train_data)

Residuals:
    Min      1Q  Median      3Q     Max
-91.341 -23.642 -10.418  11.539 102.124

Coefficients:
            Estimate Std. Error t value Pr(>|t|)
(Intercept) 55.67835   28.23143   1.972   0.0607 .
sqm          3.24252    0.25615  12.658 7.56e-12 ***
---
Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

Residual standard error: 51.49 on 23 degrees of freedom
Multiple R-squared:  0.8745,    Adjusted R-squared:  0.869
F-statistic: 160.2 on 1 and 23 DF,  p-value: 7.555e-12
@@@
- `Estimate` is the fitted coefficient: this line is price = 55.68 + 3.24 × m². Compare it to the 3.000 we got from all 50 houses — half the data moves the slope.
- `Std. Error` is how much that estimate would wobble if we drew another sample of 25. The slope's is 0.26, so 3.24 is comfortably far from zero.
- `t value` is simply Estimate ÷ Std. Error. Rules of thumb start at about 2.
- `Pr(>|t|)` is the p-value: the chance of a t this large if the true coefficient were zero. For `sqm` it is 7.56e-12 — vanishingly small.
- `***` marks significance at the 0.001 level. The intercept's `.` marks only the 0.1 level: we cannot say confidently what a zero-square-metre house costs, which should not surprise anyone.
- `Residual standard error` is the typical miss, in thousands. 51.49 against prices in the hundreds.
- `Multiple R-squared` is the share of variation explained; `Adjusted R-squared` penalises extra predictors.
- `F-statistic` tests the whole model at once. With one predictor it carries the same news as the slope's t.
```

*Output from **R** — the same fit as the previous slide, on the training half. SQL gives us the coefficients; standard errors and p-values are more pleasant in a statistics package.*
---
# Is it a good model? Bands

- **Confidence bands** reflect the uncertainty about the **regression line** — how well the line itself is determined.
- **Prediction bands** include the uncertainty about a **future observation**, and so are always wider.

**Attention:** these limits rely strongly on the assumption of normally distributed errors with constant variance, and should **not** be used when that assumption is violated.
---
# Confidence and prediction bands

![Confidence and prediction bands on the housing fit](asset:confidence-prediction-bands.png)

*Fitted on the 25 training houses; the held-out 25 are the triangles.*
---
# Heavy metal bands

<!-- _class: quote -->

"At the country-level, the number of heavy metal bands per capita is positively associated with economic output per capita (.71); level of creativity and entrepreneurship..."

— Florida, R. (2014, May 26). *How heavy metal tracks the wealth of nations.* Bloomberg.

🤘
---
# Accuracy of predictions

When we build a model and have a "ground truth", we can measure the quality of our predictions.

![A 2x2 confusion matrix](asset:confusion-matrix.png)
---
# Confusion matrix metrics

- **TPR** (Recall) = TP / (TP + FN) — of the real positives, how many did we find?
- **TNR** (Specificity) = TN / (TN + FP) — of the real negatives, how many did we clear?
- **FNR** = FN / (TP + FN) — the ones we missed
- **FPR** = FP / (TN + FP) — the false alarms
- **Precision** = TP / (TP + FP) — when we say yes, how often are we right?
- **Accuracy** = (TP + TN) / Total
- **Prevalence** = (TP + FN) / Total — how common the thing is to begin with
---
# The chihuahua detector

![100 images classified, with the four metrics](asset:chihuahua-detector.png)

*100 images: 10 chihuahuas, 90 muffins. 72% accurate, 90% recall — and 25% precision.*

<!-- suggestion: the punchline is that accuracy looks respectable while the model is nearly useless. It calls "chihuahua" 36 times and is right 9 times. Inspired by Karen Zack's "Chihuahua or Muffin" (2016); the counts are simulated for illustration. -->
---
<!-- _class: callout -->

# Prediction ≠ Causation

- Causal claims require **no confounders**
- Only valid under special settings (controlled experiments)

Be careful when **predicting the future**, **extrapolating beyond the data**, or **making claims for combinations that are not in the data**.
---
# Chocolate and Nobel prizes

![Chocolate consumption against Nobel laureates per capita](asset:chocolate-nobel.png)

*r = +0.800. Source: Messerli, F.H. (2012), NEJM 367:1562–1564.*
---
```sql-live db=stats_demo layout=rows height=500
WITH d AS (
  SELECT chocolate_kg AS x, nobel_per_10m AS y
  FROM   chocolate_nobel
),
stats AS (
  SELECT AVG(x) AS mx, AVG(y) AS my FROM d
),
sums AS (
  SELECT SUM((d.x - s.mx) * (d.y - s.my)) AS sxy,
         SUM(POW(d.x - s.mx, 2))          AS sxx,
         SUM(POW(d.y - s.my, 2))          AS syy
  FROM   d CROSS JOIN stats s
)
SELECT ROUND(sxy / SQRT(sxx * syy), 3) AS r
FROM   sums;
```


<!-- Check it yourself -->
<!-- A strong r. Now argue about why. -->
<!-- **Run it.** Expect **0.800** — one of the strongest correlations in this entire lecture. -->
<!-- suggestion: a good closing discussion. 23 countries, no mechanism, and an r that beats most of the real relationships we looked at today. What would it take to believe it? -->