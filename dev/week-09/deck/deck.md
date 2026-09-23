---
marp: true
theme: mbua512
paginate: true
title: "MBUA512 — Week 9: Correlation & Regression"
---

<!-- _class: title -->

# Correlation & Regression

## MBUA 512

<!-- The old deck carried both lecturers' names here. Repo rule (mbua512/CLAUDE.md): title slides carry the title and the course name only. -->
<!-- It also carried a NASA space photograph as a full-bleed background, credited "Photo by NASA on Unsplash" at the foot. The port did not bring the photograph across — it was a hot-linked Unsplash URL, and the platform refuses remote images — so the credit line was left crediting an image that is not on the slide. That is why it "no longer makes sense": the credit outlived its picture. Removed with it. To restore: add the photo as a deck ASSET, set it as data-background-image, and bring the credit line back alongside. -->

---

<!-- _class: section -->

# Multivariate Analysis

---

# Multivariate Analysis

- Two or more measurements for each element — a **"high dimensional space"**
- Shifting from averages, levels and variances to the **degree of relationships**
- Key concepts: **correlation** and **covariance**

---

# Same correlation, different pictures

![Three point clouds with very different shapes and similar correlation](asset:same-r-three-clouds.png)

*A single number cannot tell you what a relationship looks like. Always plot the data.*

<!-- suggestion: the old deck morphed 2,000 points between these three shapes. The three end states are the teaching point; the animation was decoration. In a later release this becomes an interactive widget. -->

---

# Correlation Basics

When we want to predict:

- How long someone will live
- Whether the stock market will go up or down
- Whether a surgery will prolong a cancer patient's life
- Whether a person will make a productive employee
- Whether a marriage will survive or end in divorce

---

<!-- _class: section -->

# 1. Formulate a Clear Question

---

# A confusing question gets a confusing answer

![Tyler Vigen's spurious correlation chart](asset:spurious-correlation.png)

*Source: Tyler Vigen, "Spurious Correlations" (tylervigen.com), used with credit.*

---

# Confusing Question ⇒ Confusing Answer

If you cannot say plainly what you are asking, no amount of data will answer it.

<!-- The old deck stacked "Confusing Question / ⇓ / Confusing Answer" vertically, so its arrow pointed DOWN. Here the three parts sit on one line, so the arrow points RIGHT (⇒). The `callout` class is gone too: it draws a 6px blue rule down the left edge of the whole section, which on a slide this short reads as a stray blue bar rather than as emphasis. -->


---

<!-- _class: section -->

# 2. Identify Two Variables to Answer Your Question

---

# Fun During, and Fun After

Two measurements on the same person:

- **Fun during** the activity — how it felt at the time
- **Fun after** the activity — how it feels looking back

Some things are fun in the moment. Some things are only fun once they are over.

<!-- suggestion: the old deck illustrated this with two hot-linked SVG illustrations. They are dropped; the idea carries in words, and the scatter two slides on makes it concrete. -->

---

<!-- _class: section -->

# 3. Get Information from a Random Sample of People

---

```sql-live db=stats_demo layout=rows limit=5 height=344
SELECT person,
       activity_type,
       fun_category,
       fun_during,
       fun_after
FROM   fun_survey
LIMIT  10;
```


<!-- Sample of collected data -->
<!-- Ten rows, so we can see what one response looks like. -->
<!-- **Run it.** 100 people, one row each. -->
<!-- The old deck hand-typed this table into HTML. Now it is a query against the real table, so the numbers on the slide cannot drift from the numbers in the database. -->

---

```sql-live db=stats_demo layout=rows limit=5 height=344
SELECT person,
       activity_type,
       fun_during,
       fun_after
FROM   fun_survey
WHERE  activity_type IN ('Marathon running', 'Cleaning the house')
LIMIT  10;
```


<!-- Change one thing -->
<!-- WHERE keeps only the rows you ask for. -->
<!-- **Change it.** Swap an activity for another one and run it again. -->

---

<!-- _class: section -->

# 4. Graph Responses Using a Scatterplot

---

# Type 1 vs Type 2 fun

![Scatter of fun during against fun after, coloured by category](asset:fun-scatter.png)

*Pooled r = +0.53 — but look at the three groups separately.*

<!-- suggestion: the dashed diagonal is "equal fun during and after". Points below it are Type 2 fun: miserable at the time, great in hindsight. The pooled correlation describes none of the three groups — a good place to pause. -->

---

# Types of relationships

![Positive, negative and no relationship, as three scatters](asset:types-of-relationships.png)

---

<!-- _class: section -->

# Positive (Direct) Relationship

---

# More firefighters, more damage

![Firefighters against property damage](asset:fire-firefighters-damage.png)

*Synthetic data, authored for this lecture. r = +0.967.*

---

```sql-live db=stats_demo layout=rows limit=5 height=274
SELECT firefighters,
       property_damage / 1000000 AS damage_millions
FROM   fire_incidents
LIMIT  10;
```


<!-- A column can be a calculation -->
<!-- A column can be a calculation. Give it a name with AS. -->
<!-- **Run it.** `damage_millions` is not stored anywhere — it is computed as the query runs. -->

---

```sql-live db=stats_demo layout=rows limit=5 height=274
SELECT firefighters,
       ROUND(property_damage / 1000000, 2) AS damage_millions
FROM   fire_incidents
LIMIT  10;
```


<!-- ROUND tidies what you see -->
<!-- ROUND tidies what you see. The stored value does not change. -->
<!-- **Change it.** Make the `2` a `0` and run it again. -->

---

# But what is really going on?

![Structures burned against firefighters](asset:fire-structures-firefighters.png)

*Bigger fires draw more firefighters. r = +0.979.*

---

# And the same cause drives the damage

![Structures burned against property damage](asset:fire-structures-damage.png)

*Bigger fires do more damage. r = +0.987.*

---

<!-- _class: callout -->

# The firefighters did not cause the damage

**The size of the fire caused both.**

A variable that drives both sides of a correlation is a **confounder**. It is the first thing to look for and the easiest thing to forget.

---

<!-- _class: section -->

# Negative (Inverse) Relationship

---

# The further they ran, the dimmer the view

![Metres run against opinion of running, linear scale](asset:marathon-linear.png)

*r = −0.770. But look at the shape — a straight line is not describing this well.*

---

```sql-live db=stats_demo layout=rows height=268
SELECT COUNT(*)                  AS runners,
       MIN(meters_run)           AS shortest,
       MAX(meters_run)           AS longest,
       ROUND(AVG(opinion), 2)    AS mean_opinion
FROM   marathon_opinion;
```


<!-- How far does the data stretch? -->
<!-- How far does the data stretch? MIN and MAX are the ends. -->
<!-- **Run it.** The distances span from about 100 m to a full marathon — more than two orders of magnitude. -->

---

# Straightening the curve

![Metres run against opinion, log scale](asset:marathon-log.png)

*The same 400 runners. On a log scale, r = −0.948.*

---

```sql-live db=stats_demo layout=rows limit=5 height=298
SELECT meters_run,
       LOG10(meters_run) AS log_meters,
       opinion
FROM   marathon_opinion
LIMIT  10;
```


<!-- LOG10 counts the zeros -->
<!-- LOG10 counts the zeros: 100 → 2, 10 000 → 4. -->
<!-- **Change it.** Take `LOG10` away and watch the curve come back. -->

---

<!-- _class: section -->

# No (Weak) Relationship

---

# Does a dearer beer taste better?

![Belgian beer price against expert score](asset:beer-scatter.png)

*Real data: Verstrepen et al. (2024), PMC10966102. 228 beers. r = +0.127.*

---

```sql-live db=stats_demo layout=rows limit=5 height=274
SELECT avg_price_eur,
       overall_score
FROM   belgian_beer
LIMIT  10;
```


<!-- Look at the beers themselves -->
<!-- Two columns from a real dataset. Change the y column and look again. -->
<!-- **Change it.** Try `is_influential` as a third column and see which rows are flagged. -->

---

# A handful of beers hold the slope up

![The 25 most influential beers highlighted](asset:beer-influential.png)

*The 25 rows with the largest |DFBETA| are flagged in the table as `is_influential = 1`. Drop them and r falls from +0.127 to +0.038.*

<!-- suggestion: DFBETA measures how much the slope moves if you delete one point. Computing it in SQL needs leverage, residuals and a ranked cut-off — three new ideas at once — so the flag was computed when the table was built. Its formula is in the table COMMENT. -->

---

```sql-live db=stats_demo layout=rows limit=5 height=298
SELECT avg_price_eur,
       overall_score
FROM   belgian_beer
WHERE  is_influential = 0
LIMIT  10;
```


<!-- Same query, 25 rows fewer -->
<!-- Same query, 25 rows fewer. One WHERE changes the answer. -->
<!-- **Change it.** Later we will compute r for both versions and compare. -->

---

<!-- _class: section -->

# 5. Correlation

---

# One relationship, or two?

![Hotel cost against fun, split by humidity](asset:hotel-pair.png)

*The same relationship in both panels — but the spread is very different, and so is r.*

---

```sql-live db=stats_demo layout=rows height=268
SELECT COUNT(*)                                AS stays,
       ROUND(AVG(fun_reported), 2)             AS mean_fun,
       ROUND(STDDEV_SAMP(fun_reported), 2)     AS sd_fun
FROM   hotel_fun
WHERE  humidity < 60;
```


<!-- The typical distance from the average -->
<!-- STDDEV_SAMP is the typical distance from the average — the n−1 version, as in week 7. -->
<!-- **Change it.** Make `< 60` into `>= 60` and compare the two spreads. -->
<!-- Expected: dry half n=150, mean 5.93, SD 2.26. Humid half n=150, mean 5.70, SD 1.17. Same relationship, much less noise in the humid half — which is why its r is more than twice as large. -->

---

# Does a relationship exist?

- Does a relationship exist at all?
- If so, is it **positive** or **negative**?
- Is it **strong** or **weak**?

One number answers all three. Over the next few slides we are going to **build** that number, one piece at a time.

<!-- The old deck showed R's `cor(v1, v2)` here. MariaDB has no such function — which is a teaching gift, because it means we have to build it, and building it is the only way to see what it actually measures. -->

---

# The formula

![The Pearson correlation formula](asset:rho-formula.png)

**Top:** for each point, multiply (how far x is from its average) × (how far y is from its average), then add them all up.

**Bottom:** the square root of (sum of squared x-deviations) × (sum of squared y-deviations).

---

```sql-live db=stats_demo layout=rows height=337
WITH d AS (
  SELECT firefighters     AS x,
         property_damage  AS y
  FROM   fire_incidents
)
SELECT AVG(x) AS mx,
       AVG(y) AS my
FROM   d;
```


<!-- Step 1 — give a query a name -->
<!-- WITH gives a query a name, so the next query can use it. -->
<!-- **Run it.** `d` is just our two columns, renamed `x` and `y`. From here on, **the only thing that ever changes is `d`.** -->

---

```sql-live db=stats_demo layout=rows limit=5 height=420
WITH d AS (
  SELECT firefighters AS x, property_damage AS y
  FROM   fire_incidents
),
stats AS (
  SELECT AVG(x) AS mx, AVG(y) AS my FROM d
)
SELECT d.x - s.mx AS dx,
       d.y - s.my AS dy
FROM   d CROSS JOIN stats s
LIMIT  10;
```


<!-- Step 2 — how far is each row from average? -->
<!-- CROSS JOIN staples the two averages onto every row. -->
<!-- **Run it.** `dx` and `dy` say how far *this* row sits from average. -->

---

```sql-live db=stats_demo layout=rows height=360
WITH d AS (
  SELECT firefighters AS x, property_damage AS y
  FROM   fire_incidents
),
stats AS (
  SELECT AVG(x) AS mx, AVG(y) AS my FROM d
)
SELECT SUM((d.x - s.mx) * (d.y - s.my)) AS sxy
FROM   d CROSS JOIN stats s;
```


<!-- Step 3 — multiply the deviations and add them up -->
<!-- Big and positive when x and y are above average together, and below together. -->
<!-- **Run it.** This one number is the whole top of the formula. -->

---

```sql-live db=stats_demo layout=rows height=407
WITH d AS (
  SELECT firefighters AS x, property_damage AS y
  FROM   fire_incidents
),
stats AS (
  SELECT AVG(x) AS mx, AVG(y) AS my FROM d
)
SELECT SUM((d.x - s.mx) * (d.y - s.my)) AS sxy,
       SUM(POW(d.x - s.mx, 2))          AS sxx,
       SUM(POW(d.y - s.my, 2))          AS syy
FROM   d CROSS JOIN stats s;
```


<!-- Step 4 — square the deviations -->
<!-- POW(x, 2) squares. Squaring throws the minus signs away. -->
<!-- **Run it.** Now we have all three sums the formula needs. -->

---

```sql-live db=stats_demo layout=rows height=500
WITH d AS (
  SELECT firefighters AS x, property_damage AS y
  FROM   fire_incidents
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


<!-- Step 5 — and there is r -->
<!-- The formula from two slides ago, piece by piece. Expect 0.967. -->
<!-- **Run it.** `SQRT` is the square root. Expect **0.967**. -->

---

```sql-live db=stats_demo layout=rows height=500
WITH d AS (
  SELECT meters_run AS x, opinion AS y      -- <- change only this block
  FROM   marathon_opinion
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


<!-- Now point it at anything -->
<!-- Edit ONLY the first block: the table, the two columns, a WHERE. -->
<!-- **Change it.** Go back to any scatter in this deck and check its r yourself. -->
<!-- Answer key — every one of these is just a different `d`: marathon, raw -0.770 marathon, LOG10(x) -0.948 belgian_beer +0.127 belgian_beer WHERE is_influential = 0 +0.038 hotel_fun WHERE humidity < 60 +0.345 hotel_fun WHERE humidity >= 60 +0.847 chocolate_nobel +0.800 fun_survey (during/after) +0.529 -->

---

# The same points, at five values of ρ

![Five scatters from ρ = −1 to ρ = +1](asset:rho-strip.png)

*The same points in all five panels — only the correlation changes.*

<!-- suggestion: the old deck had a slider here. It resampled on every tick, so the cloud "boiled", and it printed the slider's ρ rather than the sample's r. These panels hold the points fixed and print both. The interactive version returns in a later release. -->

---

<!-- _class: callout -->

# ρ = 0.90 is **not** 90%

The correlation coefficient is a **ratio**, not a percent.

The number that *is* a share is **R²**, the coefficient of determination — and it is just r squared.

---

# R² is the shared variation

![Two circles overlapping by R²](asset:r2-overlap.png)

*The shared area really is R² — at R² = 0.50 the circles share exactly half their area.*

---

```sql-live db=stats_demo layout=rows height=523
WITH d AS (
  SELECT firefighters AS x, property_damage AS y
  FROM   fire_incidents
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
SELECT ROUND(sxy / SQRT(sxx * syy), 3)        AS r,
       ROUND(POW(sxy / SQRT(sxx * syy), 2), 3) AS r_squared
FROM   sums;
```


<!-- r² in SQL -->
<!-- r = 0.90 is not 90 %. r² = 0.81 is the shared share. -->
<!-- **Change it.** Point `d` at the beer table: r = 0.127, but r² = 0.016. -->

---

<!-- _class: section -->

# Interpreting Correlation Coefficients

---

# Large and small coefficients

- **Large coefficients** — closer to **±1.00** → stronger relationships
- **Small coefficients** — close to **0.00** → weaker relationships

---

# The scale, end to end

- **ρ = 0.00** — no relationship
- **ρ = ±1.00** — a perfect relationship

The **sign** tells you the direction. The **absolute value** tells you the strength.

---

# What the correlation coefficient is

<!-- _class: quote -->

It provides you with a **single summary number** telling you the average amount that a person's score on one variable is related to another variable.

---

# What it is not

The **correlation coefficient (ρ)** is **not** a measure of the percent of one variable that is accounted for by the other variable.

**R²** (the coefficient of determination) **is** a measure of the percent of variation in one variable that is accounted for by the other.

---

# Large R² values

...mean **more shared variation**, which means **more accurate predictions** are possible about one variable based on nothing more than knowledge of the other.

---

<!-- _class: section -->

# When to use correlations?

---

# Both variables on an interval or ratio scale

![Interval and ratio scales compared](asset:scale-types.png)

*An interval scale has equal steps but no true zero. A ratio scale has both.*

---

# The traits are normally distributed in the population

![A bivariate normal density surface](asset:bivariate-normal.png)

*Your sample need not look normal. The claim is about the population it came from.*

---

# The relationship is best described by a straight line

![Marathon data on linear and log scales, side by side](asset:marathon-pair.png)

*If the relationship is curved, Pearson's ρ is the wrong summary. Should you use ρ on the left?*

---

# Homoscedasticity

![Constant spread versus fanning spread](asset:heteroscedasticity.png)

The spread of Y should be roughly the **same at every value of X**.

*Example: income varies far more among those with less education than among those with more — so income on education is heteroscedastic.*

---
<!-- DECK-SPLIT: b -->
<!-- _class: section -->

# Regression Analysis

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
