# Master Document: "Grand Century" (working title)

A browser-based grand strategy game about the long nineteenth century.

**Historical document.** This is the original scoping spec, kept for context. The game has since shipped (version 1.7.0) with a MapLibre map, React 19, seven start-date scenarios and a multiplayer server. Where this page and the code disagree, the code wins. Current references: [Architecture](engineering/architecture.md), [The simulation loop](engineering/simulation-loop.md), [Snapshots and the protocol](engineering/snapshots-and-protocol.md) and the player pages in `docs/systems/`, starting with [Time and the tick](systems/time-and-the-tick.md).

Notes on what changed from the plan below: multiplayer is no longer a non-goal; the map has 2,141 provinces rather than 800 to 1500; deck.gl and SharedArrayBuffer snapshots were never adopted; Section 8 (build workflow) has been removed.

---

## 1. Context: why this document exists

The goal was a from-scratch, browser-based web game with a living 19th-century world you steer as a nation, watching population, industry, and armies evolve on a historical map. The plan was for it to run entirely in the browser (client-side, no server sim), feel performant, and look beautiful. Multiplayer was added later and reuses the same simulation code on a Node server.

This document was the **master spec**: it defined the vision, the simulation model, the tech architecture, the data pipeline and the milestone roadmap.

### Confirmed decisions (from scoping)
| Decision | Choice | Consequence |
|---|---|---|
| **Scope** | Broad-but-shallow full loop | Economy, population, politics, diplomacy, and war are all present but initially simplified; the *whole* loop is playable end-to-end from an early milestone. |
| **Setting** | Historical 1830 Earth | Opens on the post-Napoleonic settlement and independence era. Requires a province map plus a source-backed historical content pipeline (Section 6). |
| **Pillar** | **War & expansion** | War is the star: it gets the most mechanical depth; every other system is designed to *feed* war (economy funds it, pops man it, politics gates it, diplomacy sets it up). |
| **Stack** | "Most performant & beautiful" → my call | TS + Vite + React UI + WebGL map + Web-Worker sim (Section 4). |

---

## 2. Design vision & pillars

**One-line pitch:** *Take a nation in 1830 and reshape the long nineteenth century through industry, reform, diplomacy, and conquest, with a world market and population that live and react on their own.*

**Design pillars (ranked, war-first):**
1. **War & expansion is the payoff.** Mobilizing pops into armies, fronts that push and break, war goals, occupation, peace deals, the great-power pecking order, and the colonial land-grab. This is where the player spends the climaxes of a game.
2. **A world that lives without you.** Pops grow/migrate/promote, factories boom and bust, prices move on a shared world market, AI nations pursue their own wars. The player nudges a system, they don't micromanage a spreadsheet.
3. **Everything feeds the war engine.** Economy → money & goods for armies. Pops → soldiers & taxes. Politics → what reforms/mobilization you can enact. Diplomacy → alliances, casus belli, spheres. No pillar is a dead end.
4. **Legible depth.** We keep systemic depth but expose *why* things happen through tooltips that trace every number to its inputs.

**Explicit non-goals at the time (to protect scope):** multiplayer (since added); modding tools; an encyclopedic scripted event tree; historically exact pop/goods numbers (we seed *plausible* history, then let the sim diverge).

---

## 3. Simulation model (broad-but-shallow, war-weighted)

The sim is **real-time-with-pause**: five speeds plus pause. Base unit is a **day/tick**; heavier systems resolve on coarser cadences to stay cheap.

### 3.1 Tick cadences (as shipped, from `src/sim/world.ts`)
| Cadence | Systems, in order |
|---|---|
| **Daily** | Market housekeeping (sanitises prices and stock only), then war: army and fleet movement, combat, sieges and occupation. |
| **Weekly** (every 7th day) | Market week opens, production, pop needs and consumption, stockpile orders, producers paid for what sold, then the market price move. |
| **Monthly** (1st of the month) | Budget, pop growth and migration, culture, politics, research, diplomacy, crises, events, AI. |
| **Yearly** (every 365th day) | One chronicle line for the player's nation. |

Prices move weekly, not daily. See [The simulation loop](engineering/simulation-loop.md) for why the order matters.

### 3.2 Core entities
- **Province**: owner, controller (for occupation), terrain, RGO (resource good + level), fort/naval-base level, buildings, list of pops, connectivity.
- **State/Region**: groups provinces; where factories live; the unit of colonial expansion.
- **Pop**: type (aristocrat, capitalist, clerk, craftsman, clergy, **soldier**, officer, farmer, laborer, slave), size, culture, religion, ideology mix, consciousness/militancy, money, needs-satisfaction. Pops are the source of *soldiers, taxes, and unrest*.
- **Nation**: treasury, tech, reforms, government type, ruling party, national value, prestige, infamy, sphere, great-power rank, army/navy, diplomatic relations, war goals.
- **Good**: e.g. grain, iron, coal, machine parts, small arms, artillery, canned food, etc.: a compact goods list (~30).
- **Market**: one shared **world market** with per-good supply/demand → price, plus tariffs. Regional and imperial market friction can deepen this later.

### 3.3 Pillar summaries (each intentionally simplified)

**Economy (supporting, funds war).** RGOs produce raw goods; factories in states convert raw → manufactured; pops demand goods by need tier (life/everyday/luxury). Supply vs demand on the world market sets prices weekly. Nation earns from taxes (per pop-type slider), tariffs, and state-owned production; spends on army upkeep, construction, admin, and reform costs. **Bankruptcy** is possible and cripples war capacity.

**Population (supporting, mans war & pays for it).** Pops grow with need-satisfaction, migrate toward jobs/higher living standards, and **promote/demote** between types (e.g. farmer→laborer→craftsman; anyone→soldier when soldier jobs & culture allow). Militancy rises with unmet needs & political suppression → rebellions.

**Politics (gate, decides what war you can wage).** A short reform tree (economic, political, social, military). Upper house / party in power gates which reforms are legal and sets tax/economic policy. Military reforms directly unlock **mobilization size, conscription, and army tech throughput**. Elections (if the government type allows) shift the ruling party.

**Diplomacy (setup, creates wars).** Relations, alliances, guarantees, **casus belli / war goals**, **infamy (badboy)** as the aggression brake, **great-power ranking** (score = industry + military + prestige), **sphere of influence** over secondary/unciv nations via influence points. Declaring war requires a valid CB; peace is settled by **war score** against attached war goals.

**★ War & expansion (the star, deepest system).**
- **Land**: recruit **regiments from soldier pops** (each soldier pop supports N regiments by military reform level); armies are stacks with a **general** (traits/skill). Movement province-to-province with terrain & supply-range limits. **Combat**: dice + tech + terrain + general + org/morale; units take **organization** damage then **strength** damage; broken units retreat. **Fronts** emerge naturally from adjacency (no need for an explicit front system: stacks meeting at borders create the push/pull).
- **Sieges/occupation**: occupying enemy provinces builds war score; forts slow it.
- **Naval**: fleets for **transport** (amphibious landings), **blockade**, and **naval supremacy** (required to land troops overseas: key for colonial powers).
- **War goals & peace**: attach goals (annex state, liberate, humiliate, add to sphere, take colony) each worth war-score %; enforce when score allows, or negotiate white peace.
- **Great-power & colonial expansion**: top-8 GPs get sphere/colonization privileges. **Colonization**: spend colonial points (from naval bases + reforms) to plant/expand colonies in uncolonized regions; races with rival GPs can flip to crisis/war.
- **War exhaustion / war score cap** keep wars from being infinite.

### 3.4 Simplifications table
| Full-complexity feature | Our initial model |
|---|---|
| Per-nation/per-sphere markets | One global market + tariffs |
| ~50+ goods, multi-input recipes | ~30 goods, ≤3-input recipes |
| Full event/decision tree | Small hand-authored event set + generated flavor |
| Rebel factions & civil wars in depth | Militancy → uprising stacks + reform pressure |
| Exact historical pops | Plausible seeded pops, sim diverges |
| ~2500 provinces | ~800 to ~1500 provinces (perf, Section 7) |

---

## 4. Technical architecture (performant + beautiful)

**Guiding principle:** the UI thread only *renders*; the world only *simulates* in a worker. They exchange snapshots. This is what keeps a heavy grand-strategy tick from ever stuttering the map.

```
┌────────────────────────── Main thread (60fps) ──────────────────────────┐
│  React + TypeScript  ── panel UI (ledgers, diplomacy, budget, army)      │
│  Zustand store       ── UI state + latest world snapshot (read-only)     │
│  WebGL map renderer  ── MapLibre GL, GPU province fills                  │
└───────────────▲───────────────────────────────────┬────────────────────┘
                │ snapshot (structured-clone)                              │ commands (player intents)
┌───────────────┴───────────────────────────────────▼────────────────────┐
│  Web Worker: the simulation                                             │
│  Pure-TS deterministic engine: pops · market · politics · diplo · WAR   │
│  Fixed-timestep tick loop; seeded RNG; produces snapshots per frame     │
└─────────────────────────────────────────────────────────────────────────┘
        │ save/load
   IndexedDB (via idb), compressed save blobs
```

### 4.1 Stack (my recommendation for "most performant & beautiful")
- **Language:** TypeScript, strict mode, everywhere (UI + sim share domain types).
- **Build:** Vite (fast HMR, worker & WASM support out of the box).
- **UI:** React + TypeScript (React 19 as shipped). Panels/ledgers are the bulk of the screen; React's ecosystem is the broadest and the UI is *not* the perf bottleneck (the worker is).
- **Map (the "beautiful" part):** **WebGL, GPU-accelerated.** Province fills recolor by owner/mapmode without CPU redraw. MapLibre GL JS gives real geography from GeoJSON, paper-map styling and pan/zoom for free.
  - *Decision (shipped):* MapLibre only. deck.gl was considered for overlays and never needed.
- **State:** Zustand (tiny, fast, no boilerplate) for UI + snapshot; the sim owns its own plain-object world model inside the worker.
- **Sim performance:** typed arrays / struct-of-arrays for pops & provinces; snapshots are compact summaries sent by structured clone, with detail views pulled on demand. Hot loops stay allocation-free.
- **Persistence:** IndexedDB via `idb`, saves gzipped (`fflate`).
- **Determinism:** single seeded PRNG (e.g. `mulberry32`) threaded through the sim so saves/replays are reproducible: also makes bugs reproducible.
- **Testing:** Vitest for sim units (economy conservation, combat math, save/load round-trip); Playwright for smoke (load → advance 1 year → no crash).
- **Optional later:** move the hottest sim inner loops to **AssemblyScript/WASM** only if profiling demands it: do *not* start there.

### 4.2 Why this beats the alternatives
- **Svelte** is lovely but has a thinner ecosystem for data-heavy panels; React was the safer choice.
- **Phaser/Pixi as the app framework** is wrong here: 80% of a grand-strategy screen is data panels, which engines handle worse than React. We still get WebGL where it matters (the map) via MapLibre/deck.gl.
- **Server-side sim** was judged unnecessary for single-player and would have hurt the "runs anywhere in a tab" goal. The multiplayer server later reused the same sim code.

---

## 5. Repository layout & conventions

```
/grand-century
  /src
    /sim            # pure TS, no DOM, runs in worker; the whole game model
      /systems      # market.ts, pops.ts, politics.ts, diplomacy.ts, war/*.ts
      /model        # entity types, world state, struct-of-arrays stores
      world.ts      # tick loop, cadence dispatch
      rng.ts
    /worker         # worker entry: command intake + snapshot emit
    /ui             # React components (panels, mapmodes, hud)
    /map            # MapLibre/deck.gl setup, province paint, camera
    /data           # loaders for the built game data (from /content)
    /shared         # domain types shared by sim + ui
  /content          # SOURCE data + build scripts → baked game data (Section 6)
  /public
  /tests
```

**Conventions:** sim code imports nothing from `ui/` or the DOM (enforced by lint boundary). All player actions are **commands** posted to the worker; all reads come from the **snapshot**. One `shared/types.ts` is the contract both sides trust.

---

## 6. Content pipeline (1830 Earth data)

Historical Earth is the biggest *content* risk. Treat data as a **build step**, not hand-typed constants.

**Sources → baked artifacts:**
1. **Province geometry:** start from open historical and Natural Earth-derived geometry. Simplify to ~800 to ~1500 provinces (Section 7). Bake to compact binary plus a province-id ↔ polygon index.
2. **Nations (1830):** a JSON table of starting polities, capitals, constitutional relationships, government type, primary/accepted cultures, starting techs/reforms, and GP status.
3. **Province seed:** owner, terrain, RGO good+level, starting fort/naval-base, starting pop stacks (type/size/culture/religion): *plausible*, generated from a small ruleset + a few historical anchors, not exhaustively hand-authored.
4. **Goods & recipes:** the ~30-good list + factory recipes + pop need baskets.
5. **Tech/reform trees:** compact JSON.

**Build script** (`/content/build.ts`, run via node) validates and emits versioned artifacts into `/src/data`. Large data tables are generated and validated by script.

---

## 7. Performance budget (original targets)

- **Target:** 60fps map interaction at all times; a monthly tick for the full world resolves in **< 16ms of worker time** at fastest speed (worker stutter never touches the UI thread anyway).
- **Province count:** 800 to 1500 planned. The shipped world map has 2,141 provinces, so the cap was raised after profiling.
- **Pops:** struct-of-arrays; process by type in tight loops; cap pop *count* by merging tiny same-attribute pops.
- **Snapshots:** send diffs or a compact typed-array snapshot, not a deep clone of the whole world every frame. Map only re-uploads province colors that changed.
- **Guardrail:** a perf test in CI that advances the world 5 sim-years headless and asserts a wall-clock ceiling.

---

## 8. Execution workflow

Superseded. The build process is not part of the public documentation. Contributors should follow [Architecture](engineering/architecture.md), in particular the verification gate and the sim/UI boundary.

---

## 9. Milestone roadmap

Each milestone is **independently playable/verifiable**, the "broad-but-shallow full loop" means we get end-to-end early, then deepen war.

| # | Milestone | Deliverable | Acceptance |
|---|---|---|---|
| **M0** | Scaffold | Vite + TS + React + worker + Zustand skeleton; empty MapLibre map renders; tick loop posts snapshots; save/load stub. | App boots; clock advances; map pans at 60fps. |
| **M1** | Map & provinces | 1830 province GeoJSON baked and painted; click a province → info panel; **mapmodes** (political first). | ~1000 provinces selectable and recolor instantly. |
| **M2** | Pops & economy | Pops, RGOs, factories, world market, weekly production/consumption, monthly budget & pop growth. | Prices move with supply/demand; a nation can go bankrupt; pops grow. |
| **M3** | Politics | Reform tree, ruling party/upper house, taxes/tariffs sliders, militancy → unrest, elections. | Player can enact a legal reform; unmet needs raise militancy. |
| **M4** | Diplomacy | Relations, alliances, CB/war goals, infamy, GP ranking, spheres. | Player can form an alliance and fabricate/declare a valid war. |
| **M5** | ★ War & expansion | Recruit regiments from soldier pops, armies + generals, movement, combat, sieges/occupation, navies + landings, war score & peace, colonization. | A full war can be fought and won; a colonial claim can be planted. |
| **M6** | AI, balance & polish | AI nations play the loop (economy + war), event/flavor pass, tooltips-that-trace-numbers, save/load hardening, perf pass, audio/art polish. | AI wages its own wars; a 20-year game runs stable end-to-end. |

**Vertical-slice note:** M2 to M5 each add a pillar but the game is *playable* after each. War (M5) is deliberately the fattest milestone and may split into M5a land / M5b naval+colonial.

---

## 10. Verification strategy

- **Sim unit tests (Vitest):** market conservation (no goods/money created from nothing), combat determinism under fixed seed, pop promotion invariants, budget balance, save→load→save byte-identical.
- **Headless sim harness:** advance the full world N years with no player input; assert no NaNs, no negative pops, treasury bounded, wall-clock under budget (Section 7). Run in CI.
- **Playwright smoke:** boot → select nation → run 1 year at fast speed → declare & resolve a scripted war → no crash.
- **Manual "feel" checks** per milestone against the acceptance column in Section 9.
- **Determinism harness:** same seed + same command log → identical end state (catches order-dependence bugs early).

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Historical map/data is a content black hole** | Cap provinces; generate seeds from rules + anchors, not by hand; make data a build step (Section 6). |
| **Monthly full-world pop pass is slow** | Struct-of-arrays, pop merging, worker isolation, WASM only if profiled. Perf test in CI. |
| **War (the star) balloons in scope** | Split M5 into land / naval+colonial; ship land war playable first. |
| **"Broad-but-shallow" silently becomes broad-but-broken** | Each milestone has hard acceptance criteria; don't advance until green. |
| **AI is the make-or-break for single-player fun** | M6 gives AI real weight; start with a competent economy+war heuristic AI, not a scripted one. |
| **SharedArrayBuffer needs COOP/COEP headers** | Resolved: shipped with structured-clone snapshots. |
| **System opacity** | Tooltips that trace every displayed number to its inputs, built in as a shared component from M2. |

---

## 12. Open questions (original list, now resolved)

1. **Map renderer:** MapLibre only.
2. **Art direction:** archival nineteenth-century atlas, see [Architecture](engineering/architecture.md).
3. **Time span:** seven start-date scenarios from 1700 to 1945.
4. **Saves:** IndexedDB slots with a yearly rotating autosave, see [Snapshots and the protocol](engineering/snapshots-and-protocol.md).
5. **Hosting:** static host for the web game plus a Node server for multiplayer.

---

*Historical document. Last checked: 2026-10-29, version 1.7.0.*
