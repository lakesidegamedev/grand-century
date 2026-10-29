# The simulation loop

`advanceDay` in `src/sim/world.ts` is the heart of the simulation. The worker
calls it N times per animation frame depending on speed, then builds a snapshot.

```ts
export function advanceDay(world: World, data: GameData): void
```

It increments the day, constructs an `Rng` from `world.rngState`, dispatches the
systems due on this day, and writes the RNG state back. Every system mutates
`World` in place.

## Cadence dispatch

Four cadences. Within one call they run in this fixed order: daily, weekly, monthly,
yearly. When two fall on the same day (a 7th day that is also the 1st of a month, for
example), the weekly block finishes first and the monthly block sees its results.

| Cadence | Condition | Source |
| --- | --- | --- |
| Daily | every `advanceDay` call | `src/sim/world.ts` |
| Weekly | `world.day % 7 === 0` | `src/sim/world.ts` |
| Monthly | `dayToDate(world.day, startDate).day === 1` | `src/sim/world.ts` |
| Yearly | `world.day % 365 === 0` (chronicle line only) | `src/sim/world.ts` |

`world.day` counts days since the scenario start and the first call makes it 1. So the
first weekly pass is day 7, and in a campaign that starts on 1 January the first monthly
pass is 1 February (day 31), not day 0. The yearly check counts 365 days from the start,
not calendar new year: a scenario starting on 4 July 1776 writes its chronicle lines on
each 4 July.

### Full order

```
advanceDay(world, data)
  day += 1; rng = new Rng(world.rngState)
  DAILY    runMarketDaily          (sanitises prices and stock, no trading)
           runWarDaily
  WEEKLY   beginMarketWeek
           runProductionWeekly
           runPopsWeekly           (buyers)
           runStockpileOrders      (buyers)
           settleProductionWeekly  (pays producers)
           runMarketWeekly         (price move)
  MONTHLY  runBudgetMonthly
           runPopsMonthly
           runCultureMonthly
           runPoliticsMonthly
           runResearchMonthly
           runDiplomacyMonthly
           runCrisisMonthly
           runEventsMonthly
           runAiMonthly
  YEARLY   recordChronicle
  world.rngState = rng.state
```

`runWarDaily` is not a flat daily pass. When no war, mobilisation, colonial claim or
moving force exists it does almost nothing: it refreshes colonial points every 30th day
and runs rebellion upkeep every 7th day, then returns. Details are on the
[War](../systems/war.md) page.

## Ordering within a cadence is load-bearing

The order systems run in is not alphabetical or arbitrary, and changing it
changes behaviour. The non-obvious constraints:

**Weekly.** `settleProductionWeekly` runs *after* the buyers
(`runPopsWeekly`, `runStockpileOrders`) and before `runMarketWeekly`. Production
registers supply and records what it would earn; settlement then scales each
claim by the fraction that actually sold and only then moves money.

Moving settlement earlier reintroduces the money fountain this ordering exists to
fix: paying producers in full at production time created money for goods nobody
bought. Measured at seed 6602, the market paid producers 7.5x what buyers spent by
1825 (comment in `src/sim/balance.ts`). The legacy behaviour is still reachable via the
`fcfs` clearing mode in `src/sim/balance.ts` (`clearingMode`, default `'settle'`), under
which `settleProductionWeekly` is a no-op.

`beginMarketWeek` must run first to clear the previous week's runtime
accumulators, and `runMarketWeekly` must run last because it is the price move
that reads the whole week's flows.

**Monthly.** `runCultureMonthly` runs *before* `runPoliticsMonthly` because the
militancy and consciousness it generates are inputs to political unrest.
`runBudgetMonthly` runs first so the rest of the month acts on a settled treasury.
`runAiMonthly` runs last so the AI decides against a finished world.

Within politics itself there is a second ordering constraint: suppression is
applied, and then unrest is recomputed from the post-suppression pop state.

**Yearly.** The chronicle runs after the monthly block so the line it writes includes
that day's monthly changes. It keeps at most 120 lines (`src/sim/world.ts`, oldest
dropped first).

## System signature

```ts
(world: World, data: GameData, rng: Rng) => void
```

Uniform by convention even where a system needs no randomness. `runCultureMonthly`,
`runBudgetMonthly`, `runPopsWeekly` and several others accept `rng` and ignore it; keeping the signature identical
means the dispatch site does not special-case anything.

## The calendar

`dayToDate` (exported from `src/sim/world.ts`, delegating to `dateAtDay` in `src/sim/calendar.ts`) converts a day index to `{ year, month, day }`.
The epoch is the scenario start date (`DEFAULT_START_DATE`, 1 January 1830, applies only
to old saves and callers without a scenario). Months have the fixed lengths 31, 28, 31,
30, 31, 30, 31, 31, 30, 31, 30, 31 and leap years are ignored, so a year is always 365
days.

This function runs several times per simulated day. It computes the year
arithmetically rather than looping over elapsed years; the loop version was
O(century) by the late game and showed up in profiles.

## Determinism

The `Rng` is constructed from `world.rngState` at the top of `advanceDay` and its
state written back at the bottom. Any system that consumes randomness advances
that shared stream, which means **adding or removing an rng call in one system
changes the random sequence every later system sees**.

That is fine within a release, but it means a change to, say, event selection can
shift war outcomes in an existing save. Do not treat rng consumption as a local
concern.

Never call `Math.random()` in sim code.

Worked example: add one `rng.next()` call to `runEventsMonthly`. Events run before
`runAiMonthly` in the same month, so every AI decision and every later war roll in
that save draws different numbers from then on. Same seed and commands, different
world. Keep new randomness behind its own seeded sub-stream if a save must stay
reproducible across the change.

## Adding a system

1. Add `src/sim/systems/<name>.ts` exporting a function with the standard
   signature.
2. Import it in `src/sim/world.ts` and call it from the correct cadence block,
   in a position justified against the ordering constraints above.
3. Put tuning constants in `src/sim/balance.ts`, not inline.
4. If it adds state to `World`, make it self-healing for older saves: the
   pattern is an `ensureXState(world)` call, as in `ensureCrisisState` and
   `ensureCultureState`.
5. Expose what the UI needs through `buildSnapshot` or a detail request, see
   [Snapshots and the protocol](snapshots-and-protocol.md).

To test one system on its own, build a world with `createWorld(data, seed)` and call the
system function directly with a `new Rng(world.rngState)`; no worker is needed.

## Last checked

2026-10-29, version 1.7.0.

## See also

- [Architecture](architecture.md): the sim/UI boundary and file map
- [Snapshots and the protocol](snapshots-and-protocol.md): what happens after the tick
- [Time and the tick](../systems/time-and-the-tick.md): the player-facing view
