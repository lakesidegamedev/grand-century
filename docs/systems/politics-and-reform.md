# Politics and reform

Politics decides which laws you can change and how angry your people get while you wait. A reform needs enough support in an **upper house** (the chamber that votes on reform), costs money and prestige, and tires the country so the next one is harder. Pops (the population groups that make up your nation) ask for reforms; if they are refused for long enough, they rebel.

## How it works

Each nation has four parties (Party of Order, Conservative Union, Liberal Coalition, Workers Front), each with a position from 0 to 3 on every reform. The upper house is a split of seats between ideologies. Your support for a reform is the share of seats held by parties whose position is at or above the level you want.

Once a month, after [culture](culture-and-nationalism.md) and before [research](research.md), the politics pass runs in this order:

1. Reform fatigue decays.
2. If the government is elective and an election is due, pops vote and the upper house shifts toward the result.
3. The upper house drifts toward the ideologies of your pops.
4. Pops gain or lose militancy and consciousness (see below).
5. Literacy and national consciousness are recomputed, and army limits are refreshed from your military reforms.
6. State unrest is recalculated from the pops after step 4.
7. Rebellions can spawn.

**Militancy** is how angry a pop is, **consciousness** is how politically aware it is, both on a scale of 0 to 10. A pop's **reform demand** is the one reform it wants most, picked from its unmet needs, consciousness, militancy and ideology.

**Political suppression** is not a button. It is a number from 0 to 1 the game works out from your government, your voting franchise level and your press rights level. The less free you are, the higher it is. It adds militancy and consciousness every month and feeds unrest. Freedom lowers it.

### Key numbers

| Item | Value |
|---|---|
| Reforms | 11, each with levels 0 to 3, enacted one level at a time |
| Support needed, political reforms | 62% |
| Support needed, social | 50% |
| Support needed, economic | 48% |
| Support needed, military | 45% |
| Government adjustment to support needed | Absolute monarchy and presidential dictatorship +12 points, fascist dictatorship +8, democracy -4 |
| Money cost at level N | Economic 420, military 390, social 360, political 300, plus 165 per level |
| Prestige cost at level N | Political 1.3, others 0.9, plus 0.35 per level |
| Fatigue gain per reform | 0.28 + 0.08 per level + category (political 0.06, economic 0.05, social 0.04, military 0.03) |
| Fatigue decay | 0.12 per month on a 0 to 1 scale, so 9 months from full to zero |
| Fatigue at 1.0 | 20 points less support, costs x2.25 |
| Reform upkeep | 4.2 per level enacted, every month |
| Election interval | 4 years, 5 for constitutional monarchy, never in other governments |
| Rebellion trigger | State unrest risk 0.5 or more and province militancy 5.95 or more, for 6 months |

### Worked example

An absolute monarchy starts with an upper house of 22% reactionary, 54% conservative, 20% liberal, 4% socialist. It wants Press Rights level 1 (a political reform, so 62% + 12 = 74% needed).

- Parties at level 1 or higher on Press Rights: conservative, liberal and socialist. Support is 54 + 20 + 4 = 78%. It passes.
- Cost: 300 + 165 = 465 money and 1.3 + 0.35 = 1.65 prestige.
- Fatigue rises by 0.28 + 0.08 + 0.06 = 0.42.

Now it wants Voting Franchise level 1. Raw support is also 78%, but fatigue 0.42 removes 0.42 x 20 = 8.4 points, leaving 69.6%. Blocked.

After one month fatigue is 0.30 and support 72%, still blocked. After two months fatigue is 0.18 and support is 74.4%, which clears 74%. The cost is now x1.225: 570 money and 2.02 prestige. This assumes the chamber has not drifted; in practice it moves a little every month.

## What you can do

Open **Politics** in the Statecraft group of the panel rail.

- **Enact a reform.** Under the four reform groups, each next level has a button showing "UH" (upper house) support against the required share. Hover for the reason it is blocked, the cost and the effect. Only the next level up can be enacted.
- **Read the unrest picture.** "Issues & Unrest" lists what your pops want most, as a share of demand, and your three most restless states.
- **Check suppression, election date and upper house** in the summary at the top.

Why you cannot pass a reform, in order of what the button tells you: it is already enacted, an earlier level is missing, your government blocks that depth, upper house support is too low (fatigue counts), or you lack money or prestige.

Tips:

- Space reforms. A second reform right after the first can be blocked, and always costs more.
- Widen the franchise and loosen the press if you want suppression down. It changes who the upper house answers to, so check which parties gain.
- Granting a demanded reform calms the pops that wanted it. Refusing one the game says you cannot pass pushes their militancy up.
- Your ruling party does not gate your own reforms. It only matters to AI nations, and as a modifier on research speed.

If a rebellion wins, its demand to enact a reform is applied directly, without cost or fatigue. Rebel demands are what your pops were already asking for.

## Connections

**Driven by:**
- [AI nations](ai-nations.md): AI nations enact reforms, which changes laws the same way yours do.
- [Research](research.md): culture technologies add monthly literacy and prestige.
- [War](war.md): rebellions and war outcomes can force a reform.

- [Population](population.md): pop needs, militancy, consciousness and ideology drive demand, unrest and votes
- [Culture and nationalism](culture-and-nationalism.md): minority militancy and consciousness feed unrest, and the culture pass runs just before politics
- [Budget and taxation](budget-and-taxation.md): your treasury pays for reforms
- [Crises and the Concert of Europe](crises.md): prestige, which reforms cost, rises and falls with congress outcomes
- [Events and decisions](events-and-decisions.md): events and decisions can move reform levels, unrest and militancy directly
- [Time and the tick](time-and-the-tick.md): politics runs on the first of each month

**Affects:**

- [Population](population.md): suppression, refused demands and social reforms change militancy and consciousness, and healthcare raises growth
- [Research](research.md): literacy drives research points, and the ruling party shifts research priorities
- [Budget and taxation](budget-and-taxation.md): reform upkeep is a monthly expense
- [War](war.md): rebellions spawn rebel armies, and conscription and army professionalism set army size, organisation and morale
- [The world market](the-world-market.md): trade policy sets the legal tariff band
- [Culture and nationalism](culture-and-nationalism.md): literacy speeds assimilation
- [Events and decisions](events-and-decisions.md): militancy, literacy and reform levels are event triggers
- [AI nations](ai-nations.md): AI nations enact their ruling party's reforms under the same rules

## Status

The rules are the same in every scenario, era and difficulty. What differs is where each nation starts: its government, upper house and reform levels. Governments do not change on their own. Elections only happen in democracies, constitutional monarchies and HMS governments.

Last checked: 2026-10-29, version 1.7.0

## Exact rules

All logic is in `src/sim/politics.ts` and `src/sim/systems/politics.ts` unless noted. Politics runs monthly, between culture and research (`src/sim/world.ts`).

### Reform legality

A reform at target level L is legal when, in this order: L is above the current level; L is exactly current + 1; L is within the government cap for its category; fatigued support is at least the required support; treasury covers the money cost; prestige covers the prestige cost.

- Raw support: sum of upper house shares of parties whose position on that reform is at least L.
- Fatigued support = raw support - fatigue x 0.2, clamped to 0 to 1 (`REFORM_FATIGUE_MAX_SUPPORT_PENALTY`).
- Required support: base political 0.62, social 0.50, military 0.45, economic 0.48. Absolute monarchy and presidential dictatorship +0.12, fascist dictatorship +0.08, democracy -0.04 (`reformSupportThreshold`).
- Money = round((base + 165 x L) x fatigue multiplier), base economic 420, political 300, social 360, military 390. Prestige = (1.3 for political, 0.9 otherwise) + 0.35 x L, times the multiplier (`reformCost`).
- Fatigue multiplier = 1 + fatigue x 1.25 (`REFORM_FATIGUE_MAX_COST_MULTIPLIER_EXTRA`).

### Government depth caps (`governmentCategoryCap`)

| Government | Political | Social | Economic | Military |
|---|---|---|---|---|
| Democracy, constitutional monarchy, HMS government | 3 | 3 | 3 | 3 |
| Proletarian dictatorship | 2 | 3 | 3 | 3 |
| Absolute monarchy, presidential dictatorship, fascist dictatorship | 1 | 2 | 3 | 3 |
| Uncivilized | 0 | 0 | 1 | 1 |

### Fatigue

- Gain on enactment: 0.28 + 0.08 x L + category (political 0.06, economic 0.05, social 0.04, military 0.03), capped at 1 (`REFORM_FATIGUE_GAIN_*`).
- Decay: minus 0.12 per monthly pass, floor 0 (`REFORM_FATIGUE_DECAY_PER_MONTH`). From 1.0 it reaches 0 on the ninth pass.
- AI nations enact reforms through the same legality check and gain the same fatigue (`src/sim/systems/ai.ts`).

### Enacting (`src/sim/commands.ts`)

Pays money and prestige, sets the level, adds fatigue. Every pop in your provinces whose demand is that reform loses 0.28 militancy and gains 0.1 consciousness. All other pops gain 0.03 consciousness. Trade policy re-clamps the tariff. Military reforms refresh army limits. Monthly upkeep is 4.2 x the sum of all reform levels, x0.55 while bankrupt (`BALANCE.economy.reformUpkeepPerLevel` in `src/sim/balance.ts`, applied in `src/sim/systems/budget.ts`).

### Reform effects (`reformMechanicalEffect`)

| Reform | Effect by level 0 to 3 |
|---|---|
| Voting franchise | Weights below |
| Upper house composition | Election retain 72, 62, 55, 38%; elective drift 0.10, 0.16, 0.22, 0.30; other drift 0.05, 0.07, 0.09, 0.14; authoritarian bias 0.07, 0.045, 0.02, 0 |
| Press rights | Lowers suppression only |
| School system | Literacy gain per month 0.0005 + 0.0012 x level |
| Healthcare | Pop growth +0.00012 x level per month |
| Pension system | Militancy relief per month 0, 0.018, 0.035, 0.055 (farmers, laborers, craftsmen) |
| Labor safety | Relief 0, 0.012, 0.028, 0.045 (laborers, craftsmen; farmers get 35%) |
| Conscription | Regiments per 1,000 soldiers 0.8, 1.1, 1.55, 2.0; mobilizable share 2, 5, 10, 18% |
| Army professionalism | Organisation x0.84, 1.00, 1.15, 1.30; morale x0.90, 1.00, 1.12, 1.25 |
| Trade policy | Tariff band (`tariffBandForTradePolicy`, `src/sim/balance.ts`) |
| Economic policy | Party position only, no market effect |

Franchise weight per pop type (`popSupportsFranchise`): level 0, aristocrat, capitalist and officer 0.8, others 0. Level 1, aristocrat and capitalist 1, clergy and officer 0.65, others 0.15. Level 2, aristocrat and capitalist 1, clergy, officer and clerk 0.8, craftsman 0.6, others 0.35. Level 3, everyone 1.

### Suppression

`suppression = clamp((1 - franchise/3) x 0.45 + (1 - press/3) x 0.35 + (elective ? 0.03 : 0.22) + (authoritarian ? 0.12 : 0), 0, 1)`. Authoritarian governments are absolute monarchy, presidential, proletarian and fascist dictatorship, and uncivilized. Each month every pop gains `suppression x 0.04` militancy (`BALANCE.population.suppressionMilitancyImpact`) and `suppression x 0.03 + blockedSupport x 0.08` consciousness, where blockedSupport is the national demand share for that pop's wanted reform.

### Demand and denied reforms

Pop demand is the first matching rule: soldier or officer with unmet needs above 0.22 wants conscription; unmet above 0.40 healthcare; above 0.33 pensions; above 0.28 labor safety; consciousness above 4.2 school system; liberal or socialist with consciousness above 4.8 wants franchise, then press rights, then upper house composition; reactionary or conservative with militancy above 5 wants army professionalism; liberal wants economic policy; socialist wants trade policy. Reforms already at level 3 are skipped. National demand weights each pop by `size x (0.45 + 0.55 x unmet needs)`.

If the wanted reform is legal now, the pop loses 0.01 militancy that month. If not, it gains `0.05 + 0.08 x demand share` (`deniedReformBasePressure`, `deniedReformSupportPressure`, `legalReformRelief`). Pop militancy is clamped 0 to 10.

### Unrest

For each state: `pressure = clamp((state militancy - 3.5) x 0.09 + unmet needs x 0.35 + suppression x 0.25 + blocked demand x 0.45, 0, 1.4)`; `unrestRisk = clamp(old x 0.72 + pressure x 0.4, 0, 2)`. Blocked demand is the share of national demand for reforms that are not currently legal. Demand is recomputed after step 4, so unrest sees the post-suppression pops.

### Rebellion (`BALANCE.rebellion`, `src/sim/balance.ts`)

A state counts as hot when unrest risk is at least 0.5 and its most militant province averages at least 5.95. A hot state adds 1 to its counter each month, a cool one subtracts 1 (floor 0). At 6 a rebellion spawns, if the state has not had one in 900 days, the nation has fewer than 2 active, and the world fewer than 8. It spawns clamp(floor(unrest risk x 1.8), 1, 3) regiments of 900 men, then unrest risk is x0.55.

The demand is the top reform demand in that state if it is not legal or holds over 24% of weight; otherwise independence for a minority culture holding 38% or more of the non-accepted pop; otherwise franchise. Resolution runs in `src/sim/systems/war.ts`: rebels win at progress 85 (or 180 hold days with 35% territory and 60% of loyal strength), a demanded reform is applied for free and militancy in the origin state drops 0.32. Enforced uprisings relieve 0.6 militancy and crushed ones 1.1; unrest risk is x0.35 afterwards. At most 32 rebel armies exist at once.

### Elections

Elective governments (democracy, constitutional monarchy, HMS government) hold one when the year reaches `nextElectionYear`, on the first monthly pass of that year. Each pop with franchise weight above 0 votes for the party scoring highest: 1 for matching ideology (0.58 otherwise), +0.36 or -0.14 for matching its wanted reform, -0.08 if that reform is currently illegal, + consciousness x 0.01, - unmet needs x 0.06, plus up to 0.05 noise. Votes are weighted by `size x franchise weight`. The upper house becomes `old x retain + vote share x (1 - retain)`, using the composition retain values above; communist and fascist seats retain `min(0.85, retain + 0.1)`. Next election is `max(3, interval)` years later (`src/sim/bootstrap.ts`: 4, or 5 for constitutional monarchy).

### Upper house drift

Monthly, each ideology moves toward the pop share: `new = old x (1 - d) + (pop share + bias) x d`. `d` is the elective or other drift value from the composition table. Bias is 0.05 for non-elective governments plus the composition bias, x1 for reactionary and x0.8 for conservative.

### Literacy and consciousness

`literacy += (0.0005 + school level x 0.0012 + clergy share x 0.05) x (1 - literacy)`, capped at 1. National consciousness is the size-weighted average pop consciousness. Literacy feeds research (`src/sim/systems/research.ts`) and pop consciousness growth (`src/sim/systems/pops.ts`).
