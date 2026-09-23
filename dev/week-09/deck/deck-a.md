---
marp: true
theme: mbua512
paginate: true
title: "MBUA512 — Multivariate Relationships and Correlation"
---

<!-- _class: title -->

# Multivariate Relationships and Correlation

## MBUA 512

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