# War

War is the one system that runs every single day. Armies march, supply is checked, battles resolve, provinces fall under siege and the war score moves, all before you can blink. Conquest is how you take land and prestige, and a badly planned war is how you lose both.

## How it works

A war starts when someone declares one (see [Diplomacy](diplomacy.md)), or when a [crisis](crises.md) boils over. Each side is the lead nation plus its allies. The defender's side also pulls in nations that **guarantee** it. The war then runs on its own clock:

1. **Move.** Armies advance one step along their orders. A march between neighbouring provinces takes 1 to 15 days, and 5 days over open ground at standard distance. Fleets take 4 days as a baseline.
2. **Supply.** Each army checks whether it is supplied. If not, it bleeds.
3. **Battle.** Where hostile armies share a province, they fight.
4. **Siege.** Where an army stands alone in an enemy province, it grinds the province down until control flips.
5. **Score.** The war score is recomputed, and wars that have run their course end by themselves.

### Regiments

An army is a stack of **regiments**. A regiment holds up to 1,000 men (its **strength**) and has an **organization** from 0 to 100, which is how fit it is to fight. Ships hold up to 100 strength. Regiment types are different tools:

| Type | Cost | Offense | Defense | Siege | Mobility | Pursuit | Needs |
|---|---|---|---|---|---|---|---|
| Infantry | 24 | 1.0 | 1.05 | 1.0 | 1.0 | 0.9 | nothing |
| Cavalry | 31 | 0.92 | 0.82 | 0.5 | 1.24 | 1.45 | conscription 1 |
| Artillery | 38 | 1.42 | 0.64 | 1.9 | 0.76 | 0.72 | conscription 1, professionalism 1 |
| Guard | 45 | 1.25 | 1.26 | 1.12 | 0.95 | 1.02 | conscription 2, professionalism 2 |
| Armor | 82 | 1.9 | 1.4 | 1.45 | 1.2 | 1.28 | conscription 2, professionalism 2, technology Mechanized Operations |
| Aircraft | 96 | 1.65 | 0.58 | 1.05 | 1.42 | 1.55 | conscription 2, professionalism 2, technology Military Aviation |

Artillery hits hardest and cracks forts nearly twice as fast as infantry, but it is fragile and slow. Cavalry is for movement and for running down a beaten enemy. Guards are good at everything and cost for it. Conscription and professionalism are reforms, see [Politics and reform](politics-and-reform.md).

### Combat width: why doomstacks do not work

A land battle has a **combat width** of 24 regiments. Up to 24, every regiment fights at full effect. Past 24, extra regiments still help, but on a square-root curve that falls away steeply, and the damage a stack takes is no longer diluted by the extra bodies either.

Without this, piling every army into one province was strictly best: offence grew with stack size while the damage per regiment shrank. Now splitting across fronts is a real choice.

### Supply

An army is **supplied** if friendly ground (provinces you own or control) is within reach. An unsupplied regiment loses 1.7 organization and 4.4 strength every day. A supplied army standing in a province you control recovers: up to 18 strength a day from its home soldier pop, and organization back toward full.

The search starts at the army's province. It may step through one unfriendly province, but every step after that must be friendly. As written, that means supply reaches at most two provinces from friendly ground. A deep thrust past unreduced enemy territory goes unsupplied.

### Sieges and occupation

A province flips when an army stands alone in it (no enemy army present) and its progress reaches 100%. Plain ground adds 2.8% a day, so 36 days. Hills and mountains carry a fort of level 1 and take 63 days. Artillery in the stack and a general with the siegecraft trait speed this up.

Occupation moves the war score and supply, not the economy. The province still counts as its owner's until a peace deal transfers it.

### War score

War score runs from -100 to +100 from the attacker's view, the sum of five parts:

- **Occupation**: the share of each side's provinces held by the other, plus progress on war goals.
- **Capital**: holding an enemy capital is worth 8.
- **Blockade**: fleets that out-muscle the enemy in coastal waters.
- **Battle**: won and lost engagements.
- **Exhaustion**: the gap in war weariness between the sides.

Occupation usually dominates. Winning battles without taking ground moves the number far less than players expect.

### Ending a war

**War goals** are the specific prizes a side fights for. The attacker starts with the goal chosen at declaration. Each goal has a score cost. At peace, the winning side spends war score to enforce goals, and enforcing is what actually moves land and prestige.

**White peace** (nothing changes hands) is free when the two sides are within 10 points of each other or both are at 75 exhaustion or more. Otherwise the side asking for it pays 6 prestige. It needs no agreement. Every peace, white or not, starts a **truce** between the former enemies that lasts 5 years.

A war also ends on its own when one side is overwhelmingly ahead or both are spent. See the rules below.

### Key numbers

| Thing | Value |
|---|---|
| Regiment strength / ship strength | 1,000 / 100 |
| Combat width | 24 regiments |
| Siege speed, plain ground | 2.8% a day (36 days) |
| Unsupplied loss per day | 1.7 organization, 4.4 strength |
| Free white peace | score gap 10 or less, or both exhaustion 75 or more |
| White peace fee otherwise | 6 prestige |
| Truce after any peace | 5 years |
| Mobilization | 14 per regiment once, 0.16 per regiment per day |
| Standing upkeep | 2.5 per regiment, 1.7 per ship, each month |
| Colonial claim | 32 colonial points |

## Worked examples

**Doomstack.** A stack of 48 regiments counts as 24 + sqrt(24) x 0.55 = 26.7 regiments of fighting power, 56% of its size. Two stacks of 24 on two fronts count as 48. Past the cap, 60 regiments count as only 27.3.

**Siege.** An infantry-only army takes a plain province in 36 days. In a hill province (fort 1) it takes 63. If artillery is half the stack by weight, the hill siege falls to 37 days. A siegecraft general on infantry makes it 50.

**Score and peace.** You hold 25% of the enemy's provinces and all of the state you declared on (goal worth 38). Occupation is 0.25 x 48 = 12, plus 38 x 0.9 = 34.2, so 46.2. Holding their capital adds 8 for 54.2. You can enforce the 38-point goal. With only 30 on the board, the game answers that you need 38.0 score and have 30.0.

## What you can do

- **Declare** from the **Diplomacy** panel, in the target's dossier under "Pretext and War". Pick a goal, fabricate a pretext first if you can.
- **Recruit and mobilize** in the **Military** panel under "Recruitment & Mobilization". Choose regiment types and a recruiting province. **Mobilize** raises reserve infantry during a war, and **Demobilize** sends them home.
- **Command** armies and fleets in the **Military** panel: press Select on a stack, then click a neighbouring province on the map. The whole stack in that province moves together. **Assign General** gives it the best available general.
- **Make peace** in the Military panel's **War Overview**, in the Peace Conference box. Tick goals to enforce or ask for white peace.
- **Claim colonies** in the **Colonization** panel.

Tips:

- **Split your armies.** Two fronts of 24 beat one stack of 48.
- **Match type to job.** Artillery for forts, cavalry for pursuit, infantry as the backbone.
- **Take ground, not just battles.** Occupation dominates war score.

Edge cases:

- **Army destroyed.** An army with no regiments left is removed. The war continues and the score keeps moving.
- **Losing.** Ask for white peace and pay 6 prestige, or hold on: at pressure 65 or exhaustion 96 the game ends the war and the winner collects goals it can afford.
- **Broken in battle.** A side below 8 average organization retreats to a friendly neighbour and keeps 55% of its organization. With nowhere to retreat it is wiped out.
- **Zero soldiers.** Recruiting stops with "No soldier pops available". Recruit pools are the soldier pops within 250 km. Raise conscription or grow soldier numbers, see [Population](population.md).
- **After peace.** The 5-year truce blocks declaring on that nation again. Mobilized regiments are demobilized automatically.
- **Every conquest is a bill.** [Budget and taxation](budget-and-taxation.md) scales administration with provinces held.

## Connections

**Driven by:**

- [Time and the tick](time-and-the-tick.md): war is one of only two systems that run daily.
- [Diplomacy](diplomacy.md): pretexts, alliances, guarantees and truces decide who fights whom and when.
- [AI nations](ai-nations.md): AI nations declare wars, march armies and sue for peace.
- [Crises and the Concert of Europe](crises.md): a crisis that goes over the brink starts a war between the blocs.
- [Population](population.md): soldier pops supply regiments and mobilization draws on everyone else.
- [Research](research.md): technology unlocks regiment and ship types, and speeds marches and supply.
- [Politics and reform](politics-and-reform.md): conscription and professionalism set army size and organization.
- [Budget and taxation](budget-and-taxation.md): the treasury pays for recruiting, mobilization and upkeep.
- [Culture and nationalism](culture-and-nationalism.md): nationalist movements can raise rebel armies.
- [Events and decisions](events-and-decisions.md): events can spawn rebels and grant colonial points.

**Affects:**
- [Culture and nationalism](culture-and-nationalism.md): conquered provinces bring in pops of other cultures.

- [Diplomacy](diplomacy.md): every peace starts a truce, and war goals shift prestige and spheres.
- [Crises and the Concert of Europe](crises.md): great power wars raise world tension.
- [Population](population.md): mobilization lowers civilian needs met and reinforcement draws soldiers.
- [Budget and taxation](budget-and-taxation.md): armies and fleets cost upkeep every month.
- [Politics and reform](politics-and-reform.md): an enforced rebellion forces a reform or independence.
- [AI nations](ai-nations.md): war outcomes change AI strength and decisions.
- [Research](research.md): at war, AI nations weight army and navy techs higher.

## Status

War is live in every scenario and era. There are no difficulty settings. Which regiment and ship types you can build depends on your reforms and technology, so armor, aircraft and the later warships only appear as the century advances. Multiplayer uses the same rules.

Last checked: 2026-10-29, version 1.7.0

## Exact rules

All in `src/sim/systems/war.ts` unless noted. War runs in the daily block of `advanceDay` in `src/sim/world.ts`, right after `runMarketDaily`, see [the simulation loop](../engineering/simulation-loop.md). Inside `runWarDaily` the order is: army and fleet movement, supply and attrition, battles, sieges, mobilization upkeep, colonial claims, rebellions (every 3rd day), cleanup, war scores, auto-peace, post-peace demobilization. If there is no war, no mobilization, no claim and nothing moving, the function mostly returns early.

**Units** (`src/sim/militaryCatalog.ts`). Cost, manpower drain, base strength and organization bonus per type: infantry 24, 70, 1000, 0; cavalry 31, 82, 930, +3; artillery 38, 90, 820, -5; guard 45, 96, 1000, +8; armor 82, 72, 860, +4; aircraft 96, 48, 720, -2. Required reforms and techs as in the table. Ships: cost / combat power / transport: transport 55 / 0.5 / 2 regiments; frigate 70 / 1.1; man-of-war 95 / 1.55; ironclad 120 / 2.2 (Ironclad Warships); destroyer 150 / 2.65 (Torpedo Boats); submarine 165 / 2.45 (Oil-fired Boilers); carrier 260 / 4.2 (Carrier Aviation). `MAX_REGIMENT_STRENGTH` 1000, `MAX_SHIP_STRENGTH` 100.

**Movement.** Days = clamp(`BASE_ARMY_MOVE_DAYS` 5 x distance factor x terrain x composition x tech + fort x 0.4 + leader, 1, 15). Distance factor = hop km over a reference hop, clamped 0.2 to 3. Terrain cost: mountains 2.3, hills 1.5, forest 1.35, jungle 1.6, desert 1.3, marsh 1.5, arctic 1.45, else 1. Tech factor = 1 minus the army movement bonus, bonus capped at 0.35. Leader: logistics -0.7, cautious +0.45, reckless -0.35. Fleets: `BASE_FLEET_MOVE_DAYS` 4 x distance factor + 1 if the target is foreign + terrain x 0.3, clamped 1 to 10.

**Recruiting** (`src/sim/commands.ts`, `src/sim/politics.ts`). Standing cap = floor(soldier pop / 1000 x [0.8, 1.1, 1.55, 2.0] by conscription level). Recruit pool: soldier pops in the state or within `RECRUIT_RADIUS_KM` 250. New regiment organization = clamp(round(54 x army organization + type bonus), 18, 100). Army organization by professionalism 0 to 3: 0.84, 1, 1.15, 1.3. Morale: 0.9, 1, 1.12, 1.25.

**Supply** (`isSupplied`). Range = 2 + floor(army organization) + floor(supply range bonus). The search expands from the army's province and steps into non-friendly provinces only from depth 0, so it never finds friendly ground beyond depth 2. Range above 2 therefore adds nothing in practice. Unsupplied: organization -1.7, strength -4.4 per regiment per day. Supplied, in an own-controlled province: strength +min(18, missing, 5% of source pop) per day (the pop loses 0.45 per point), organization +1.4 x morale per day. Embarked armies count as supplied.

**Battle** (`resolveLandBattle`). Combat width scale = 1 if n is 24 or fewer, else (24 + sqrt(n - 24) x 0.55) / n (`LAND_COMBAT_WIDTH_CAP`, `LAND_COMBAT_WIDTH_EXCESS_FACTOR`). Offense = (type offense x width scale x flank + roll 0 to 6 + leader attack x 1.6 (defender 1.45) + army tech x 0.95 (defender 0.9)) x clamp(org + 0.35, 0.2, 1.45) x modern bonus. Army tech counts researched techs whose key contains "army", "military" or "small_arms". Defense = 1 + leader defense x 0.08 + type defense / max(2, units) x 0.3 (defender 0.34); defender adds terrain (mountains 0.24, hills 0.15, forest 0.10, jungle 0.12, marsh 0.08) and fort x 0.05. Organization damage = clamp(enemy offense / own defense x 1.8 (1.75 to the defender), 3, 60). Strength damage = clamp(enemy offense / own defense x (0.82 + enemy pursuit / max(2, enemy units) x 0.2), 2, 45).

Damage is divided by the width-capped regiment count. Artillery over 45% with frontline under 25% gets offense x 0.82 and defense x 0.72. Guard over 18% adds up to 12% offense and 14% defense. Reckless: offense x 1.12, organization damage x 1.1. Cautious: strength damage x 0.82. Defensive doctrine: defense +0.14. Broken: average organization under 8, then retreat with organization x 0.55. Battle score: +3.4 or -3.4 for a decisive result, plus (loss difference x 0.005) clamped to 1.5.

**Generals.** Five per nation, fixed by nation. Assignment picks the best by attack x 1.2 + defense (+0.8 for offensive doctrine). Siegecraft multiplies siege speed by 1.25.

**Sieges.** Daily progress = 0.028 / (1 + fort x 0.75) x leader (1.25 siegecraft) x (1 + min(0.95, artillery share x 1.4)) x (0.82 if frontline share under 0.2). Flips at 0.999. Hill and mountain provinces start at fort 1, others 0, and no command changes forts. An owner's army alone in its own occupied province regains 4% a day.

**Score** (`updateWarScores`). Occupation = (share of defender provinces held by attackers minus share of attacker provinces held by defenders) x 48, plus for each state goal controlled share x goal value x 0.9, added for the holder's side. Capital +8 or -8 per held capital. Blockade 0.18 per coastal province where one side has over 1.2 times the other's fleet power. Exhaustion term = (defender exhaustion minus attacker exhaustion) x 0.35. Total clamped to -100 to 100. Exhaustion per side grows 0.025 a day plus 0.00028 per strength lost, capped at 100.

**Goal values and effects** (`applyWarGoal`, values in `src/sim/systems/diplomacy.ts`). Annex state 38: state transfers, +2.4 / -1.8 prestige. Liberate state 24: state goes to the unclaimed nation, +1.4 / -1.1. Humiliate 18: +5 / -10. Add to sphere 22: target joins holder's sphere, +1. Take colony 28: only fully colonial states transfer, +1.6 / -0.8. Cut down to size 30: target -12 prestige, loses great power rank and sphere until the next monthly ranking, holder +2.

**Peace** (`offerPeaceTerms`). Needs the sum of chosen goals within your own score. Acceptance budget = clamp(your score + their exhaustion x 0.55 - your exhaustion x 0.2, 0, 140); a bundle over budget plus 2 is rejected with a counter-offer. White peace as above. `endWar` sets a truce of 5 years (`TRUCE_DURATION_DAYS`) between every pair of opponents. Auto-peace (`maybeAutoPeace`): when either side's pressure (own score + 0.4 x exhaustion gap) reaches 65, or either exhaustion reaches 96, the leading side offers the goals it can afford; at exhaustion over 98 it falls back to white peace.

**Mobilization.** Allowed only at war. Capacity = nonsoldier pop / 1000 x [0.02, 0.05, 0.10, 0.18] by conscription, minus standing regiments over the standing cap. Raises infantry at strength 830, organization clamp(38 + 10 x army organization, 20, 80), 14 each. Upkeep 0.16 per regiment per day (`MOBILIZED_UPKEEP_DAILY`) and civilian needs met falls 0.000007 per regiment per day. Demobilizing returns 35% of strength to the source pop. Standing upkeep: 2.5 per regiment and 1.7 per ship per month (`src/sim/balance.ts`).

**Naval.** Fleet battle damage = clamp((power + navy tech x 0.8 + roll 0 to 4) x 2.2, 1, 120). Landing overseas needs friendly fleet power at least 1.05 times the enemy's, and costs 7 organization.

**Rebels.** Rebel siege base 0.022 a day (`REBEL_SIEGE_BASE_DAILY`) over (1 + fort x 0.8), times siege factor 0.45 to 2.5. A rebellion enforces at progress 85 (`REBELLION_PROGRESS_TO_ENFORCE`), or after 180 held days with at least 35% held and rebels at 60% of loyal strength. Progress changes by held share x 1.35, +0.42 if rebels outnumber loyal troops by 5%, +0.24 if loyal strength is under 2,500, -0.6 with no rebel army, -0.35 under 5% held. Rebels follow the demand they spawned with, see [Politics and reform](politics-and-reform.md).

**Colonies.** A claim costs `COLONIAL_CLAIM_COST` 32 points and starts at 25% progress. Progress per day: 0.006, or 0.008 for a great power, only while you hold 32 points free. That is 125 days, or 94 for a great power. Points = naval bases x 10 per base level + conscription x 6 + professionalism x 4 + naval techs x 5 + 12 for great powers + event modifiers - 32 per open claim. Targets must be all-colonial states next to your land, or coastal with a naval base of yours. Rival claimants cool relations by 0.18 a day per pair.
