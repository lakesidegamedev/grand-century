# Diplomacy

Diplomacy decides who is friend, rival or target. It governs alliances, the pretexts that make a war cheap or expensive, the infamy that punishes aggression, and the ranking of the eight great powers. Get it right and wars come on your terms. Get it wrong and the world lines up against you.

## How it works

Diplomacy updates once a month (see [Time and the tick](time-and-the-tick.md)). Every pair of nations has exactly one **relation**: neutral (the default), alliance, guarantee, rivalry or truce. Each pair also has an **opinion** from -200 to 200 that drifts every month.

**Relations**

- **Alliance** lasts 10 years. Your allies join the wars you start, and the wars started against you.
- **Guarantee** has no end date. If the guaranteed nation is attacked, the guarantor is pulled in on its side. It is a promise you cannot refuse in the moment.
- **Truce** lasts 5 years and follows every peace. While it holds, neither side can declare war or sign an alliance with the other.
- **Rivalry** has no end date. It costs 12 diplomatic points and you can hold at most 4.

**Opinion** drifts toward 0 by 3.5% a month, then moves with what is going on. Alliances add +2.1 a month and guarantees +0.95. Rivalry subtracts 2 and a truce 0.75. Sharing an enemy adds +0.85 per enemy, up to 2 of them. Neighbours gain +0.35 (rivals lose 0.7). A sphere link adds +1.2.

**Diplomatic points (DP)** pay for pretexts and rivalries. Each nation starts with 24 and gains 1.6 a month, plus 0.9 for a great power, plus 1% of its prestige (prestige counted up to 100). The cap is 120.

### Pretexts and infamy

You can declare war without a reason, but it costs a lot of **infamy**, the world's measure of how dangerous you are. A **casus belli** (CB), a recognised pretext, makes the same war cheaper.

To get one you **fabricate** it: pay DP, wait a few months, and then hold it for 2 years. Aggressive goals (annex a state, take a colony) add a little infamy at the start of fabrication as well.

| War goal | Score cost | DP to fabricate | Days to fabricate | Infamy when you declare | Infamy to fabricate | Without a pretext |
|---|---|---|---|---|---|---|
| Annex state | 38 | 23.3 | 140 | 6.5 | 1.4 | 11.4 |
| Liberate state | 24 | 18.4 | 95 | 2.2 | 0 | 4.0 |
| Humiliate | 18 | 16.3 | 70 | 1.4 | 0 | 4.0 |
| Add to sphere | 22 | 17.7 | 85 | 1.8 | 0 | 4.0 |
| Take colony | 28 | 19.8 | 120 | 4.2 | 0.9 | 7.4 |
| Cut down to size | 30 | 20.5 | 110 | 2.6 | 0 | 4.6 |

Some claims need no fabrication. **Irredentist** claims, to retake a state that was yours at the start of the game, are open as long as a foreigner holds it, and cost only 45% of the normal annexation infamy. **Unification** claims, on the core states of a nation you could proclaim (see [Events and decisions](events-and-decisions.md) for formables), cost 60%. The world forgives nation-building more than naked conquest.

Infamy fades by 0.14 a month. At 18 or more you are an **outlaw**: every great power, and every nation that already dislikes you (opinion below -30), gets a free 2-year "cut down to size" pretext against you. High infamy also raises world tension (see [Crises and the Concert of Europe](crises.md)) and makes alliances harder to get.

### Great powers and spheres

Each month all nations are scored and the top 8 become **great powers**, ranked 1 to 8. The score is 9 x the square root of industry, plus 2.5 x military, plus prestige. Industry is factory levels and output (see [Production and industry](production-and-industry.md)); military is regiments, ships and mobilization capacity (see [War](war.md)). Prestige fades by 0.5% a month, so old glory has to be re-earned.

A great power can build **influence** over a smaller nation. At 100 points the nation joins its **sphere**. Only non-great-powers can be sphered. A great power gains 0.08 prestige and 6 treasury per client each month, and clients lose 0.05 prestige a month. If a patron falls out of the top 8, its whole sphere is released at once.

## Worked example

You are an average power with 24 DP, no infamy, and a neighbour holds a state you want. You fabricate an annexation pretext: 23.3 DP, 140 days, and +1.4 infamy at once. When it is ready you declare: +6.5. Total 7.9, well under 18. It fades in about 56 months.

Without the pretext, the same declaration costs 11.4 on its own. A second war right after leaves you at 22.8, past the limit. With a pretext, two wars is 15.8 and a third crosses 18.

An irredentist claim for a lost core state skips the fabrication wait and the 23.3 DP: declaring costs 2.93.

## What you can do

All of this is in the **Diplomacy** panel. Choose a nation in the roster (filters: Relevant, Powers, Near, All), and its dossier shows opinion, power and standing.

- **Propose Alliance.** Accepted when a score reaches 70. The score is their opinion of you, plus 6 per rivalry and 8 per war they are in, plus a power-balance term (25 for equal power, falling to 12 when the gap is half their strength), minus 2 per point of your infamy above 18. A refusal costs 4 opinion. Rivals and truce partners are refused outright. Break Alliance ends it at no penalty.
- **Guarantee** and **Withdraw Guarantee.** Costs nothing, but binds you into wars.
- **Declare Rivalry** (12 DP, max 4). Rivals are favoured targets for the AI and feed world tension.
- **Fabricate** and **Declare War** under "Pretext and War". Pick a goal and a state if it needs one. The panel shows the exact infamy before you commit.
- **Send Influence** (great powers). Each point adds 8 influence on the target and removes 3 from rivals. The **Great Powers** panel shows rankings and the influence race.
- **Leave the sphere** is in the **Formables** panel if you are a client: your patron's grip resets, opinion drops 80 and the patron loses 1.5 prestige.

Tips:

- **Get the pretext before you want the war.** It takes months and lasts two years.
- **Unify, do not conquer.** The discount is large enough to change which wars are affordable.
- **Mind your guarantees.** One drags you into a war you did not pick.

Edge cases:

- **Zero DP.** You cannot fabricate or declare rivalry, but you can still declare war without a pretext and pay the infamy.
- **At the limit.** Infamy over 18 does not stop you, it makes everyone else a legal enemy. Wait it out, or fight it.
- **Losing great-power status.** Your spheres vanish. Clients you held become free again.
- **Era start.** Relations, spheres and ranks begin from each scenario's own seed.

## Connections

**Driven by:**
- [Budget and taxation](budget-and-taxation.md): a patron pays and receives a monthly sum per client, so treasury state shapes what spheres cost.

- [Time and the tick](time-and-the-tick.md): diplomacy updates on the first of each month.
- [War](war.md): every peace starts a 5-year truce, and war goals move prestige and spheres.
- [AI nations](ai-nations.md): AI nations form alliances, pick rivals and fabricate pretexts.
- [Production and industry](production-and-industry.md): factory output feeds the power score that ranks great powers.
- [Events and decisions](events-and-decisions.md): events can grant pretexts, shift opinion, force rivalries or add infamy.
- [Crises and the Concert of Europe](crises.md): crisis outcomes redraw spheres and prestige.

**Affects:**
- [Events and decisions](events-and-decisions.md): opinion, relations and infamy feed event triggers.

- [War](war.md): pretexts, alliances, guarantees and truces decide who can fight and who joins.
- [Crises and the Concert of Europe](crises.md): infamy, rivalries and contested spheres raise tension, and only great powers can lead a crisis.
- [AI nations](ai-nations.md): the same rules limit what the AI can do.
- [Budget and taxation](budget-and-taxation.md): each client pays its patron 6 treasury a month.
- [Research](research.md): great powers research faster, and high infamy tilts the AI toward military technology.

## Status

Live in every scenario and era, with no difficulty setting. The starting great powers, alliances and rivalries come from each scenario's seed. Rivalry cap and cost apply to the player; the AI sets rivalries without paying DP.

Last checked: 2026-10-29, version 1.7.0

## Exact rules

Source `src/sim/systems/diplomacy.ts` unless noted. `runDiplomacyMonthly` runs in the monthly block of `src/sim/world.ts` after research and before crises, in this order: clear expired relations, rank great powers, drift opinions, influence, DP accrual, pretext queues, infamy decay and coalitions, then sphere income and prestige decay.

**Constants.** `TRUCE_DURATION_DAYS` 1,825 (5 x 365). `ALLIANCE_DURATION_DAYS` 3,650. `CB_DURATION_DAYS` 730. `INFAMY_LIMIT` 18. `RIVALRY_DP_COST` 12, `RIVALRY_CAP` 4. `IRREDENTIST_INFAMY_DISCOUNT` 0.45 and `UNIFICATION_INFAMY_DISCOUNT` 0.6 are multipliers on the annexation infamy of 6.5 (so 2.93 and 3.9). Opinion clamp -200 to 200. Starting DP 24; DP cap 120. Prestige fade `BALANCE.diplomacy.prestigeMonthlyDecayRate` 0.005 (`src/sim/balance.ts`).

**War goals** (`WAR_GOAL_RULES`): score, infamy on use, infamy on fabrication, fabrication days. Annex state 38, 6.5, 1.4, 140. Liberate state 24, 2.2, 0.4, 95. Humiliate 18, 1.4, 0.25, 70. Add to sphere 22, 1.8, 0.35, 85. Take colony 28, 4.2, 0.9, 120. Cut down to size 30, 2.6, 0.5, 110. Only annex state and take colony are aggressive, and only aggressive goals add fabrication infamy (the table above lists 0 for the others).

**Fabrication cost** = 10 + score x 0.35 DP. The pretext becomes usable at start + fabrication days and expires 730 days later.

**Declaring** (`src/sim/commands.ts`): blocked by a live truce or an existing war. With a matching pretext (same target, goal and state, or a stateless one) infamy rises by that pretext's cost. Without one, infamy rises by max(4, goal infamy x 1.75). Irredentist and unification claims are computed on the fly and open for 3,650 days. A declaration above 18 infamy logs a coalition warning.

**DP per month** = 1.6 + 0.9 if great power + clamp(prestige, 0, 100) x 0.01, capped at 120.

**Infamy**: -0.14 a month to a floor of 0. Coalition: if infamy is 18 or more, every great power and every nation whose opinion of the offender is under -30 gets a 2-year "cut down to size" pretext (`ensureContainmentCb`).

**Opinion drift** per month = -0.035 x opinion, then: alliance +2.1, guarantee +0.95, rivalry -2, truce -0.75, shared border +0.35 (rivalry -0.7), shared enemies +0.85 each up to 2, sphere link +1.2, two great powers courting the same minor -1.05.

**Alliances**: signing sets opinion to at least 65 (guarantee 35, rivalry at most -40, an additional -20). Acceptance (`evaluateAllianceAcceptance`) = opinion + 6 x target rivalries + 8 x target wars + 25 - |own power - their power| / max(20, their power) x 26 - 2 x max(0, own infamy - 18), accepted at 70 or more. Allies join a war if they are directly allied to the leader at opinion 35 or more, not in a hostile war, and not under truce with the enemy. The defender's bloc also takes guarantors. Guarantors need no opinion.

**Power score**: industry = sum of factory level x 11 + last output x 1.2 + employed / 2,000. Military = sum over regiments of 1.9 x clamp(strength / 1000, 0, 1.6), plus ship combat power, plus mobilization capacity x 0.12. Score = 9 x sqrt(industry) + 2.5 x military + prestige. The top 8 get rank 1 to 8.

**Influence**: each month a great power gains max(0.6, 3.6 - 0.28 x rank) points (pool cap 200) and the game spends up to 3 whole points on its best-scoring target, +(7 + max(0, 8 - rank)) each, -4 to rival claimants. This applies to the player too, so manual sending uses whatever is left over. Manual spend of N (1 to 20) gives +8N and -3N to rivals. 100 points creates the sphere: opinion at least 75, patron +0.5 prestige, client -0.25. Monthly: patron +6 treasury and +0.08 prestige per client; client -0.05 prestige. Leaving a sphere: opinion -80, patron -1.5 prestige, influence reset to 0.

**Edge cases.** A relation past `expiresDay` becomes neutral and keeps its opinion. Dropping out of the top 8 clears the sphere and releases clients. Only a non-great-power can be a client.
