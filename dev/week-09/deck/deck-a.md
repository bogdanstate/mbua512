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

*Figure: Tyler Vigen, [Spurious Correlations](https://tylervigen.com/spurious/correlation/1248), used with credit.*
---
# Confusing Question ⇒ Confusing Answer

![Rasinski 1989 Table 2, Welfare block: 'assistance to the poor' versus 'welfare', 1984-86](asset:rasinski-1989-table2-welfare.png)

If you cannot say plainly what you are asking, no amount of data will answer it.

*Rasinski, K. A. (1989). The effect of question wording on public support for government spending. *Public Opinion Quarterly*, 53(3), 388–394, Table 2. [doi:10.1086/269158](https://doi.org/10.1086/269158)*
---
# Confusing Question ⇒ Confusing Answer (full table)

![Rasinski 1989 Table 2 in full: crime, drug addiction and welfare spending items](asset:rasinski-1989-table2.png)

*Rasinski, K. A. (1989). The effect of question wording on public support for government spending. *Public Opinion Quarterly*, 53(3), 388–394, Table 2. [doi:10.1086/269158](https://doi.org/10.1086/269158)*

<!-- The full table, for reference. The crime and drug-addiction blocks show the same effect at a smaller size: "halting the rising crime rate" beats "law enforcement" by ~15 points, "drug addiction" beats "drug rehabilitation" by ~15. Welfare is the extreme case, not the only one. -->

<!-- THE POINT: the same GSS respondents, in the same year, say too little is spent on "assistance to the poor" (about 64%) but on "welfare" (about 20-25%). One word, roughly 40 points. The question wording IS the finding. -->
<!-- Read the Welfare block: "Assistance to the poor" against "Welfare", 1984-86. The rest of the table shows the same effect is not universal — some pairs barely move — which is why it is worth asking WHICH words matter. -->
<!-- The old deck stacked "Confusing Question / ⇓ / Confusing Answer" vertically, so its arrow pointed DOWN. Here the three parts sit on one line, so the arrow points RIGHT (⇒). The `callout` class is gone too: it draws a 6px blue rule down the left edge of the whole section, which on a slide this short reads as a stray blue bar rather than as emphasis. -->
---
<!-- _class: section -->

# 2. Identify Two Variables to Answer Your Question
---
# Fun During, and Fun After

Two measurements on the same person:

- **Fun during** the activity — how it felt at the time
- **Fun after** the activity — how it feels looking back

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

*500 fire incidents. r = +0.967.*
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

<!-- The three fire slides are the argument: firefighters correlate with damage at 0.967, but the SIZE of the fire drives both — structures burned runs 0.979 with firefighters and 0.987 with damage. A variable that drives both sides of a correlation like this is a CONFOUNDER. The word comes back on the Prediction ≠ Causation slide at the end. -->
---
<!-- _class: section -->

# Negative (Inverse) Relationship
---
![Property damage against distance from the ignition point to stored flammables](asset:fire-distance-damage.png)

*500 fire incidents. The closer a fire starts to stored flammables, the more it destroys. r = −0.880.*

<!-- A negative relationship, and a straight one: no transform, no log axis. The SQL is on the next slide. -->
---
```sql-live db=stats_demo layout=rows height=344
SELECT COUNT(*)                            AS incidents,
       MIN(ignition_to_flammables_m)       AS nearest,
       MAX(ignition_to_flammables_m)       AS furthest,
       ROUND(AVG(property_damage), 0)      AS mean_damage
FROM   fire_incidents;
```

<!-- How far does the data stretch? -->
<!-- MIN and MAX are the ends. -->
<!-- The ignition point ranges from 1 m to 60 m from the nearest flammables. Expect 500 incidents and a mean damage around 1,067,049. -->
---
<!-- _class: section -->

# No (Weak) Relationship
---
![Property damage against the first engine's fuel level at dispatch](asset:fire-fuel-damage.png)

*500 fire incidents. Fuel in the first responding engine, against what the fire destroyed. r = +0.119.*

<!-- Fire-related, continuous, carefully recorded — and causally nothing to do with how much burns. A weak correlation that should be zero; the appendix shows why it is not. -->
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

<!-- The old deck showed R's `cor(v1, v2)` here. MariaDB has no such function — which is a teaching gift, because it means we have to build it, and building it is the only way to see what it actually measures. -->
---
# The same points, at five values of ρ

![Five scatters from ρ = −1 to ρ = +1](asset:rho-strip.png)

*The same points in all five panels — only the correlation changes.*

<!-- suggestion: the old deck had a slider here. It resampled on every tick, so the cloud "boiled", and it printed the slider's ρ rather than the sample's r. These panels hold the points fixed and print both. The interactive version returns in a later release. -->
---
<!-- _class: callout -->

# ρ = 0.90 is **not** 90%

The correlation coefficient is a **ratio**, not a percent.

<!-- The number that IS a share is R², the coefficient of determination — and it is just r squared. That is the next two slides. -->
---
# R² is the shared variation

![Two circles overlapping by R²](asset:r2-overlap.png)

*The shared area really is R² — at R² = 0.50 the circles share exactly half their area.*
---
<!-- _class: section -->

# Interpreting Correlation Coefficients
---
# Reading ρ

- **±1.00** is a perfect relationship, **0.00** none; the closer to ±1, the stronger.
- One number: how much a person's score on one variable goes with their score on the other.
- ρ is **not** a share of anything. **R² = ρ²** is — the share of variation in one variable accounted for by the other; the larger, the better one predicts the other.

<!-- The sign tells you the direction; the absolute value tells you the strength. -->
<!-- "Average amount that a person's score on one variable is related to another" is the careful phrasing: ρ is about how the two move together across people, not about any one person. -->
<!-- The third bullet is the one students get wrong. ρ = 0.90 does not mean 90% of anything; ρ² = 0.81 does — 81% of the variation held in common. The R² slides just before this one make the same point with a picture and with SQL. -->
<!-- Larger R² means more shared variation, so a prediction of one variable from the other is more accurate. That is the whole practical pay-off of the number. -->
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

![Property damage against distance from the ignition point, a straight-line relationship](asset:fire-distance-damage.png)

*This one is straight, so ρ describes it honestly: r = −0.880. If a relationship curves, ρ is the wrong summary for it.*
---
# Homoscedasticity

![Constant spread versus fanning spread](asset:heteroscedasticity.png)

The spread of Y should be roughly the **same at every value of X**.

*Example: income varies far more among those with less education than among those with more — so income on education is heteroscedastic.*
---
<!-- _class: section -->

# Appendix
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


<!-- Pearson's r, in one query -->
<!-- This is the finished article: the formula from two slides ago, assembled. It has a name — the PEARSON correlation coefficient, written r. Everything the deck has called "r" so far is Pearson's r. -->
<!-- Pearson measures how close the points lie to a straight LINE. That is the whole assumption, and it is the one Spearman relaxes in a moment. -->
<!-- **Run it.** `SQRT` is the square root. Expect **0.967**. -->
---
```sql-live db=stats_demo layout=rows height=500
WITH d AS (
  SELECT ignition_to_flammables_m AS x, property_damage AS y   -- <- change only this
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


<!-- Now point it at anything -->
<!-- Edit ONLY the first block: the table, the two columns, a WHERE. -->
<!-- **Change it.** Go back to any scatter in this deck and check its r yourself. -->
<!-- Answer key — every one of these is just a different `d`: fire distance/damage -0.880; fire fuel/damage +0.119; fire fuel/damage WHERE is_influential = 0  -0.015; hotel_fun WHERE humidity < 60  +0.345; WHERE humidity >= 60  +0.847; fun_survey (during/after) +0.529. -->
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
<!-- **Change it.** Point `d` at the engine-fuel column: r = +0.119, but r² = 0.014 — a hundredth of the variation. -->
---
# The formula

![The Pearson correlation formula](asset:rho-formula.png)

**Top:** for each point, multiply (how far x is from its average) × (how far y is from its average), then add them all up.

**Bottom:** the square root of (sum of squared x-deviations) × (sum of squared y-deviations).
---
```sql-live db=stats_demo layout=rows height=414 limit=5
WITH d AS (
  SELECT meters_run AS x, opinion AS y
  FROM   marathon_opinion
)
SELECT x,
       y,
       RANK() OVER (ORDER BY x) AS rank_x,
       RANK() OVER (ORDER BY y) AS rank_y
FROM   d
LIMIT  10;
```

<!-- Ranks -->
<!-- This follows straight on from the marathon slides above: same 400 runners, same two columns. -->
<!-- One new idea: instead of the VALUES, use their positions in order. Shortest run = rank 1, next = rank 2, and so on. -->
<!-- RANK() OVER (ORDER BY x) is a WINDOW function — the first this deck has used. A plain aggregate collapses the rows into one answer; a window function keeps every row and computes something against the whole table alongside it. Here: "where does this row sit in the sorted order?" -->
<!-- Watch the two columns come apart: the longest runs carry the LOWEST opinion ranks. That is the relationship, expressed without a single distance in metres. -->
<!-- CAUTION, and the next slide fixes it: RANK() gives tied values the SAME rank and then skips (1, 2, 2, 4). Spearman is defined on AVERAGE ranks, so the tied pair should both be 2.5, not 2. The opinion column has a lot of ties — 315 of 400 rows share a value with something — so the next slide does it properly. -->
---
```sql-live db=stats_demo layout=rows height=549
WITH r AS (   -- the ONLY new part: values -> their average ranks
  SELECT RANK() OVER (ORDER BY meters_run)
           + (COUNT(*) OVER (PARTITION BY meters_run) - 1)/2.0 AS x,
         RANK() OVER (ORDER BY opinion)
           + (COUNT(*) OVER (PARTITION BY opinion) - 1)/2.0 AS y
  FROM   marathon_opinion
),
stats AS (   -- from here down, identical to the Pearson query
  SELECT AVG(x) AS mx, AVG(y) AS my FROM r
),
sums AS (
  SELECT SUM((r.x - s.mx) * (r.y - s.my)) AS sxy,
         SUM(POW(r.x - s.mx, 2))          AS sxx,
         SUM(POW(r.y - s.my, 2))          AS syy
  FROM   r CROSS JOIN stats s
)
SELECT ROUND(sxy / SQRT(sxx * syy), 3) AS spearman_rho
FROM   sums;
```

<!-- Spearman's ρ = Pearson's r on the ranks -->
<!-- There is no new formula here. `stats` and `sums` are byte-identical to the Pearson query; the ONLY change is that `d` has been replaced by `r`, the ranks. Spearman's rho IS Pearson's r computed on ranks. -->
<!-- The average-rank correction: RANK() + (COUNT(*) OVER (PARTITION BY value) - 1) / 2 turns 1, 2, 2, 4 into 1, 2.5, 2.5, 4. With 315 tied rows in the opinion column this matters — it is the difference between the textbook definition and an approximation. -->
<!-- Expect -0.950. Now compare: Pearson on these same raw distances was -0.770, and it only reached -0.948 after we took LOG10. Spearman gets there with NO transform, because it never needed the relationship to be a straight line — only for it to keep going the same way. -->
---
# Pearson or Spearman?

| | **Pearson's r** | **Spearman's ρ** |
|---|---|---|
| measures | a **straight-line** relationship | any **one-way** relationship |
| needs | interval or ratio data | ranks — **ordinal is fine** |
| outliers | one stray point can swing it | barely moves it |
| transforms | change it (LOG10: −0.770 → −0.948) | do not change it at all |
| computed on | the values | the ranks of the values |

<!-- The marathon data made the case twice over. Pearson said -0.770 on the raw distances and -0.948 once we logged them — the SAME data, two different answers, because Pearson was measuring straightness and the raw curve was not straight. Spearman said -0.950 either way: a log is a one-way transform, and rank order is all Spearman looks at. -->
<!-- The engine-fuel slide is the outlier case: 12 incidents out of 500 hold Pearson's r up at +0.119, and dropping them collapses it to -0.015. Spearman is far less impressed by a handful of extreme points, because it only sees their rank. -->
<!-- Rule of thumb: if you are about to reach for a transform to "straighten" a relationship before correlating it, ask whether you wanted Spearman all along. -->
---
![The twelve incidents that hold up the fuel correlation](asset:fire-fuel-influential.png)

*The 12 rows flagged `is_influential = 1` are the largest |DFBETA| for the slope. Drop them and r falls from +0.119 to −0.015.*

<!-- A handful of points hold the slope up -->
<!-- Twelve of 500 incidents produce the entire apparent relationship between engine fuel and damage: the twelve worst fires, which happened to dispatch with near-full tanks. -->
<!-- Computing DFBETA in SQL needs leverage, residuals and a ranked cut-off — three new ideas at once — so the flag ships with the data. Its formula is in the table COMMENT. -->
---
```sql-live db=stats_demo layout=rows height=344 limit=5
SELECT engine_fuel_pct,
       property_damage
FROM   fire_incidents
WHERE  is_influential = 0
LIMIT  10;
```

<!-- Same query, 12 rows fewer -->
<!-- One WHERE changes the answer. -->
<!-- Point the r query at this and you get -0.015 instead of +0.119. -->