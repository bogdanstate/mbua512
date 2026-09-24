---
marp: true
theme: mbua512
paginate: true
title: "MBUA512 — Probability and A/B Testing"
---

<!-- _class: title -->

# Probability and A/B Testing

## MBUA 512

<!-- Repo rule (mbua512/CLAUDE.md): title slides carry the title and the course name only — no author names. -->
<!-- The arc: chance, then sampling variability, then one real experiment built in SQL, then every way the answer can still be wrong. -->

---

<!-- _class: section -->

# Part 1. Chance

---

# Last week we measured a relationship

- Week 9 asked **how strongly** two things move together — r, a line, R²
- None of it answered **"did this change cause that?"**
- An experiment is the one tool that does
- Today: what has to be true before a difference counts as evidence

---

# Probability is a long-run share

A probability is the share of times something happens **if you keep doing it**.

| | |
|---|---|
| a fair coin lands heads | 0.5 |
| a fair die shows a six | 1/6 ≈ 0.167 |
| a visitor to the page buys something | 0.0255 |

<!-- The third row is the one that matters today: a conversion rate IS a probability estimate, measured the only way we can measure one — by watching a lot of people and counting. -->
<!-- The first two we can reason about from the shape of the object. The third we cannot: nobody hands you the true rate, so every number in this lecture is an ESTIMATE of one, and estimates wobble. That wobble is the whole subject. -->

---

# Two events, one table

Out of 100 visitors:

| | bought | did not buy | total |
|---|---:|---:|---:|
| **saw the ad** | 3 | 47 | 50 |
| **saw the PSA** | 2 | 48 | 50 |
| **total** | 5 | 95 | 100 |

<!-- This 2x2 is the entire data structure of an A/B test. Everything today is arithmetic on four numbers in this shape. -->
<!-- Two rates read off it: 3/50 = 6% among ad-seers, 2/50 = 4% among PSA-seers. The question for the rest of the lecture is whether a gap that size, on numbers that size, means anything at all. -->
<!-- Illustrative numbers, not from a dataset. -->

---

# Independence

Two events are **independent** when knowing one happened tells you nothing about the other.

- Two coin flips: independent. The coin has no memory
- A person's arm and their purchase, **if the ad does nothing**: independent
- A person's arm and their purchase, **if the ad works**: not independent

<!-- Independence is not a property of the world we assume for convenience — today it is the thing being TESTED. "The ad does nothing" is exactly the statement "arm and outcome are independent", and the z statistic measures how badly the data disagrees with it. -->

---

# Expected value

Multiply each outcome by its probability, and add.

- A coin flip counted as heads = 1, tails = 0: 0.5 × 1 + 0.5 × 0 = **0.5**
- 100 flips of a fair coin: **50 heads expected**
- 1,000 visitors at a 2.5 % conversion rate: **25 purchases expected**

<!-- Expected does not mean likely. You will very rarely get exactly 50 heads in 100 flips — about 8 % of the time. The expected value is the centre of the spread, not a prediction of the result. -->

---

# Expect 50, get something else

![Ten runs of 100 fair coin flips, each landing on a different number of heads](asset:coin-runs.png)

*Ten runs of 100 flips of the same fair coin. Simulated, seed 20261010.*

<!-- Every run used the SAME fair coin. The number of heads still ranged from 45 to 54. -->
<!-- Point at those two runs: 54 against 45 is a 9-point gap between two things that are identical by construction. If they had been two versions of a web page, somebody would have shipped one. -->

---

# The law of large numbers

![The running share of heads over 5,000 flips, settling towards 0.5](asset:lln.png)

*One run of 5,000 flips. The share of heads settles towards 0.5 — slowly. Simulated, seed 20261011.*

<!-- The share converges, but look at the horizontal axis: it takes hundreds of flips to stop swinging and thousands to look settled. Early on, the line is wild. -->
<!-- This is the honest answer to "how long do we have to run the test?". Not until the result looks good — until the estimate has stopped moving, which is a property of n, not of the result. -->

---

# How surprising is 60 heads in 100?

![The binomial distribution for 100 fair coin flips, with 60 heads marked in the tail](asset:binomial.png)

*All the possible results of 100 fair flips, and how often each happens.*

<!-- 50 is the commonest single result, at about 8 %. Anything from 40 to 60 is unremarkable. -->
<!-- 60 heads or more happens about 2.8 % of the time with a fair coin — so 60 is surprising, but not impossible. That number, "how often would chance alone do this well", is a p-value. We have just computed one without naming it. -->
<!-- 70 heads would be a different story: about 4 in 100,000. -->

---

<!-- _class: section -->

# Part 2. Sampling variability

---

# Two identical things still give two numbers

![Two samples drawn from the same population, giving different sample rates](asset:two-samples.png)

*Both samples come from the same population, with the same true rate of 0.20. Simulated, seed 20261038.*

<!-- Nothing distinguishes these two groups except which people happened to land in each. The rates still differ. -->
<!-- So the question is never "are the two numbers different?" — they always are. It is "are they further apart than this kind of accident usually manages?". -->

---

# The sampling distribution

![The distribution of the difference between two arms in 2,000 simulated A/A tests](asset:null-dist.png)

*2,000 simulated experiments where both arms are identical. Simulated, seed 20261013.*

<!-- This is the single most important picture in the lecture. It is what "different by chance" looks like when there is NO real difference: two arms of 5,000 people each, both at exactly 20 %, run 2,000 times. -->
<!-- The differences pile up around zero and thin out either side. Most land within about +/- 1.6 percentage points. -->
<!-- A real experiment gives you ONE draw from a picture like this. The test asks where that draw sits. -->

---

# Where 1.96 comes from

Measure any result in **standard errors** from zero, and this curve is always the same shape.

| how far out | share of results beyond it, both sides |
|---|---|
| 1 standard error | 32 % |
| **1.96** standard errors | **5 %** |
| 2.58 standard errors | 1 % |
| 3 standard errors | 0.3 % |

<!-- 1.96 is not magic and not a law of nature. It is the width of the middle 95 % of that bell — a convention about how rare is rare enough, which we will come back to and criticise. -->
<!-- The standard error is the typical width of the picture on the previous slide. Once a result is expressed in those units, one table serves every experiment ever run. -->

---

<!-- _class: section -->

# Part 3. An experiment

---

# A/B testing in one line

**Randomise** people into two groups, change **one thing**, measure the **same outcome** in both.

- Randomise — so the groups differ only by chance, not by who they are
- One thing — or you cannot say which change did it
- The same outcome, decided in advance — or you will find one that worked

<!-- Randomisation is what turns a comparison into evidence. Without it you are comparing people who chose differently, and last week's confounder problem is back. -->

---

# Fix these before you look

1. **The metric.** One number, defined precisely, decided now
2. **The arms.** Who is in each, and how they are assigned
3. **The sample size.** How many, decided before the first result arrives

<!-- All three are about removing your own judgement from the moment when you can see the answer. Every one of them is cheap to decide beforehand and impossible to defend afterwards. -->
<!-- Point 3 is the one that gets broken, and the peeking slides later are about exactly that. -->

---

<!-- _class: section -->

# Part 4. The data

---

# A marketing experiment, 588,101 people

Most people saw an **advertisement**. A small control group saw a **public service announcement** in the same size and place.

- One row per person, one outcome: did they buy?
- `ad` — the experimental group
- `psa` — the control group

*Kaggle, "Marketing A/B Testing", uploaded by Favio Vázquez, 2021. CC0 1.0 (public domain).*

<!-- Real data, and a clean licence — CC0, a public-domain dedication. What the licence does NOT settle is provenance: the dataset names no advertiser, no product, no country, no date, and there is no paper. Worth saying out loud rather than glossing. -->
<!-- Its flaws are the reason we chose it. The arms are 24:1, not 1:1, and the ads-seen column confounds the outcome. Both are later slides. -->

---

```sql-live db=stats_demo layout=rows limit=5 height=376
SELECT user_id,
       test_group,
       converted,
       total_ads
FROM   ab_marketing
LIMIT  10;
```

[//]: # (sql-live result: stats_demo · 10 rows · 25 ms · pinned 2026-09-24)

| user_id | test_group | converted | total_ads |
| --- | --- | --- | --- |
| 900000 | psa | 0 | 2 |
| 900001 | psa | 0 | 23 |
| 900002 | psa | 0 | 86 |
| 900003 | psa | 0 | 97 |
| 900004 | psa | 0 | 26 |

[//]: # (end sql-live result)

<!-- What one row looks like -->
<!-- Rung 24. Nothing new — SELECT and LIMIT, as in week 9. -->
<!-- **Run it.** One row per person: which arm they were in, whether they bought, how many ads they saw. -->
<!-- `converted` is already 0 or 1, which is what makes the next few slides possible. -->

---

```sql-live db=stats_demo layout=rows height=329
SELECT test_group,
       COUNT(*) AS people
FROM   ab_marketing
GROUP   BY test_group;
```

[//]: # (sql-live result: stats_demo · 2 rows · 251 ms · pinned 2026-09-24)

| test_group | people |
| --- | --- |
| ad | 564577 |
| psa | 23524 |

[//]: # (end sql-live result)

<!-- How many landed in each arm -->
<!-- Rung 25. Nothing new — COUNT and GROUP BY. -->
<!-- **Run it.** Expect 564,577 in `ad` and 23,524 in `psa`. -->
<!-- That is 96 % against 4 %, a ratio of 24 to 1. Hold that thought — it is a whole slide later on. -->

---

```sql-live db=stats_demo layout=rows height=352
SELECT test_group,
       COUNT(*)       AS people,
       SUM(converted) AS buyers
FROM   ab_marketing
GROUP  BY test_group;
```

[//]: # (sql-live result: stats_demo · 2 rows · 713 ms · pinned 2026-09-24)

| test_group | people | buyers |
| --- | --- | --- |
| ad | 564577 | 14423 |
| psa | 23524 | 420 |

[//]: # (end sql-live result)

<!-- Adding up a column of 0s and 1s counts the 1s -->
<!-- Rung 26. The new IDEA: SUM over a 0/1 column is a count of the 1s. No new function. -->
<!-- **Run it.** Expect 14,423 buyers in `ad` and 420 in `psa`. -->
<!-- Read the two numbers side by side before computing anything: 14,423 against 420. The arms are nothing like the same size, so the raw counts cannot be compared. That is why the next slide divides. -->

---

```sql-live db=stats_demo layout=rows height=376
SELECT test_group,
       COUNT(*)                        AS people,
       SUM(converted)                  AS buyers,
       ROUND(SUM(converted) / COUNT(*), 4) AS rate
FROM   ab_marketing
GROUP  BY test_group;
```

[//]: # (sql-live result: stats_demo · 2 rows · 687 ms · pinned 2026-09-24)

| test_group | people | buyers | rate |
| --- | --- | --- | --- |
| ad | 564577 | 14423 | 0.0255 |
| psa | 23524 | 420 | 0.0179 |

[//]: # (end sql-live result)

<!-- The conversion rate per arm -->
<!-- Rung 27. Nothing new — a division and ROUND, both from week 9. -->
<!-- **Run it.** Expect 0.0255 for `ad` and 0.0179 for `psa`. -->
<!-- 2.55 % against 1.79 %. In MariaDB `/` is decimal division, so no integer-division trap. -->

---

# Two rates. One is higher. So what?

![The two conversion rates as bars, 2.55 % against 1.79 %](asset:marketing-rates.png)

*`ad` 2.5547 % · `psa` 1.7854 % · a gap of 0.7692 percentage points.*

<!-- A bar chart of two rates is where most business A/B reports stop. It shows the difference and says nothing about whether the difference is real. -->
<!-- Nothing on this slide distinguishes it from a picture of two coins that came up differently. The rest of the lecture is about the missing part. -->

---

```sql-live db=stats_demo layout=rows height=329
SELECT SUM(CASE WHEN test_group = 'ad'  THEN 1 ELSE 0 END) AS ad_people,
       SUM(CASE WHEN test_group = 'psa' THEN 1 ELSE 0 END) AS psa_people,
       COUNT(*)                                            AS everyone
FROM   ab_marketing;
```

[//]: # (sql-live result: stats_demo · 1 row · 387 ms · pinned 2026-09-24)

| ad_people | psa_people | everyone |
| --- | --- | --- |
| 564577 | 23524 | 588101 |

[//]: # (end sql-live result)

<!-- CASE WHEN turns any condition into a 1 or a 0 -->
<!-- Rung 28. The new IDEA: CASE WHEN ... THEN 1 ELSE 0 END, so SUM can count anything, not just a column that is already 0/1. -->
<!-- **Run it.** The same two arm sizes as before, now side by side in ONE row instead of two. -->
<!-- That shape — counts as columns of a single row — is what the next slides need, because a standard error wants both arms' numbers in the same row at the same time. -->

---

<!-- _class: section -->

# Part 5. Is it real?

---

# The null hypothesis

Start by assuming **the ad does nothing**.

- Then both arms are the same coin, and the gap is an accident of who landed where
- Compute how big an accident it would have to be
- If that accident is implausible enough, stop believing the assumption

<!-- This is a proof by contradiction with a volume knob instead of a contradiction. We never prove the ad worked; we show that "it did nothing" makes the data awkward. -->
<!-- Cassie Kozyrkov's framing for business audiences: the null is the DEFAULT ACTION — what you would do if the data never arrived. The test asks whether the evidence is strong enough to move you off it. -->

---

# Why we pool

If the ad does nothing, both arms are draws from **one** rate.

- So estimate that one rate from everybody: (14,423 + 420) ÷ 588,101
- **Pooled rate = 0.0252**
- The pooled rate is used only to work out how much two arms of these sizes would wobble apart

<!-- Pooling is not averaging the two answers for its own sake — it is building the null world. Under the null there is only one rate, so the best estimate of it uses all the data. -->
<!-- Note the asymmetry: the rates we compare come from the arms separately, but the wobble we compare them against comes from the pooled rate. -->

---

```sql-live db=stats_demo layout=rows height=468
WITH arms AS (
  SELECT SUM(CASE WHEN test_group = 'ad'  THEN converted ELSE 0 END) AS k_ad,
         SUM(CASE WHEN test_group = 'ad'  THEN 1 ELSE 0 END)         AS n_ad,
         SUM(CASE WHEN test_group = 'psa' THEN converted ELSE 0 END) AS k_psa,
         SUM(CASE WHEN test_group = 'psa' THEN 1 ELSE 0 END)         AS n_psa
  FROM   ab_marketing
)
SELECT k_ad, n_ad, k_psa, n_psa,
       ROUND((k_ad + k_psa) / (n_ad + n_psa), 6) AS pooled
FROM   arms;
```

[//]: # (sql-live result: stats_demo · 1 row · 541 ms · pinned 2026-09-24)

| k_ad | n_ad | k_psa | n_psa | pooled |
| --- | --- | --- | --- | --- |
| 14423 | 564577 | 420 | 23524 | 0.025239 |

[//]: # (end sql-live result)

<!-- Four counts and the pooled rate -->
<!-- Rung 29. Nothing new — WITH and CASE WHEN, each met once already. -->
<!-- **Run it.** Expect k_ad 14,423, n_ad 564,577, k_psa 420, n_psa 23,524, pooled 0.025239. -->
<!-- `arms` is the CTE every remaining slide builds on. It is four counts in one row, exactly the 2x2 from Part 1. From here nothing new is read from the table. -->

---

# The standard error of a difference

How far apart two arms of **these sizes** would drift, if nothing were going on.

**SE = √( p (1 − p) (1/n₁ + 1/n₂) )**

- p is the pooled rate — the null world's single rate
- The n's are the two arm sizes
- **Small arms make the SE big.** The 23,524-person control is what sets it here

<!-- Read the formula from the inside out: p(1-p) is how variable a single coin at that rate is; the bracket of reciprocals says two small groups wobble more than two large ones. -->
<!-- The 1/n terms ADD, so the smaller arm dominates: 1/23,524 is 24 times 1/564,577. Half a million people in the ad arm buy you almost nothing once the control is only 23,524. -->

---

```sql-live db=stats_demo layout=rows height=538
WITH arms AS (
  SELECT SUM(CASE WHEN test_group = 'ad'  THEN converted ELSE 0 END) AS k_ad,
         SUM(CASE WHEN test_group = 'ad'  THEN 1 ELSE 0 END)         AS n_ad,
         SUM(CASE WHEN test_group = 'psa' THEN converted ELSE 0 END) AS k_psa,
         SUM(CASE WHEN test_group = 'psa' THEN 1 ELSE 0 END)         AS n_psa
  FROM   ab_marketing
),
pooled AS (
  SELECT (k_ad + k_psa) / (n_ad + n_psa) AS p, n_ad, n_psa FROM arms
)
SELECT ROUND(p, 6)                                          AS pooled,
       ROUND(SQRT(p * (1 - p) * (1.0/n_ad + 1.0/n_psa)), 6) AS se
FROM   pooled;
```

<!-- The standard error, in SQL -->
<!-- Rung 30. Nothing new — SQRT, from week 9. -->
<!-- **Run it.** Expect pooled 0.025239 and se 0.001044. -->
<!-- 0.001044 is about a tenth of a percentage point. That is the yardstick: the observed gap is 0.77 pp, so it is many yardsticks from zero. The next slide says how many. -->

---

```sql-live db=stats_demo layout=rows height=496
WITH arms AS (
  SELECT SUM(CASE WHEN test_group = 'ad'  THEN converted ELSE 0 END) AS k_ad,
         SUM(CASE WHEN test_group = 'ad'  THEN 1 ELSE 0 END)         AS n_ad,
         SUM(CASE WHEN test_group = 'psa' THEN converted ELSE 0 END) AS k_psa,
         SUM(CASE WHEN test_group = 'psa' THEN 1 ELSE 0 END)         AS n_psa
  FROM   ab_marketing
),
rates AS (
  SELECT k_ad/n_ad AS r_ad, k_psa/n_psa AS r_psa, n_ad, n_psa,
         (k_ad + k_psa) / (n_ad + n_psa) AS p  FROM arms
)
SELECT ROUND(r_ad, 4) AS rate_ad, ROUND(r_psa, 4) AS rate_psa,
       ROUND(ABS(r_ad - r_psa)
             / SQRT(p*(1-p) * (1.0/n_ad + 1.0/n_psa)), 3) AS z
FROM   rates;
```

[//]: # (sql-live result: stats_demo · 1 row · 545 ms · pinned 2026-09-24)

| rate_ad | rate_psa | z |
| --- | --- | --- |
| 0.0255 | 0.0179 | 7.37 |

[//]: # (end sql-live result)

<!-- The z statistic -->
<!-- Rung 31. The ONE new built-in function in this whole deck: ABS. -->
<!-- **Run it.** Expect rate_ad 0.0255, rate_psa 0.0179, z 7.370. -->
<!-- ABS throws away the sign, because the table on the next slide is symmetric: we are asking how FAR apart, not which way. Read the direction off the two rates, which are right there. -->
<!-- z = 7.37 means the gap is 7.37 standard errors from zero. Compare that to the picture of 2,000 A/A tests, where almost everything sat inside 2. -->

---

# The z table

| \|z\| | how often chance alone gets this far | verdict at 5 % |
|---|---|---|
| 1.00 | 32 in 100 | not significant |
| **1.96** | **5 in 100** | the 5 % line |
| 2.58 | 1 in 100 | significant at 1 % |
| 3.29 | 1 in 1,000 | |
| 7.37 | about 1 in 6,000,000,000,000 | **our result** |

<!-- MariaDB has no normal CDF — no ERF, no NORM.S.DIST — so the SQL honestly stops at z and this table finishes the job. That is not a workaround; it is how the z statistic was used for most of its history. -->
<!-- Our z of 7.37 is off the end of any printed table. p = 1.7e-13, roughly one in six trillion. -->
<!-- The bottom row is the exception, not the rule. Most real experiments land between the first two rows, which is where all the difficulty lives. -->

---

# The p-value

**p = how often chance alone would produce a gap this big, if the ad did nothing.**

- Our p: **0.00000000000017** — about 1 in 6 trillion
- Small p ⇒ the null assumption fits the data badly
- Convention: **p < 0.05 is "significant"**

<!-- 0.05 is a convention and nothing more. R. A. Fisher picked it as a convenient round number in the 1920s and said in print that a researcher should set the level to suit the problem. Ninety years later it is a hard gate on careers and product decisions. -->
<!-- Note the direction of the conditional carefully, because the next slide is entirely about people getting it backwards. -->

---

<!-- _class: callout -->

# p is **not** the probability the null is true

p is the chance of **data like ours**, assuming the null.
It is not the chance of **the null**, given our data.

<!-- The classic swap. "p = 0.03, so there is a 3 % chance the ad does nothing" is wrong, and it is wrong in a way that always overstates the evidence. -->
<!-- The analogy that lands: P(speaks English | is from New Zealand) is near 1. P(is from New Zealand | speaks English) is near zero. Same two facts, opposite conditional, wildly different number. -->

---

```sql-live db=stats_demo layout=rows height=515
WITH arms AS (
  SELECT test_group,
         COUNT(*)       AS n,
         SUM(converted) AS k
  FROM   ab_marketing
  GROUP  BY test_group
)
SELECT test_group,
       ROUND(k/n, 4)                                        AS rate,
       ROUND(k/n - 1.96 * SQRT((k/n) * (1 - k/n) / n), 4)   AS lo,
       ROUND(k/n + 1.96 * SQRT((k/n) * (1 - k/n) / n), 4)   AS hi
FROM   arms;
```

[//]: # (sql-live result: stats_demo · 2 rows · 664 ms · pinned 2026-09-24)

| test_group | rate | lo | hi |
| --- | --- | --- | --- |
| ad | 0.0255 | 0.0251 | 0.026 |
| psa | 0.0179 | 0.0162 | 0.0195 |

[//]: # (end sql-live result)

<!-- A 95 % interval on each rate -->
<!-- Rung 32. Nothing new — the 1.96 is the literal from the z table two slides back. -->
<!-- **Change it.** Swap 1.96 for 2.58 and the intervals widen to 99 %. -->
<!-- Expect ad 0.0251 to 0.0260, psa 0.0162 to 0.0195. The two intervals do not overlap, which is consistent with the test — though non-overlap is a rougher check than the z test itself, not a replacement for it. -->
<!-- Notice the widths: the ad arm's interval spans 0.08 pp, the psa arm's 0.34 pp — the small arm's answer is four times vaguer, off the same experiment. That is what 24:1 costs. -->

---

<!-- _class: section -->

# Part 6. Ways to be wrong

---

# Two ways to be wrong

| | **the ad really does nothing** | **the ad really works** |
|---|---|---|
| **we say it works** | **Type I error** — a false alarm | correct |
| **we say it does not** | correct | **Type II error** — a miss |

<!-- The 5 % convention is a choice about the top-left cell: run 100 experiments on 100 useless changes and about 5 will come back "significant". -->
<!-- The bottom-right cell has no convention attached and is usually much more common, because most tests are too small. Its rate is 1 - power, and power is the thing nobody computes until after the disappointment. -->
<!-- The two trade off: tighten the threshold to catch fewer false alarms and you miss more real effects. There is no setting that avoids both. -->

---

# Significant ≠ important

The marketing result is **certain** and **small**.

- +0.77 percentage points, on a base of 1.79 %
- Also +43 % relative — **the same fact**
- With 588,101 people, a trivial difference clears any threshold

<!-- "+43 %" and "+0.77 pp" are the same number reported two ways, and which one goes in the headline is a decision somebody makes. Ask for both, always. -->
<!-- Statistical significance is a statement about chance, not about size or worth. The business question — is 0.77 pp worth what the campaign costs? — is not a statistical question, and the p-value has no opinion on it. -->

---

# Not significant ≠ no effect

A result that misses the line might mean:

- there is no effect, **or**
- there is an effect and the test was too small to see it

<!-- "We tested it and found nothing" is not the same claim as "there is nothing", and the difference is the sample size. -->
<!-- A confidence interval is the honest report here: "the effect is between -0.4 and +1.2 pp" says both what we saw and how little we know. A bare "not significant" throws that away. -->

---

# Bigger effects need fewer people

![How many people per arm are needed to detect a given lift, at 80 % power](asset:sample-size.png)

*Per arm, to detect a lift from a 2 % base rate at 80 % power, 5 % significance.*

<!-- The curve is brutally steep. Halving the effect you want to catch roughly QUADRUPLES the people you need. -->
<!-- This is why a test should be sized before it is run: the size question is "what is the smallest change worth knowing about?", and that is a business decision, not a statistical one. -->
<!-- Evan Miller's calculator (evanmiller.org/ab-testing/sample-size.html) does this arithmetic live and is a good in-class demo. -->

---

# Twenty metrics, one will be significant

Test 20 unrelated things at the 5 % level and expect **one false alarm**.

- The same applies to 20 segments, 20 time slices, or 20 looks at the data
- Decide the metric in advance, or the 5 % is not 5 %

<!-- This is the multiple-comparisons problem, and it does not require dishonesty — just curiosity applied after the data arrives. -->
<!-- The fix is to declare one primary metric in advance and label everything else as exploratory. Corrections (Bonferroni: divide the threshold by the number of tests) exist, but declaring the metric is cheaper and more honest. -->

---

# The A/A test

Run the experiment with **no change at all** between the arms.

- If it comes back "significant", your pipeline is broken
- If the arms come out unequal in size, your randomiser is broken
- Everything today would find something in an A/A test about 5 % of the time

<!-- An A/A test is a unit test for the experiment machinery, and it is the cheapest sanity check in the business. It also cures the intuition that a significant result means a real one: run enough A/A tests and you will collect significant results from literally nothing. -->
<!-- The picture of 2,000 identical-arm experiments from Part 2 was an A/A test done 2,000 times. -->

---

# Do not stop when it looks good

![A p-value wandering below 0.05 and back up again as an A/A test collects more data](asset:peeking.png)

*One A/A test — no real difference — watched as it runs. Simulated, seed 20261127.*

<!-- This test has NO effect in it. Both arms are identical. The p-value still dips under 0.05 twice on its way to nowhere, and anyone watching who stopped at the first dip would have shipped a change that does nothing. -->
<!-- The mechanism: each new look is another chance to cross the line, and the crossings are what you notice. Check repeatedly and stop at the first "significant" result, and the false-alarm rate climbs from 5 % to well over 20 %. -->
<!-- Evan Miller's "How Not To Run an A/B Test" (evanmiller.org) is the standard reference, re-taught here in our own words. The fix is not subtle: fix n in advance and look once. Sequential designs exist and are a different tool with its own arithmetic. -->

---

# Sample ratio mismatch

Our two arms are **24 : 1** — 564,577 against 23,524.

- Here it was deliberate, and the dataset's description says so
- From the table alone you cannot tell that from a broken randomiser
- **Checking the arm sizes is the first thing to do with any A/B result**

<!-- A sample ratio mismatch is the standard first check because a randomiser that is leaking is the failure mode that invalidates everything downstream while leaving the numbers looking perfectly reasonable. -->
<!-- The imbalance costs real power too: the control arm's 420 conversions set the standard error, not the 588,101 rows. Half a million people in one arm cannot rescue a thin control. -->

---

# The randomisation check that passes

| | mean ads seen |
|---|---:|
| `ad` arm | 24.82 |
| `psa` arm | 24.76 |

<!-- Worth showing next to the mismatch slide: exposure is balanced across the arms almost exactly, which is what a working randomiser looks like. Only the arm SIZES are unequal, and that was by design. -->
<!-- So the dataset fails one check and passes another, which is the realistic case. A single check passing is not a clean bill of health. -->

---

```sql-live db=stats_demo layout=rows height=376
SELECT converted,
       COUNT(*)              AS people,
       ROUND(AVG(total_ads), 1) AS mean_ads
FROM   ab_marketing
WHERE  test_group = 'ad'
GROUP  BY converted;
```

[//]: # (sql-live result: stats_demo · 2 rows · 621 ms · pinned 2026-09-24)

| converted | people | mean_ads |
| --- | --- | --- |
| 0 | 550154 | 23.3 |
| 1 | 14423 | 83.9 |

[//]: # (end sql-live result)

<!-- The confounder, inside one arm -->
<!-- Rung 33. Nothing new — AVG and WHERE. -->
<!-- **Run it.** Expect about 23.3 ads for those who did not buy and 83.9 for those who did — a 3.6x gap, and note the WHERE: this is entirely WITHIN the ad arm. -->
<!-- So the arm is not the only thing that differs between buyers and non-buyers. -->

---

# Did the ads cause the purchase?

People in the ad arm who bought saw **83.9** ads. Those who did not buy saw **23.3**.

- Or: people who already wanted the product browsed more, and saw more ads
- The table cannot separate those, and neither can z
- **Ads seen is a consequence of behaviour, not an assigned treatment**

<!-- This is last week's confounder, inside a randomised experiment. The ARM was randomised; the number of ads a person saw was not. -->
<!-- The tempting fix — "control for total_ads" — makes it worse: conditioning on something that happened AFTER randomisation breaks the randomisation instead of adjusting for it. The comparison that is valid is the one the coin decided: arm against arm, everybody included. -->

---

<!-- _class: section -->

# Part 7. A subtler case

---

# Cookie Cats: a gate at level 30 or 40

A mobile puzzle game put its first gate — a forced wait — at level 30. Half of new players got it at level 40 instead.

- 90,189 players, one row each
- Outcome: did they come back after 1 day? After 7 days?

*Data: Tactile Entertainment via the DataCamp project "Mobile Games A/B Testing with Cookie Cats"; Kaggle mirror. Licence unstated — used for teaching, not redistributed.*

<!-- The opposite case to the marketing data in every way: arms almost exactly equal, a small effect, and a z that only just clears the line. -->
<!-- LICENCE: this table's licence is unstated (Kaggle records "Unknown"), so unlike the marketing data it is not redistributed by us — we fetch it, load it and cite it. It is on the DEV tier. Instructor ruling still owed before it goes to the production cluster (mysql/week10/data/SOURCE.md sec 1). -->

---

```sql-live db=stats_demo layout=rows height=376
SELECT version,
       COUNT(*)                            AS players,
       SUM(retention_7)                    AS returned,
       ROUND(SUM(retention_7) / COUNT(*), 4) AS rate
FROM   ab_cookie_cats
GROUP  BY version;
```

[//]: # (sql-live result: stats_demo · 2 rows · 182 ms · pinned 2026-09-24)

| version | players | returned | rate |
| --- | --- | --- | --- |
| gate_30 | 44700 | 8502 | 0.1902 |
| gate_40 | 45489 | 8279 | 0.182 |

[//]: # (end sql-live result)

<!-- Day-7 retention, by arm -->
<!-- Rung 34. Nothing new — the rung-27 query, pointed at another table. -->
<!-- **Run it.** Expect gate_30 at 0.1902 and gate_40 at 0.1820 — 19.02 % against 18.20 %. -->
<!-- The arms here are 44,700 and 45,489: near enough equal, so the sample ratio check passes. -->

---

```sql-live db=stats_demo layout=rows height=496
WITH arms AS (
  SELECT SUM(CASE WHEN version = 'gate_30' THEN retention_7 ELSE 0 END) AS k_a,
         SUM(CASE WHEN version = 'gate_30' THEN 1 ELSE 0 END)           AS n_a,
         SUM(CASE WHEN version = 'gate_40' THEN retention_7 ELSE 0 END) AS k_b,
         SUM(CASE WHEN version = 'gate_40' THEN 1 ELSE 0 END)           AS n_b
  FROM   ab_cookie_cats
),
rates AS (
  SELECT k_a/n_a AS r_a, k_b/n_b AS r_b, n_a, n_b,
         (k_a + k_b) / (n_a + n_b) AS p  FROM arms
)
SELECT ROUND(r_a, 4) AS rate_30, ROUND(r_b, 4) AS rate_40,
       ROUND(ABS(r_a - r_b)
             / SQRT(p*(1-p) * (1.0/n_a + 1.0/n_b)), 3) AS z
FROM   rates;
```

[//]: # (sql-live result: stats_demo · 1 row · 132 ms · pinned 2026-09-24)

| rate_30 | rate_40 | z |
| --- | --- | --- |
| 0.1902 | 0.182 | 3.164 |

[//]: # (end sql-live result)

<!-- The same chain, the other experiment -->
<!-- Rung 35. Nothing new — it is rung 31 with the table and the column changed. -->
<!-- **Change it.** Replace both `retention_7` with `retention_1` and run it again. That is the next slide. -->
<!-- Expect rate_30 0.1902, rate_40 0.1820, z 3.164 — over 1.96, so significant at 5 %, p about 0.0016. The gate at 30 keeps slightly MORE players. -->

---

# Day 7 clears the line. Day 1 does not.

| | day 1 | day 7 |
|---|---|---|
| gate_30 | 44.82 % | 19.02 % |
| gate_40 | 44.23 % | 18.20 % |
| difference | −0.59 pp | −0.82 pp |
| **z** | **1.78** | **3.16** |
| p | 0.074 | 0.0016 |
| at 5 % | not significant | significant |

<!-- The SAME query, the same experiment, one column changed — and two different verdicts. A student who only ever sees the day-7 result learns that the method always finds something. -->
<!-- Day 1 is not "no effect". It is a smaller effect measured against a much noisier base rate (44 % wobbles more in absolute terms than 19 %), landing at z = 1.78 — under the line but not near zero. The honest report is the interval, not the word "nothing". -->

---

# One player, 49,854 rounds

| | with the outlier | without it |
|---|---:|---:|
| gate_30 mean rounds | 52.46 | 51.34 |
| gate_40 mean rounds | 51.30 | 51.30 |
| gate_30 **median** | 17 | 17 |

<!-- One row in 44,700 moves its arm's mean by 1.11 rounds — larger than the entire 1.16-round gap between the two arms. Almost certainly a bot or a logging fault: the median is 16 and the second-largest value is 2,961. -->
<!-- The median does not move at all. That is week 7's lesson arriving inside a real decision. -->
<!-- It is kept in the table on purpose. Deleting it quietly would hide a judgement call — and note that the RETENTION result is untouched either way, because retention is 0 or 1 and this player is one person in each. -->

---

```sql-live db=stats_demo layout=rows height=376
SELECT version,
       COUNT(*)                      AS players,
       ROUND(AVG(sum_gamerounds), 2) AS mean_rounds,
       MAX(sum_gamerounds)           AS most_rounds
FROM   ab_cookie_cats
GROUP  BY version;
```

[//]: # (sql-live result: stats_demo · 2 rows · 203 ms · pinned 2026-09-24)

| version | players | mean_rounds | most_rounds |
| --- | --- | --- | --- |
| gate_30 | 44700 | 52.46 | 49854 |
| gate_40 | 45489 | 51.3 | 2640 |

[//]: # (end sql-live result)

<!-- The outlier, in the data -->
<!-- Rung 36. Nothing new — AVG and MAX, from week 9. -->
<!-- **Run it.** Expect gate_30 mean 52.46 with a maximum of 49,854; gate_40 mean 51.30 with a maximum of 2,640. -->
<!-- **Change it.** Add `WHERE sum_gamerounds < 40000` and watch gate_30's mean fall to 51.34 while its median would not move at all. -->

---

<!-- _class: section -->

# Part 8. What it cannot tell you

---

# What an A/B test cannot tell you

- **Why** it worked — only that the arms differed
- Whether it keeps working **next month**, or on other people
- Whether the effect is **worth the cost**
- Anything about a change you **did not test**
- Anything reliable about a metric you **chose afterwards**

<!-- Each line is a real failure mode, not a caveat for form's sake. Novelty effects fade; a result on this quarter's visitors may not hold for next quarter's; and a significant 0.77 pp may still lose money. -->
<!-- The p-value answers one narrow question — would chance alone do this? — and people routinely read it as answering all five of these. -->

---

# Questions to ask when someone shows you a result

1. What was the metric, and was it chosen **before** the data?
2. How many people, in **each** arm — and were the arms the right sizes?
3. Was the stopping point fixed in advance, or did you stop when it crossed?
4. What is the **interval**, not just the p-value?
5. How big is the effect in **money** or in people?

<!-- This slide is the takeaway. Five questions, none of them requiring any statistics to ask, and each corresponds to one of the failure modes from Part 6. -->
<!-- If the answer to (3) is "we stopped when it looked good", the p-value on the slide is not the p-value they think it is, and no amount of arithmetic afterwards repairs it. -->

---

# Prediction ≠ causation ≠ significance

- **Prediction** — x helps forecast y. Week 9
- **Causation** — changing x changes y. Needs an experiment
- **Significance** — chance alone would rarely do this. Says nothing about size, worth, or why

<!-- Three different claims that get used as if they were one, and the confusion runs in both directions: a correlation reported as a cause, and a significant result reported as an important one. -->
<!-- An experiment gets you from the first to the second. Nothing gets you from the third to either of the others. -->

---

# Sources and further reading

- **MIT 18.05**, *Introduction to Probability and Statistics* — ocw.mit.edu (CC BY-NC-SA)
- **OpenIntro Statistics**, inference for proportions — openintro.org (CC BY-NC-SA)
- **Data 8**, *Computational and Inferential Thinking*, ch. 12 — inferentialthinking.com (cited, not adapted)
- **Evan Miller**, "How Not To Run an A/B Test" — evanmiller.org
- **Kohavi, Tang & Xu**, *Trustworthy Online Controlled Experiments* — experimentguide.com
- **Data:** Kaggle "Marketing A/B Testing" (CC0) · Cookie Cats via DataCamp/Kaggle (licence unstated)

<!-- Data 8's A/B chapter is the best pedagogy of the lot and is CC BY-NC-ND — no derivatives — so it is linked and cited here and never reproduced. The permutation idea it teaches is re-taught in this deck in our own words. -->
<!-- Evan Miller's peeking argument is likewise re-taught rather than reproduced; his essay carries no reuse licence. -->
