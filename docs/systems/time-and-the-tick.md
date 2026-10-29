# Time and the tick

Grand Century runs on simulated days. One day is the smallest step the world takes, and every system is attached to one of four rhythms: daily, weekly, monthly or yearly. Nothing runs continuously, so when you want to know when something you did will show up, the answer is always "the next time its rhythm comes round".

## How it works

Each day the game does the same thing: advance the date by one day, run the daily systems, then the weekly ones if it is a weekly day, then the monthly ones if it is the 1st of a month, then the yearly one if a full year has passed. When two rhythms land on the same day, the shorter one finishes first and the longer one sees its results.

| Rhythm | When it fires | What runs |
| --- | --- | --- |
| Daily | Every day | Market housekeeping (cleans up numbers, no trading) and [war](war.md): army movement, combat, fronts |
| Weekly | Every 7th day counted from the start | The economy: production, shopping, standing orders, paying producers, price moves |
| Monthly | The 1st of each month | Budget, population, culture, politics, research, diplomacy, crises, events, AI |
| Yearly | Every 365th day | One chronicle line about your nation (shown in the Campaign Recap), and an autosave |

The calendar uses fixed month lengths (31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31) and never has leap years, so a year is always exactly 365 days. This keeps the simulation deterministic: the same save played the same way gives the same world.

**The weekly pass, in order.** The order is deliberate: producers are paid after buyers have had their turn, so money follows real sales instead of appearing when goods are made.

1. The market week opens and last week's flows are cleared.
2. Factories and resource sites produce and register their output as supply ([Production and industry](production-and-industry.md)).
3. Pops shop: life needs first, then everyday goods, then luxuries ([Population](population.md)).
4. Your standing stockpile orders run ([The world market](the-world-market.md)).
5. Producers are paid for the share of their output that actually sold.
6. Prices move for next week.

**The monthly pass, in order.**

1. Budget: taxes collected, bills paid, treasury updated ([Budget and taxation](budget-and-taxation.md)).
2. Population: growth, class changes, migration.
3. Culture: assimilation and nationalist unrest ([Culture and nationalism](culture-and-nationalism.md)).
4. Politics: parties, reforms, unrest ([Politics and reform](politics-and-reform.md)).
5. Research: points accumulate and technologies complete ([Research](research.md)).
6. Diplomacy: opinions, truces, great-power ranking ([Diplomacy](diplomacy.md)).
7. Crises: world tension and flashpoints ([Crises and the Concert of Europe](crises.md)).
8. Events: the event and decision engine ([Events and decisions](events-and-decisions.md)).
9. AI: every nation you do not control decides what to do next ([AI nations](ai-nations.md)).

Culture runs before politics because the unrest it creates is an input to politics. Budget runs first so the rest of the month is decided against an up-to-date treasury.

**Speed** only changes how many days pass per real second. It does not change what happens on a given day, so fast and slow play give the same world.

| Button | Days per real second | Real time for one year | Real time for one average month |
| --- | --- | --- | --- |
| Pause | 0 | stopped | stopped |
| x1 | 2 | 182.5 seconds | 15.2 seconds |
| x2 | 5 | 73 seconds | 6.1 seconds |
| x3 | 12 | 30.4 seconds | 2.5 seconds |
| x4 | 30 | 12.2 seconds | 1.0 second |
| x5 | 90 | 4.1 seconds | 0.34 seconds |

## A worked example

You start the 1830 campaign on 1 January and, on 3 January (day 2), drag the poor tax slider from 45% to 60%.

- The slider value is stored the instant you drag it, and the Budget panel previews the new monthly net at once.
- Real taxes are collected only on the next 1st, which is 1 February (day 31), 29 days later. In between, four weekly passes run (days 7, 14, 21 and 28).
- At x3 that wait is 29 / 12 = about 2.4 seconds of real time. At x1 it is 14.5 seconds. Paused, it never arrives.

## What you can do

- **Pause and set speed** with the speed buttons in the top bar next to the date (mobile layout: the speed row in the mobile top bar). A "Paused" badge shows when the clock is stopped. New campaigns start paused.
- **Give orders while paused.** Commands apply the moment you issue them, even at Pause: building a factory, enacting a reform, declaring war or moving a slider all take effect on the spot. What waits is the system that reads the result (for example the budget reads your tax slider on the 1st), and that system cannot run until you unpause.
- **Read a frozen number correctly.** Prices move once a week and population once a month. A figure that has not changed since yesterday is usually just between ticks.
- **In multiplayer, only the session leader can change speed.** Other players see the buttons greyed out.

Tips:

- Pause before big decisions. At x5 one real second is 90 game days, about three months, and [war](war.md) moves armies every day.
- Tariffs and standing orders apply the next day or the next weekly pass. Tax rates apply on the 1st. Do not judge a tax change until the first of the following month has passed.
- The game saves automatically once a year into one of three rotating autosave slots, so a long run at x5 is never more than a year from a restore point.

## Connections

**Driven by:**

- None. The only inputs are your speed buttons and Pause. Nothing in the simulation speeds up or slows down the clock.

**Affects:**

- [Population](population.md): runs weekly (income and shopping) and monthly (growth, class changes, migration).
- [Production and industry](production-and-industry.md): production and wage settlement run weekly.
- [The world market](the-world-market.md): prices move weekly, after buying and selling.
- [Budget and taxation](budget-and-taxation.md): the treasury is settled monthly, on the 1st.
- [Politics and reform](politics-and-reform.md): runs monthly, after culture.
- [Culture and nationalism](culture-and-nationalism.md): runs monthly, before politics.
- [Crises and the Concert of Europe](crises.md): runs monthly.
- [Events and decisions](events-and-decisions.md): the event engine runs monthly.
- [War](war.md): movement and combat run daily.
- [Diplomacy](diplomacy.md): runs monthly.
- [AI nations](ai-nations.md): other nations decide monthly, after every other monthly system.
- [Research](research.md): points and completions run monthly.

## Status

Live in every scenario and mode. The clock, rhythms and speeds are identical everywhere; only the start date changes by scenario (see the rules below). There is no difficulty setting that changes time. In multiplayer the session leader controls speed.

Last checked: 2026-10-29, version 1.7.0

For the same loop from the code's side, see [The simulation loop](../engineering/simulation-loop.md).

## Exact rules

| Constant | Value | Source |
| --- | --- | --- |
| Days per month | 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 | `src/sim/calendar.ts` (`DAYS_IN_MONTH`) |
| Days per year | 365, no leap years | `src/sim/calendar.ts` |
| Default start date | 1 January 1830 | `src/sim/calendar.ts` (`DEFAULT_START_DATE`) |
| Weekly condition | `world.day % 7 === 0` | `src/sim/world.ts` |
| Monthly condition | calendar day of month equals 1 | `src/sim/world.ts` |
| Yearly condition | `world.day % 365 === 0` | `src/sim/world.ts` |
| Chronicle length | last 120 entries kept | `src/sim/world.ts` (`recordChronicle`) |
| Days per second by speed 0 to 5 | 0, 2, 5, 12, 30, 90 | `src/worker/sim.worker.ts` (`SPEED_DAYS_PER_SEC`) |
| Speed clamp | 0 to 5 | `src/sim/commands.ts` (`setSpeed`) |
| Max days per worker frame | 400 | `src/worker/sim.worker.ts` (`tick`) |
| Max real time credited per frame | 0.1 seconds | `src/worker/sim.worker.ts` (`loop`) |
| Autosave slots | 3, `autosave-1` to `autosave-3`, chosen by `(year % 3) + 1` | `src/worker/sim.worker.ts` |
| Snapshot rate while running | 8 per second | `src/worker/sim.worker.ts` (`SNAPSHOT_HZ`) |

**Day counting.** `world.day` is the number of days since the scenario start. `advanceDay` adds 1 first, then dispatches. The first weekly pass is day 7, not day 0. In a 1 January start the first monthly pass is 1 February (day 31). The weekly rhythm counts from the start, so it does not line up with the 1st of the month.

**Weekly order** (`src/sim/world.ts`): `beginMarketWeek`, `runProductionWeekly`, `runPopsWeekly`, `runStockpileOrders`, `settleProductionWeekly`, `runMarketWeekly`.

**Monthly order**: `runBudgetMonthly`, `runPopsMonthly`, `runCultureMonthly`, `runPoliticsMonthly`, `runResearchMonthly`, `runDiplomacyMonthly`, `runCrisisMonthly`, `runEventsMonthly`, `runAiMonthly`.

**Daily systems**: `runMarketDaily` only clamps prices to the global limits and removes non-finite or negative stock figures (`src/sim/systems/market.ts`). All buying, selling and price discovery are weekly. `runWarDaily` moves and fights.

**Chronicle line** (once per 365 days, for the player's nation): year, tag, name, provinces, population, treasury, prestige, great-power rank, technology count, active wars, infamy (`src/sim/world.ts`).

**Start dates.** The scenario supplies the start date; 1830-01-01 is the default and the fallback for old saves. Registered scenario dates are 1700-01-01, 1776-07-04, 1815-06-18, 1830-01-01, 1914-07-28, 1936-01-01 and 1945-09-02 (`src/data/generated.ts`, `src/data/scenarios`). The yearly line and autosave fall every 365 days from that start, not on 1 January.

**Speed mechanics.** The worker adds `real seconds * days per second` to an accumulator and runs one `advanceDay` per whole day, up to 400 per frame. Real time credited per frame is capped at 0.1 seconds, so if the page stalls the clock slows instead of catching up with a burst. Speed 0 adds nothing. While paused, commands still run (`handleCommand` in `src/worker/sim.worker.ts` and `applyCommand` in `src/sim/commands.ts`), but no system runs.

**Autosave.** When the day is a multiple of 365 and the year differs from the last autosave, the worker writes the next of three rotating slots (`src/worker/sim.worker.ts`).
