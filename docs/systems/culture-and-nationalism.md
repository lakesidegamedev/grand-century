# Culture and nationalism

Your nation has a **primary culture** and a list of **accepted cultures**. Every **pop** (a group of people of one type, culture and religion in one province) belongs to a culture. Pops outside those two groups are second-class: they grow angrier, can be assimilated into your majority, and if their grievance boils over they launch an independence rebellion. How you treat them is one of the main long-term choices in the game.

## How it works

The culture pass runs once a month, just before [politics](politics-and-reform.md), because the anger it creates is an input to unrest. It uses no random numbers.

Each month, for every pop whose culture is not accepted:

1. **Resentment.** It gains militancy (anger, 0 to 10) at a rate set by your culture policy, and 0.012 consciousness (political awareness, 0 to 10) whatever you do.
2. **Assimilation.** A small share of the pop turns into the primary culture, joining the primary-culture pop of the same type in that province.
3. **Movements.** If a culture is big and aware enough, a **national movement** forms and its **radicalism** (0 to 100) moves up or down.
4. **Uprising.** A movement whose radicalism and militancy both pass a gate launches an independence rebellion.

You pick one of three **culture policies**. Each trades speed of assimilation against anger:

| Policy | Assimilation speed | Militancy per month | Movement radicalism per month |
|---|---|---|---|
| Exclusionary | x1.2 | +0.05 | +0.8 |
| Assimilationist (default) | x1.0 | +0.025 | 0 |
| Pluralist | x0.45 | +0.006 | -0.6 |

Pops whose religion differs from the state's gain 1.2 times the militancy and assimilate at 0.7 times the speed.

Assimilation rate per month is `0.6% x (local accepted share)^1.5 x (0.5 + literacy) x policy x religion x movement resistance`. The power of 1.5 is the point: a minority scattered among your majority melts, a compact homeland barely moves. "Local accepted share" counts primary and accepted cultures in that province.

### Key numbers

| Item | Value |
|---|---|
| Base assimilation | 0.6% of the pop per month |
| Movement forms at | 4% of national population and average consciousness 2.5, and at least one heartland state |
| Heartland state | One where that culture is 35% or more of the people |
| Radicalism per month | -0.3, +0.15 per consciousness, +0.5 per militancy, -2.0 per point of needs met, plus policy |
| Uprising gate | Radicalism 85 or more and militancy 4.2 or more |
| After an uprising | Radicalism resets to 30, 6 year cooldown |
| Accept a culture | 8 prestige, +6 for each culture already accepted, at most 4 accepted |
| Change policy | 4 prestige, then a 1 year wait |

### Worked example

A province holds 10,000 minority farmers. 80% of the province is primary or accepted culture, national literacy is 0.40, the religions match, there is no movement, and the policy is assimilationist.

Rate = 0.006 x 0.8^1.5 x (0.5 + 0.4) = 0.006 x 0.7155 x 0.9 = 0.386% a month. That is 38 people in month one, about 460 a year. Exclusionary would be 46 a month; pluralist 17.

Now look at the movement. Take a culture with average militancy 3, consciousness 3 and needs met 0.5 under an assimilationist policy: radicalism moves by -0.3 + 0.45 + 1.5 + 0 - 1.0 = +0.65 a month. If you feed them until needs met reach 0.9, it moves by -0.3 + 0.45 + 1.5 - 1.8 = -0.15 a month, so the movement quietly fades.

An angry case: militancy 6, consciousness 5, needs met 0.4, exclusionary policy. Radicalism moves by -0.3 + 0.75 + 3.0 + 0.8 - 0.8 = +3.45 a month and reaches 85 in about two years. Militancy is already over 4.2, so both gates are open and an uprising fires.

## What you can do

Open **Cultures** in the panel rail (the panel title is "Cultures of the Nation").

- **Set culture policy** in the Cultural Policy row. It costs 4 prestige and cannot be changed again for a year. The first change has no wait.
- **Read National Movements.** Each movement shows a radicalism bar. Hover for the monthly breakdown of base, consciousness, militancy, needs relief and policy terms.
- **Read the Cultural Census.** It lists each culture's population, militancy, consciousness and how many people assimilated last month. Hover for the assimilation factors, which shows why a culture is not melting.
- **Grant or revoke acceptance** for a culture with the buttons beside it. Granting needs the culture to be at least 2% of your population. Revoking is free but angers them.

Why is assimilation not working? Check three things in the census: the surround factor (are they a compact majority locally?), the policy factor, and the movement resistance. Radicalism cuts assimilation by a factor of `1 - radicalism / 110`, never below 5%. At radicalism 85 you assimilate at 23% of normal speed; at 100, 9%. Push too hard and you stop assimilating anyone.

What triggers the independence rebellion: radicalism 85 and militancy 4.2, no uprising in the last 6 years, a heartland state out of rebellion cooldown, and room under the rebellion caps (2 active against you, 8 in the world). Up to 3 heartland states are claimed. The rebel force is 1 to 3 regiments depending on size (1 plus one per 150,000 adherents).

If the rebels win, the claimed states leave to form a new nation named for the culture, with a five year truce with you. You lose 8 prestige.

Is accepting worth it? It costs 8 prestige for the first culture, then 14, 20 and 26. In return: militancy drops by 1.5 on those pops, radicalism by 40, the movement winds down at 4 a month, those people stop being assimilated, and farmers, laborers and craftsmen of that culture can be recruited as soldiers. Revoking adds 1 militancy and 15 radicalism.

Tips:

- Feed your minorities. Needs met is the biggest downward force on radicalism: 2.0 per point.
- Literacy cuts both ways. It speeds assimilation (up to x1.5) and raises consciousness, which is how movements start.
- After an uprising you have 6 years before the same movement can rise again. Use them to accept the culture or fix the cause.

## Connections

**Driven by:**

- [Population](population.md): each pop's culture, religion, needs, militancy and consciousness are the inputs
- [Politics and reform](politics-and-reform.md): school reforms raise literacy, which speeds assimilation
- [War](war.md): conquest brings in pops that are not of an accepted culture
- [Crises and the Concert of Europe](crises.md): prestige, spent on acceptance and policy changes, rises and falls with congress outcomes
- [Time and the tick](time-and-the-tick.md): the pass runs on the first of each month

**Affects:**

- [Politics and reform](politics-and-reform.md): minority militancy and consciousness feed state unrest and reform demand
- [War](war.md): uprisings create rebel armies and, if they win, new nations
- [Population](population.md): assimilation moves people between culture cohorts, and accepted cultures supply soldiers

## Status

The rules are the same in every scenario, era and difficulty. Which cultures exist, and where, comes from the scenario. Nations with the "uncivilized" government type are exempt: they have no resentment, assimilation or movements.

Last checked: 2026-10-29, version 1.7.0

## Exact rules

All values are in `CULTURE_TUNING` in `src/sim/systems/culture.ts` unless noted. The monthly pass `runCultureMonthly` runs after the population pass and before politics (`src/sim/world.ts`).

| Constant | Value |
|---|---|
| `assimilationBase` | 0.006 |
| `assimilationPolicy` | exclusionary 1.2, assimilationist 1, pluralist 0.45 |
| `assimilationReligionPenalty` | 0.7 |
| `militancyPolicy` | exclusionary 0.05, assimilationist 0.025, pluralist 0.006 |
| `militancyReligionFactor` | 1.2 |
| `consciousnessAccrual` | 0.012 |
| `movementMinShare` | 0.04 |
| `movementMinConsciousness` | 2.5 |
| `heartlandShare` | 0.35 |
| `radicalBase` | -0.3 |
| `radicalPerConsciousness` | 0.15 |
| `radicalPerMilitancy` | 0.5 |
| `radicalNeedsRelief` | 2.0 |
| `radicalPolicy` | exclusionary 0.8, assimilationist 0, pluralist -0.6 |
| `radicalAcceptedDecay` | 4 per month |
| `uprisingRadicalism` | 85 |
| `uprisingMilitancy` | 4.2 |
| `uprisingCooldownDays` | 2,190 (6 x 365) |
| `postUprisingRadicalism` | 30 |
| `postUprisingMilitancyRelief` | 0.8 |
| `uprisingMaxStates` | 3 |
| `adherentsPerRegiment` | 150,000 |
| `acceptPrestigeCost` | 8 |
| `acceptPrestigePerAccepted` | 6 |
| `acceptMaxExtra` | 4 |
| `acceptMilitancyRelief` | 1.5 |
| `acceptRadicalismRelief` | 40 |
| `revokeMilitancyPenalty` | 1 |
| `revokeRadicalismSpike` | 15 |
| `acceptMinShare` | 0.02 |
| `policyPrestigeCost` | 4 |
| `policyCooldownDays` | 365 |

### Formulas

- Resentment: `militancy += militancyPolicy x (1.2 if religion differs)`, `consciousness += 0.012`, both clamped 0 to 10. Applies to pops of cultures not primary or accepted.
- Assimilation rate: `assimilationBase x share^1.5 x (0.5 + literacy) x assimilationPolicy x (0.7 if religion differs) x resistance`. Share is the primary-plus-accepted fraction of the province's people. Resistance is `clamp(1 - radicalism / 110, 0.05, 1)`, or 1 with no movement. Pops moved per month are `floor(size x rate)`. They join the primary-culture pop of the same type and the province's main primary-culture religion; the receiving pop keeps its own militancy and consciousness, and money moves in proportion.
- Radicalism per month: `-0.3 + 0.15 x consciousness + 0.5 x militancy + policy term - 2.0 x needs met`, using size-weighted averages for that culture, clamped 0 to 100. A new movement starts at radicalism 1.
- Acceptance cost: `8 + 6 x (accepted cultures other than primary)`. Needs 2% or more of national population, fewer than 4 extra cultures, and enough prestige.
- Policy change: 4 prestige, rejected within 365 days of the last change and if the policy is already active.

### Uprising

Checked monthly for every movement, in this order: radicalism 85 or more; movement militancy 4.2 or more; not within 6 years of its last uprising; culture not accepted; fewer than `BALANCE.rebellion.worldActiveCap` (8) active rebellions in the world and `nationActiveCap` (2) against the nation; no active independence rebellion for that culture; at least one heartland state past the `stateCooldownDays` (900) rebellion cooldown (`src/sim/balance.ts`). The 3 heartland states with the highest culture share are claimed. Regiments: `clamp(1 + floor(adherents / 150000), 1, 3)`, each 900 men at organisation 45. Afterward claimed states have unrest risk x0.55, the culture's pops in them lose 0.8 militancy, and the movement resets to radicalism 30.

Resolution is in `src/sim/systems/war.ts`. Independence demands release the claimed states to a new nation named "<Culture> Revolt" with the target's government and reforms, a 5 year truce with the target, and the target loses 8 prestige.

### Dissolving movements

A movement is removed when its culture no longer has any people in the nation, when the nation is uncivilized, or when radicalism drops to 0 or below while the culture is accepted.

### Recruitment

Only pops of the primary or an accepted culture are converted to soldiers (`src/sim/systems/pops.ts`).
