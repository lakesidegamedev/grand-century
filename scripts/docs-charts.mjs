#!/usr/bin/env node
/**
 * Generates the chart SVGs embedded in the Grand Century docs (docs/images/*-*.svg).
 *
 * Regenerate:  GAME_REPO_PATH=/path/to/game node scripts/docs-charts.mjs
 *
 * Every game number is read from the game's own source (constants and the
 * small formulas in src/sim and src/data), so a chart cannot drift from the
 * game. The only values written here are scenario inputs that the docs pages
 * state explicitly as examples (marked EXAMPLE) and chart axis ranges.
 * Output goes to <this repo>/docs/images.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', 'docs', 'images');
const GAME = process.env.GAME_REPO_PATH || new URL('..', import.meta.url).pathname.replace(/\/$/, '');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// Source readers
// ---------------------------------------------------------------------------
const cache = new Map();
const read = (rel) => {
  if (!cache.has(rel)) cache.set(rel, fs.readFileSync(path.join(GAME, rel), 'utf8'));
  return cache.get(rel);
};
const num = (s) => Number(String(s).replace(/_/g, ''));

/** Regex over a source file; returns the captures as numbers. Throws when the source changed shape. */
function grab(rel, re) {
  const m = read(rel).match(re);
  if (!m) throw new Error(`pattern not found in ${rel}: ${re}`);
  return m.slice(1).map(num);
}
const grab1 = (rel, re) => grab(rel, re)[0];
/** `const NAME = 1.25;` */
const constNum = (rel, name) => grab1(rel, new RegExp(`const ${name}(?::[^=]+)? = (-?[\\d_.]+)`));

function stripComments(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
}
/** Evaluate an object literal such as `export const NAME = { ... } as const;`. */
function objectLiteral(rel, name, scope = {}) {
  const src = read(rel);
  const start = src.indexOf(`const ${name}`);
  if (start < 0) throw new Error(`${name} not found in ${rel}`);
  let i = src.indexOf('{', start);
  const from = i;
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) break;
  }
  const text = stripComments(src.slice(from, i + 1)).replace(/ as (const|Record<[^>]*>|'[^']*'( \| '[^']*')*)/g, '');
  return new Function(...Object.keys(scope), `return (${text});`)(...Object.values(scope));
}
const BALANCE = objectLiteral('src/sim/balance.ts', 'BALANCE');
const CULTURE = objectLiteral('src/sim/systems/culture.ts', 'CULTURE_TUNING');
const WAR_GOALS = objectLiteral('src/sim/systems/diplomacy.ts', 'WAR_GOAL_RULES');

// ---------------------------------------------------------------------------
// SVG plotting kit
// ---------------------------------------------------------------------------
const BLUE = '#2563eb';
const RED = '#dc2626';
const INK = '#27272a';
const MUTED = '#52525b';
const GRID = '#e4e4e7';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = (v) => (Math.round(v * 100) / 100).toString();
const fmt = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toString();

class Canvas {
  constructor(title, w = 640, h = 360) {
    this.w = w;
    this.h = h;
    this.title = title;
    this.parts = [];
  }
  add(s) {
    this.parts.push(s);
  }
  text(x, y, s, o = {}) {
    const { size = 12, anchor = 'start', fill = INK, weight = 400, rotate, italic } = o;
    const tr = rotate ? ` transform="rotate(${rotate} ${f(x)} ${f(y)})"` : '';
    this.add(
      `<text x="${f(x)}" y="${f(y)}" font-size="${size}" text-anchor="${anchor}" fill="${fill}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}${tr}>${esc(s)}</text>`,
    );
  }
  rect(x, y, w, h, fill, o = {}) {
    const { opacity = 1, stroke, rx = 0 } = o;
    this.add(
      `<rect x="${f(x)}" y="${f(y)}" width="${f(Math.max(0, w))}" height="${f(Math.max(0, h))}" fill="${fill}" fill-opacity="${opacity}"${stroke ? ` stroke="${stroke}"` : ''}${rx ? ` rx="${rx}"` : ''}/>`,
    );
  }
  line(x1, y1, x2, y2, o = {}) {
    const { stroke = INK, width = 1, dash, opacity = 1 } = o;
    this.add(
      `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`,
    );
  }
  poly(pts, o = {}) {
    const { stroke = BLUE, width = 2.5, dash, opacity = 1 } = o;
    this.add(
      `<polyline fill="none" stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''} points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}"/>`,
    );
  }
  dot(x, y, fill = BLUE, r = 4) {
    this.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="1.5"/>`);
  }
  svg(desc) {
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" font-family='${FONT}' role="img" aria-label="${esc(desc)}">`,
      `<title>${esc(desc)}</title>`,
      `<rect x="0.5" y="0.5" width="${this.w - 1}" height="${this.h - 1}" fill="#fff" stroke="#d4d4d8"/>`,
      `<text x="16" y="26" font-size="15" font-weight="600" fill="${INK}">${esc(this.title)}</text>`,
      ...this.parts,
      '</svg>',
      '',
    ].join('\n');
  }
}

/** A plot area inside a canvas with linear or log axes. */
class Plot {
  constructor(cv, o) {
    this.cv = cv;
    this.box = o.box; // {x, y, w, h} of the inner plot area
    this.x = o.x; // [min, max, 'lin'|'log']
    this.y = o.y;
    Object.assign(this, { xlabel: o.xlabel, ylabel: o.ylabel, fx: o.fx ?? String, fy: o.fy ?? String });
    this.xticks = o.xticks;
    this.yticks = o.yticks;
    this.drawAxes(o);
  }
  sc(v, [lo, hi, type = 'lin'], a, b) {
    const t = type === 'log' ? (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (v - lo) / (hi - lo);
    return a + t * (b - a);
  }
  sx(v) {
    return this.sc(v, this.x, this.box.x, this.box.x + this.box.w);
  }
  sy(v) {
    return this.sc(v, this.y, this.box.y + this.box.h, this.box.y);
  }
  drawAxes(o) {
    const { cv, box } = this;
    for (const t of this.yticks) {
      const y = this.sy(t);
      cv.line(box.x, y, box.x + box.w, y, { stroke: GRID });
      cv.text(box.x - 6, y + 4, this.fy(t), { size: 11, anchor: 'end', fill: MUTED });
    }
    for (const t of this.xticks) {
      const x = this.sx(t);
      cv.line(x, box.y, x, box.y + box.h, { stroke: GRID });
      cv.text(x, box.y + box.h + 16, this.fx(t), { size: 11, anchor: 'middle', fill: MUTED });
    }
    cv.line(box.x, box.y + box.h, box.x + box.w, box.y + box.h, { stroke: '#a1a1aa' });
    cv.line(box.x, box.y, box.x, box.y + box.h, { stroke: '#a1a1aa' });
    if (this.xlabel) cv.text(box.x + box.w / 2, box.y + box.h + (o.xlabelDy ?? 36), this.xlabel, { size: 12, anchor: 'middle', fill: INK });
    if (this.ylabel) cv.text(box.x - (o.ylabelDx ?? 44), box.y + box.h / 2, this.ylabel, { size: 12, anchor: 'middle', fill: INK, rotate: -90 });
  }
  pts(data) {
    return data.map(([x, y]) => [this.sx(x), this.sy(y)]);
  }
  line(data, o) {
    this.cv.poly(this.pts(data), o);
  }
  hline(y, label, o = {}) {
    const { stroke = MUTED, dash = '5 4', anchor = 'end', dy = -5 } = o;
    const py = this.sy(y);
    this.cv.line(this.box.x, py, this.box.x + this.box.w, py, { stroke, dash, width: 1.3 });
    if (label) this.cv.text(anchor === 'end' ? this.box.x + this.box.w - 4 : this.box.x + 4, py + dy, label, { size: 11, anchor, fill: stroke });
  }
  vline(x, label, o = {}) {
    const { stroke = MUTED, dash = '5 4', dx = 4, ty = this.box.y + 12, anchor = 'start' } = o;
    const px = this.sx(x);
    this.cv.line(px, this.box.y, px, this.box.y + this.box.h, { stroke, dash, width: 1.3 });
    if (label) this.cv.text(px + dx, ty, label, { size: 11, anchor, fill: stroke });
  }
  band(x0, x1, fill, opacity = 0.12) {
    const a = this.sx(x0);
    const b = this.sx(x1);
    this.cv.rect(a, this.box.y, b - a, this.box.h, fill, { opacity });
  }
  mark(x, y, label, o = {}) {
    const { fill = BLUE, dx = 8, dy = -8, anchor = 'start', color = INK } = o;
    this.cv.dot(this.sx(x), this.sy(y), fill);
    if (label) this.cv.text(this.sx(x) + dx, this.sy(y) + dy, label, { size: 11, anchor, fill: color });
  }
}

function legend(cv, x, y, items, o = {}) {
  const { gap = 18 } = o;
  items.forEach((it, i) => {
    const yy = y + i * gap;
    if (it.swatch) cv.rect(x, yy - 9, 12, 12, it.color, { opacity: it.opacity ?? 1 });
    else cv.line(x, yy - 3, x + 20, yy - 3, { stroke: it.color, width: 2.5, dash: it.dash });
    cv.text(x + (it.swatch ? 18 : 26), yy + 1, it.label, { size: 11.5, fill: INK });
  });
}

const BOX = { x: 62, y: 44, w: 556, h: 252 };
const linspace = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pct = (v) => `${fmt(v * 100, 0)}%`;

const made = [];
function save(name, cv, desc) {
  fs.writeFileSync(path.join(OUT, name), cv.svg(desc));
  made.push(name);
}

// ---------------------------------------------------------------------------
// time-and-the-tick: real seconds per game year at each speed
// ---------------------------------------------------------------------------
{
  const daysPerSec = read('src/worker/sim.worker.ts').match(/SPEED_DAYS_PER_SEC = \[([\d,\s]+)\]/)[1].split(',').map(num);
  const yearDays = grab1('src/sim/calendar.ts', /absoluteDay \/ (\d+)\)/);
  const speeds = daysPerSec.slice(1); // index 0 is paused
  const cv = new Canvas('Real seconds per game year at each speed');
  const p = new Plot(cv, {
    box: { x: 70, y: 48, w: 548, h: 248 },
    x: [0, speeds.length, 'lin'],
    y: [1, 300, 'log'],
    xticks: [],
    yticks: [1, 3, 10, 30, 100, 300],
    xlabel: '',
    ylabel: 'Real seconds per game year (log scale)',
    ylabelDx: 52,
    fy: (v) => `${v} s`,
  });
  const bw = p.box.w / speeds.length;
  speeds.forEach((d, i) => {
    const secs = yearDays / d;
    const x = p.box.x + i * bw + bw * 0.2;
    const y = p.sy(secs);
    cv.rect(x, y, bw * 0.6, p.box.y + p.box.h - y, i === speeds.length - 1 ? RED : BLUE, { opacity: 0.9 });
    cv.text(x + bw * 0.3, y - 6, `${fmt(secs, 1)} s`, { size: 12, anchor: 'middle', weight: 600 });
    cv.text(x + bw * 0.3, p.box.y + p.box.h + 16, `x${i + 1}`, { size: 12, anchor: 'middle', fill: INK });
    cv.text(x + bw * 0.3, p.box.y + p.box.h + 30, `${d} days/s`, { size: 10.5, anchor: 'middle', fill: MUTED });
  });
  cv.text(p.box.x + p.box.w / 2, p.box.y + p.box.h + 50, 'Game speed (days of game time per real second)', { size: 12, anchor: 'middle' });
  save('time-and-the-tick-speed-chart.svg', cv, 'Bar chart of real seconds per game year at speeds x1 to x5, from 182.5 seconds at x1 down to 4.1 seconds at x5, on a log scale.');
}

// ---------------------------------------------------------------------------
// population: monthly growth rate against needs met
// ---------------------------------------------------------------------------
{
  const P = 'src/sim/systems/pops.ts';
  const [base, perNeed, perHc] = [
    grab1(P, /(-0\.\d+) \+ pop\.needsMet \* [\d.]+ \+ healthcareLevel/),
    ...grab(P, /pop\.needsMet \* ([\d.]+) \+ healthcareLevel \* ([\d.]+)/),
  ];
  const [capBase, capPerNeed] = grab(P, /needsScaledGrowthCap = ([\d.]+) \+ pop\.needsMet \* ([\d.]+)/);
  const { minGrowthRate, maxGrowthRate } = BALANCE.population;
  const rate = (n, hc) => clamp(base + n * perNeed + hc * perHc, minGrowthRate, Math.min(maxGrowthRate, capBase + n * capPerNeed)) * 100;
  const zero = (hc) => (-base - hc * perHc) / perNeed;
  const cv = new Canvas('Monthly population growth against needs met');
  const p = new Plot(cv, {
    box: { x: 72, y: 46, w: 546, h: 246 },
    x: [0, 1, 'lin'], y: [-0.1, 0.03, 'lin'],
    xticks: linspace(0, 1, 5), yticks: [-0.1, -0.08, -0.06, -0.04, -0.02, 0, 0.02],
    xlabel: 'Needs met', ylabel: 'Growth per month (%)', ylabelDx: 56,
    fx: pct, fy: (v) => fmt(v, 2),
  });
  const xs = linspace(0, 1, 200);
  const styles = [
    { hc: 0, stroke: BLUE, dash: undefined, label: 'No Healthcare' },
    { hc: 1, stroke: RED, dash: undefined, label: 'Healthcare 1' },
    { hc: 2, stroke: RED, dash: '7 4', label: 'Healthcare 2' },
    { hc: 3, stroke: RED, dash: '2 4', label: 'Healthcare 3' },
  ];
  p.hline(0, '', { stroke: '#71717a', dash: undefined });
  for (const s of styles) p.line(xs.map((n) => [n, rate(n, s.hc)]), { stroke: s.stroke, dash: s.dash, width: 2.4 });
  for (const s of styles) p.mark(zero(s.hc), 0, `${fmt(zero(s.hc) * 100, 1)}%`, { fill: s.stroke, dy: s.hc === 0 ? -9 : 17, dx: s.hc === 0 ? -4 : 0, anchor: s.hc === 0 ? 'end' : 'middle', color: s.stroke });
  p.hline(Math.min(maxGrowthRate, capBase + capPerNeed) * 100, `cap ${fmt(Math.min(maxGrowthRate, capBase + capPerNeed) * 100, 4)}% a month`, { anchor: 'start', dy: -6 });
  legend(cv, 400, 214, styles.map((s) => ({ color: s.stroke, dash: s.dash, label: s.label })), { gap: 17 });
  cv.text(BOX.x + 10, 352, 'Dots mark the break-even needs level where growth turns positive.', { size: 11, fill: MUTED, anchor: 'start' });
  save('population-growth-chart.svg', cv, 'Line chart of monthly growth rate against needs met. Growth crosses zero at 69.2 percent needs met with no Healthcare reform and at 60.0, 50.8 and 41.5 percent with Healthcare levels 1 to 3, and is capped at 0.0175 percent a month.');
}

// ---------------------------------------------------------------------------
// production-and-industry
// ---------------------------------------------------------------------------
const E = BALANCE.economy;
const ECON = 'src/sim/systems/economy.ts';
const GD = 'src/data/gameData.ts';
const capShare = grab1(ECON, /netBeforeCapital\) \* ([\d.]+);/);
const clerkShare = grab1(ECON, /wagePool \* ([\d.]+);\n\s+const craftWages/);
const levelBoost = grab1(ECON, /\(1 \+ factory\.level \* ([\d.]+)\) \* factoryTechBoost/);
const rgoLevelBoost = grab1(ECON, /\(1 \+ province\.rgo\.level \* ([\d.]+)\) \* BALANCE\.economy\.rgoOutputBoost/);
const price = (key) => grab1(GD, new RegExp(`key: '${key}', name: '[^']+', category: '\\w+', basePrice: ([\\d.]+)`));
const recipeIn = (key) => grab1(GD, new RegExp(`key: '${key}'[\\s\\S]*?inputs: \\[input\\('\\w+', ([\\d.]+)\\)\\]`));
const recipeOut = (key) => grab1(GD, new RegExp(`key: '${key}'[\\s\\S]*?output: output\\('\\w+', ([\\d.]+)\\)`));
const mill = (sold = 1, workers = 2000, level = 1) => {
  const units = (workers / 1000) * (1 + level * levelBoost);
  const input = recipeIn('factory_fabric') * units * E.factoryInputIntensity * price('cotton');
  const produced = recipeOut('factory_fabric') * units * E.factoryOutputBoost;
  const full = produced * price('fabric') * E.factoryRevenueMultiplier;
  const revenue = full * sold;
  const wages = revenue * E.factoryWageShare;
  const operating = E.factoryOperatingBase + level * E.factoryOperatingPerLevel;
  const net = revenue - input - wages - operating;
  const owners = Math.max(0, net) * capShare;
  const plant = net - owners;
  return { units, input, produced, revenue, wages, operating, net, owners, plant, floored: plant < E.factoryProfitFloor ? E.factoryProfitFloor : plant };
};
{
  // where a week's sale value goes
  const cv = new Canvas("Where a week's sale value goes", 640, 400);
  const full = mill(1);
  const farmLevel = 3;
  const rgoWorkers = farmLevel * E.rgoEmploymentPerLevel;
  const grain = recipeOut('rgo_grain') * (rgoWorkers / 1000) * (1 + farmLevel * rgoLevelBoost) * E.rgoOutputBoost;
  const grainValue = grain * price('grain');
  const farm = { wages: grainValue * E.rgoWageShare, owners: grainValue * E.rgoOwnerShare };
  farm.state = grainValue - farm.wages - farm.owners;
  const colors = { wages: BLUE, owners: RED, state: '#f59e0b', inputs: '#93c5fd', operating: '#a1a1aa', plant: '#1e3a8a' };
  const cols = [
    { label: 'Resource site', total: grainValue, parts: [['wages', farm.wages], ['owners', farm.owners], ['state', farm.state]] },
    { label: 'Factory', total: full.revenue, parts: [['wages', full.wages], ['inputs', full.input], ['operating', full.operating], ['owners', full.owners], ['plant', full.plant]] },
  ];
  const names = { wages: 'Wages', owners: 'Owners', state: 'State', inputs: 'Inputs', operating: 'Operating cost', plant: 'Plant keeps' };
  const panel = (x0, title, yLabel, valueOf, fmtv) => {
    cv.text(x0, 52, title, { size: 12.5, weight: 600 });
    const base = 300;
    const top = 76;
    cols.forEach((c, i) => {
      const bx = x0 + 22 + i * 130;
      let y = base;
      const scaleMax = valueOf === 'share' ? 1 : Math.max(grainValue, full.revenue);
      for (const [k, v] of c.parts) {
        const h = ((valueOf === 'share' ? v / c.total : v) / scaleMax) * (base - top);
        y -= h;
        cv.rect(bx, y, 96, h, colors[k], { opacity: 0.92 });
        if (h > 14) cv.text(bx + 48, y + h / 2 + 4, valueOf === 'share' ? pct(v / c.total) : fmt(v, 2), { size: 11, anchor: 'middle', fill: ['inputs', 'operating'].includes(k) ? INK : '#fff' });
      }
      cv.text(bx + 48, base + 16, c.label, { size: 11.5, anchor: 'middle' });
      if (valueOf !== 'share') cv.text(bx + 48, y - 6, fmt(c.total, 2), { size: 11.5, anchor: 'middle', weight: 600 });
    });
    cv.line(x0 + 10, base, x0 + 10 + 280, base, { stroke: '#a1a1aa' });
    cv.text(x0 + 150, base + 34, yLabel, { size: 11.5, anchor: 'middle', fill: MUTED });
  };
  panel(14, 'Share of sale value', 'Percent of a full week of sales', 'share');
  panel(330, 'Worked examples', 'Money per week', 'abs');
  const keys = ['wages', 'inputs', 'operating', 'owners', 'plant', 'state'];
  keys.forEach((k, i) => {
    const x = 16 + (i % 3) * 205;
    const y = 358 + Math.floor(i / 3) * 18;
    cv.rect(x, y - 9, 11, 11, colors[k]);
    cv.text(x + 17, y + 1, names[k], { size: 11 });
  });
  save('production-and-industry-sale-split-chart.svg', cv, "Stacked bars of where a week's sale value goes. A resource site pays 80 percent wages, 12 percent owners and 8 percent the state. A factory pays 45 percent wages, then inputs, operating cost, owners and plant. The second panel shows the worked examples in money.");
}
{
  // plant profit against share sold
  const cv = new Canvas('Plant profit against share of output sold (level-1 Fabric Mill)');
  const xs = linspace(0, 1, 100);
  const raw = (s) => mill(s).plant;
  const flo = (s) => mill(s).floored;
  const ymin = Math.floor(raw(0) / 5) * 5;
  const p = new Plot(cv, {
    box: { x: 64, y: 46, w: 554, h: 244 },
    x: [0, 1, 'lin'], y: [ymin, 12, 'lin'],
    xticks: linspace(0, 1, 5), yticks: linspace(ymin, 10, Math.round((10 - ymin) / 5)),
    xlabel: 'Share of output sold', ylabel: 'Plant profit per week', fx: pct, fy: (v) => fmt(v, 0),
  });
  p.hline(0, '', { stroke: '#71717a', dash: undefined });
  p.line(xs.map((s) => [s, raw(s)]), { stroke: RED, dash: '6 4', width: 2 });
  p.line(xs.map((s) => [s, flo(s)]), { stroke: BLUE });
  const fl = E.factoryProfitFloor;
  const hit = xs.find((s) => raw(s) >= fl);
  p.mark(1, mill(1).plant, `${fmt(mill(1).plant, 2)} at 100% sold`, { dx: -8, dy: 18, anchor: 'end' });
  p.mark(0.6, mill(0.6).plant, `${fmt(mill(0.6).plant, 2)} at 60% sold`, { dx: 8, dy: 18 });
  p.mark(hit, fl, `floor ${fl} below ${pct(hit)} sold`, { dx: 10, dy: -10 });
  legend(cv, 90, 70, [
    { color: BLUE, label: 'Profit the game records (floored)' },
    { color: RED, dash: '6 4', label: 'Real result before the floor' },
  ]);
  save('production-and-industry-profit-chart.svg', cv, 'Line chart of weekly plant profit against the share of output sold for a level-1 Fabric Mill: 10.56 when everything sells, 5.89 at 60 percent sold, and a floor of 0.15 when sales are very low.');
}

// ---------------------------------------------------------------------------
// the-world-market
// ---------------------------------------------------------------------------
const MK = 'src/sim/systems/market.ts';
const pressureClamp = E.marketPressureClamp;
const steadyPrice = (r) => {
  const k = E.marketDamping * clamp(Math.log(r), -pressureClamp, pressureClamp);
  const v = E.marketBaseReversion / (1 - (1 - E.marketBaseReversion) * Math.exp(k));
  return clamp(v, E.deflationGuard, E.inflationGuard);
};
{
  const cv = new Canvas('Long-run price against demand over supply');
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 556, h: 244 },
    x: [0.2, 5, 'log'], y: [0, 6.5, 'lin'],
    xticks: [0.2, 0.5, 1, 2, 5], yticks: [0, 1, 2, 3, 4, 5, 6],
    xlabel: 'Effective demand over effective supply (log scale)', ylabel: 'Long-run price (multiple of base)',
    fx: (v) => `${v}`, fy: (v) => `${v}x`, ylabelDx: 40,
  });
  const xs = Array.from({ length: 241 }, (_, i) => Math.exp(Math.log(0.2) + ((Math.log(5) - Math.log(0.2)) * i) / 240));
  p.hline(E.inflationGuard, `upper limit ${E.inflationGuard}x`, { stroke: RED, anchor: 'start' });
  p.hline(E.deflationGuard, `lower limit ${E.deflationGuard}x`, { stroke: RED, anchor: 'end', dy: -6 });
  p.line(xs.map((r) => [r, steadyPrice(r)]));
  const rLo = Math.exp(-pressureClamp);
  const rHi = Math.exp(pressureClamp);
  p.mark(rLo, steadyPrice(rLo), `r = ${fmt(rLo, 2)}: ${fmt(steadyPrice(rLo), 3)}x`, { dx: 8, dy: -22 });
  p.mark(rHi, steadyPrice(rHi), `r = ${fmt(rHi, 2)}: ${fmt(steadyPrice(rHi), 3)}x`, { dx: -8, dy: -12, anchor: 'end' });
  p.mark(1, steadyPrice(1), '1.0x at balance', { dx: 10, dy: 18 });
  save('the-world-market-steady-price-chart.svg', cv, 'Line chart of the long-run price multiple against the ratio of effective demand to supply, flat beyond ratios of 0.58 and 1.73, running from 0.569 times base to 4.878 times base, well inside the 0.35 and 6.0 limits.');
}
{
  const cv = new Canvas('Price under a permanent worst-case shortage');
  // weekly price step, iterated from base
  const base = 1;
  let price_ = base;
  const series = [[0, price_]];
  const step = (cur) => {
    const pressure = pressureClamp;
    const target = cur * Math.exp(pressure * E.marketDamping);
    const anchored = target + (base - target) * E.marketBaseReversion;
    const bounded = clamp(anchored, E.deflationGuard * base, E.inflationGuard * base);
    return clamp(cur + (bounded - cur) * E.marketSmoothing, E.deflationGuard * base, E.inflationGuard * base);
  };
  const WEEKS = 520; // ten game years: the climb is far slower than the first 80 weeks suggest
  for (let w = 1; w <= WEEKS; w++) {
    price_ = step(price_);
    series.push([w / 52, price_]);
  }
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 556, h: 244 },
    x: [0, 10, 'lin'], y: [0, 6.5, 'lin'],
    xticks: linspace(0, 10, 10), yticks: [0, 1, 2, 3, 4, 5, 6],
    xlabel: 'Years since the shortage began (52 weeks each)', ylabel: 'Price (multiple of base)', fy: (v) => `${v}x`, ylabelDx: 40,
  });
  const ceiling = steadyPrice(Math.exp(pressureClamp));
  p.hline(E.inflationGuard, `upper limit ${E.inflationGuard}x`, { stroke: RED, anchor: 'start' });
  p.hline(ceiling, `ceiling of this shortage ${fmt(ceiling, 2)}x`, { stroke: MUTED, anchor: 'end', dy: 15 });
  p.line(series);
  for (const y of [1, 2]) p.mark(y, series[y * 52][1], `year ${y}: ${fmt(series[y * 52][1], 2)}x`, { dx: 8, dy: 16 });
  const w4 = series.find(([, v]) => v >= 4);
  p.mark(w4[0], w4[1], `4x after ${fmt(w4[0], 1)} years`, { dx: 10, dy: 20 });
  save('the-world-market-shortage-chart.svg', cv, 'Line chart of the weekly price of one good over ten years under a permanent worst-case shortage, rising from base to 4 times base only after about 7 years, toward a ceiling of about 4.9 times base.');
}
{
  const [impactImp, impactExp] = [E.importTariffPriceImpact, E.exportTariffPriceImpact];
  const [impMin, impNeg] = grab(MK, /Math\.max\(([\d.]+), 1 \+ safe \* IMPORT_TARIFF_PRICE_IMPACT \* ([\d.]+)\)/);
  const [expMin] = grab(MK, /Math\.max\(([\d.]+), 1 - safe \* EXPORT_TARIFF_PRICE_IMPACT\)/);
  const expNeg = grab1(MK, /Math\.abs\(safe\) \* EXPORT_TARIFF_PRICE_IMPACT \* ([\d.]+)/);
  const imp = (r) => (r >= 0 ? 1 + r * impactImp : Math.max(impMin, 1 + r * impactImp * impNeg));
  const exp = (r) => (r >= 0 ? Math.max(expMin, 1 - r * impactExp) : 1 + Math.abs(r) * impactExp * expNeg);
  const lo = BALANCE.ai.minTariff;
  const hi = BALANCE.ai.maxTariff;
  const cv = new Canvas('What the tariff slider does to prices', 640, 430);
  const p = new Plot(cv, {
    box: { x: 64, y: 46, w: 554, h: 232 },
    x: [lo, hi, 'lin'], y: [0.93, 1.12, 'lin'],
    xticks: [-0.25, -0.15, -0.05, 0.05, 0.15, 0.25, 0.35], yticks: [0.94, 0.98, 1.02, 1.06, 1.1],
    xlabel: 'Tariff rate', ylabel: 'Multiplier on world price', fx: (v) => `${v > 0 ? '+' : ''}${fmt(v * 100, 0)}%`, fy: (v) => fmt(v, 2), ylabelDx: 46,
    xlabelDy: 34,
  });
  const xs = linspace(lo, hi, 120);
  p.hline(1, '', { stroke: '#71717a', dash: undefined });
  p.line(xs.map((r) => [r, imp(r)]), { stroke: BLUE });
  p.line(xs.map((r) => [r, exp(r)]), { stroke: RED });
  p.mark(hi, imp(hi), `${fmt(imp(hi), 3)}`, { dx: -6, dy: -8, anchor: 'end' });
  p.mark(lo, imp(lo), `${fmt(imp(lo), 3)}`, { dx: 6, dy: 16 });
  p.mark(hi, exp(hi), `${fmt(exp(hi), 3)}`, { dx: -6, dy: 16, anchor: 'end' });
  p.mark(lo, exp(lo), `${fmt(exp(lo), 3)}`, { dx: 6, dy: -8 });
  legend(cv, 96, 66, [
    { color: BLUE, label: 'Buy price multiplier (importers pay)' },
    { color: RED, label: 'Share sellers keep (exporters)' },
  ]);
  // Trade Policy bands
  const bandsSrc = read('src/sim/balance.ts').match(/const bands: \[number, number\]\[\] = \[([\s\S]*?)\];/)[1];
  const rows = [...bandsSrc.matchAll(/\[([^\]]+)\],\s*\/\/\s*([\w ]+)/g)].map((m) => ({
    range: new Function('aiMin', 'aiMax', `return [${m[1]}];`)(lo, hi),
    name: m[2].trim(),
  }));
  cv.text(14, 340, 'Slider range allowed by each Trade Policy level', { size: 11.5, weight: 600 });
  rows.forEach((r, i) => {
    const y = 350 + i * 18;
    const a = p.sx(r.range[0]);
    const b = p.sx(clamp(r.range[1], lo, hi));
    cv.rect(a, y, b - a, 12, i % 2 ? RED : BLUE, { opacity: 0.35 });
    const label = `${r.name.replace(/_/g, ' ')} (${fmt(r.range[0] * 100, 0)}% to ${fmt(r.range[1] * 100, 0)}%)`;
    const right = p.box.x + p.box.w - b > a - p.box.x;
    cv.text(right ? b + 6 : a - 6, y + 10, label, { size: 10.5, anchor: right ? 'start' : 'end' });
  });
  save('the-world-market-tariff-chart.svg', cv, 'Line chart against tariff rate from -25 to +35 percent: the buy price multiplier rises from 0.944 to 1.105 and the share sellers keep falls from 1.006 to 0.965. Four bars show the slider range allowed by each Trade Policy level.');
}

// ---------------------------------------------------------------------------
// budget-and-taxation: the bankruptcy example
// ---------------------------------------------------------------------------
{
  const B = 'src/sim/systems/budget.ts';
  const army = grab1(B, /bankruptcyCut = nation\.isBankrupt \? ([\d.]+) : 1/);
  const subs = grab1(B, /subsidySpend \* \(nation\.isBankrupt \? ([\d.]+) : 1\)/);
  const admin = grab1(B, /adminSpend \* \(nation\.isBankrupt \? ([\d.]+) : 1\)/);
  const constr = grab1(B, /constructionSpend \* \(nation\.isBankrupt \? ([\d.]+) : 1\)/);
  const reform = grab1(B, /reformUpkeep \* \(nation\.isBankrupt \? ([\d.]+) : 1\)/);
  // EXAMPLE from the page: income 1,000 and monthly bills before the cuts.
  const EX = { start: 400, income: 1000, army: 1200, admin: 500, reforms: 300, overhead: 100, subsidies: 100, recoveryNet: 665 };
  const billsNormal = EX.army + EX.admin + EX.reforms + EX.overhead + EX.subsidies;
  const billsBankrupt = EX.army * army + EX.admin * admin + EX.reforms * reform + EX.overhead * constr + EX.subsidies * subs;
  const stuckNet = EX.income - billsBankrupt;
  const enter = E.bankruptcyEnterTreasury;
  const exit = E.bankruptcyExitTreasury;
  // timeline: pass k applies net to the treasury, then enter/exit is checked
  let t = EX.start;
  let bankrupt = false;
  const acting = [[0, t]];
  const idle = [[0, t]];
  let ti = t;
  let idleBankrupt = false;
  const span = [];
  for (let m = 1; m <= 7; m++) {
    t += bankrupt ? EX.recoveryNet - 0 : EX.income - billsNormal;
    ti += idleBankrupt ? stuckNet : EX.income - billsNormal;
    if (!idleBankrupt && ti <= enter) idleBankrupt = true;
    acting.push([m, t]);
    idle.push([m, ti]);
    if (!bankrupt && t <= enter) { bankrupt = true; span.push(m); }
    else if (bankrupt && t >= exit) { bankrupt = false; span.push(m); }
  }
  const lastActing = acting.findIndex(([, v], i) => i > 0 && v >= exit);
  const cv = new Canvas('Treasury through a bankruptcy (example from the page)', 640, 410);
  const p = new Plot(cv, {
    box: { x: 72, y: 46, w: 546, h: 244 },
    x: [0, 7, 'lin'], y: [-2600, 1000, 'lin'],
    xticks: linspace(0, 7, 7), yticks: [-2500, -1800, -1000, 0, 550, 1000],
    xlabel: 'Months', ylabel: 'Treasury', fy: (v) => v.toLocaleString('en-US'), ylabelDx: 58,
  });
  p.band(span[0], Math.min(lastActing, 7), RED, 0.1);
  p.hline(enter, `enter bankruptcy at ${enter.toLocaleString('en-US')}`, { stroke: RED, anchor: 'start', dy: 14 });
  p.hline(exit, `exit at ${exit}`, { stroke: BLUE, anchor: 'end' });
  p.hline(0, '', { stroke: '#71717a', dash: undefined });
  p.line(idle.slice(span[0] - 0), { stroke: RED, dash: '6 4', width: 2 });
  p.line(acting.slice(0, lastActing + 1), { stroke: BLUE });
  acting.slice(0, lastActing + 1).forEach(([m, v]) => p.mark(m, v, m === 0 || m === span[0] || m === lastActing ? Math.round(v).toLocaleString('en-US') : '', { dx: m === lastActing ? -8 : 8, dy: m === 0 ? -8 : -9, anchor: m === lastActing ? 'end' : 'start' }));
  legend(cv, 76, 346, [
    { color: BLUE, label: `Net +${EX.recoveryNet} after cutting bills` },
    { color: RED, dash: '6 4', label: `Do nothing: net ${fmt(stuckNet, 0)} a month` },
    { color: RED, swatch: true, opacity: 0.18, label: 'Bankrupt' },
  ], { gap: 17 });
  cv.text(16, 402, `Treasury is limited to ${BALANCE.economy.treasuryFloor.toLocaleString('en-US')} at the bottom and ${BALANCE.economy.treasurySoftCap.toLocaleString('en-US')} at the top.`, { size: 11, fill: MUTED });
  save('budget-and-taxation-bankruptcy-chart.svg', cv, 'Line chart of treasury over months: 400 falling to -800 and -2,000, bankrupt past the -1,800 line, then recovering by 665 a month to 660, above the 550 exit line. A dashed line shows the treasury barely moving if nothing changes.');
}

// ---------------------------------------------------------------------------
// politics-and-reform: reform fatigue
// ---------------------------------------------------------------------------
{
  const POL = 'src/sim/politics.ts';
  const max = constNum(POL, 'REFORM_FATIGUE_MAX');
  const decay = constNum(POL, 'REFORM_FATIGUE_DECAY_PER_MONTH');
  const gainBase = constNum(POL, 'REFORM_FATIGUE_GAIN_BASE');
  const gainLevel = constNum(POL, 'REFORM_FATIGUE_GAIN_PER_LEVEL');
  const gainPolitical = grab1(POL, /REFORM_FATIGUE_GAIN_BY_CATEGORY[^{]*\{[^}]*political: ([\d.]+)/);
  const penalty = constNum(POL, 'REFORM_FATIGUE_MAX_SUPPORT_PENALTY');
  const costExtra = constNum(POL, 'REFORM_FATIGUE_MAX_COST_MULTIPLIER_EXTRA');
  const gain = gainBase + 1 * gainLevel + gainPolitical; // one political level-1 reform
  const run = (reforms) => {
    let v = clamp(reforms * gain, 0, max);
    const out = [[0, v]];
    for (let m = 1; m <= 9; m++) {
      v = Math.max(0, v - decay);
      out.push([m, v]);
    }
    return out;
  };
  const cv = new Canvas('Reform fatigue after enacting reforms', 640, 360);
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 482, h: 244 },
    x: [0, 9, 'lin'], y: [0, 1, 'lin'],
    xticks: linspace(0, 9, 9), yticks: [0, 0.25, 0.5, 0.75, 1],
    xlabel: 'Months since the last reform passed', ylabel: 'Reform fatigue', fy: (v) => fmt(v, 2), ylabelDx: 40,
  });
  // right-hand axes derived from the same fatigue value
  [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
    const y = p.sy(v);
    cv.text(p.box.x + p.box.w + 8, y + 4, `${fmt(v * penalty * 100, 0)}`, { size: 11, fill: MUTED });
    cv.text(p.box.x + p.box.w + 56, y + 4, `${fmt(1 + v * costExtra, 2)}x`, { size: 11, fill: MUTED });
  });
  cv.text(p.box.x + p.box.w + 8, p.box.y - 22, 'Support', { size: 10.5, fill: INK });
  cv.text(p.box.x + p.box.w + 8, p.box.y - 10, 'penalty', { size: 10.5, fill: INK });
  cv.text(p.box.x + p.box.w + 56, p.box.y - 22, 'Cost', { size: 10.5, fill: INK });
  cv.text(p.box.x + p.box.w + 56, p.box.y - 10, 'factor', { size: 10.5, fill: INK });
  const one = run(1);
  const three = run(3);
  p.line(three, { stroke: RED });
  p.line(one, { stroke: BLUE });
  p.mark(0, one[0][1], fmt(one[0][1], 2), { dx: 8, dy: 16 });
  p.mark(0, three[0][1], `${fmt(three[0][1], 2)} (capped)`, { fill: RED, dx: 8, dy: 16 });
  const zero1 = one.find(([, v]) => v === 0)[0];
  const zero3 = three.find(([, v]) => v === 0)[0];
  p.mark(zero1, 0, `clear at month ${zero1}`, { dx: -8, dy: -10, anchor: 'end' });
  p.mark(zero3, 0, `month ${zero3}`, { fill: RED, dx: -8, dy: -10, anchor: 'end' });
  legend(cv, 250, 70, [
    { color: BLUE, label: 'One political reform (level 1)' },
    { color: RED, label: 'Three reforms in a row' },
  ]);
  save('politics-and-reform-fatigue-chart.svg', cv, 'Line chart of reform fatigue decaying 0.12 a month from 0.42 after one political reform, or from the cap of 1 after three in a row. Right axes show the matching support penalty in points, 0 to 20, and cost multiplier, 1 to 2.25.');
}

// ---------------------------------------------------------------------------
// culture-and-nationalism
// ---------------------------------------------------------------------------
{
  const CS = 'src/sim/systems/culture.ts';
  const exponent = grab1(CS, /Math\.pow\(clamp\(primaryShare, 0, 1\), ([\d.]+)\)/);
  const [litBase] = grab(CS, /literacyFactor = ([\d.]+) \+ clamp\(nation\.literacy/);
  const literacy = 0.4; // EXAMPLE: the page's worked example
  const rate = (share, policy) => CULTURE.assimilationBase * share ** exponent * (litBase + literacy) * CULTURE.assimilationPolicy[policy] * 100;
  const cv = new Canvas('Monthly assimilation against local majority share');
  const p = new Plot(cv, {
    box: { x: 66, y: 46, w: 552, h: 244 },
    x: [0, 1, 'lin'], y: [0, 1, 'lin'],
    xticks: linspace(0, 1, 5), yticks: [0, 0.2, 0.4, 0.6, 0.8, 1],
    xlabel: 'Primary plus accepted culture share of the province', ylabel: 'Assimilation per month (%)', fx: pct, fy: (v) => fmt(v, 1), ylabelDx: 44,
  });
  const xs = linspace(0, 1, 100);
  p.hline(CULTURE.assimilationBase * 100, `base ${fmt(CULTURE.assimilationBase * 100, 1)}%`, { anchor: 'start', dy: -6 });
  const styles = [
    ['exclusionary', RED, undefined],
    ['assimilationist', BLUE, undefined],
    ['pluralist', BLUE, '7 4'],
  ];
  for (const [k, c, d] of styles) p.line(xs.map((s) => [s, rate(s, k)]), { stroke: c, dash: d });
  legend(cv, 90, 70, styles.map(([k, c, d]) => ({ color: c, dash: d, label: `${k[0].toUpperCase()}${k.slice(1)} (x${CULTURE.assimilationPolicy[k]})` })));
  p.mark(0.8, rate(0.8, 'assimilationist'), `${fmt(rate(0.8, 'assimilationist'), 3)}% at 80%`, { dx: 10, dy: 20 });
  cv.text(16, 352, `Literacy ${literacy}, same religion, no movement. Rate = base x share^${exponent} x (${litBase} + literacy) x policy.`, { size: 11, fill: MUTED });
  save('culture-and-nationalism-assimilation-chart.svg', cv, 'Line chart of monthly assimilation against the local share of primary or accepted culture, a curve with exponent 1.5 for three culture policies at literacy 0.4, with the 0.6 percent base rate marked.');
}
{
  const CS = 'src/sim/systems/culture.ts';
  const start = grab1(CS, /radicalism: ([\d.]+),/);
  const T = CULTURE;
  const delta = (c) => T.radicalBase + c.con * T.radicalPerConsciousness + c.mil * T.radicalPerMilitancy + T.radicalPolicy[c.policy] - c.needs * T.radicalNeedsRelief;
  // EXAMPLE cases are the three given on the page
  const cases = [
    { label: 'Calm, well fed', mil: 3, con: 3, needs: 0.9, policy: 'assimilationist', color: BLUE, dash: '7 4' },
    { label: 'Middling', mil: 3, con: 3, needs: 0.5, policy: 'assimilationist', color: BLUE },
    { label: 'Angry, exclusionary', mil: 6, con: 5, needs: 0.4, policy: 'exclusionary', color: RED },
  ];
  const cv = new Canvas('Movement radicalism over five years');
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 556, h: 244 },
    x: [0, 60, 'lin'], y: [0, 100, 'lin'],
    xticks: linspace(0, 60, 5), yticks: [0, 20, 40, 60, 80, 100],
    xlabel: 'Months', ylabel: 'Radicalism (0 to 100)', ylabelDx: 40,
  });
  p.hline(T.uprisingRadicalism, `uprising gate ${T.uprisingRadicalism}`, { stroke: RED, anchor: 'end', dy: -6 });
  for (const c of cases) {
    let r = start;
    const d = delta(c);
    const pts = [[0, r]];
    let fired = null;
    for (let m = 1; m <= 60; m++) {
      r = clamp(r + d, 0, 100);
      pts.push([m, r]);
      if (r >= T.uprisingRadicalism && c.mil >= T.uprisingMilitancy) { fired = m; break; }
    }
    p.line(pts, { stroke: c.color, dash: c.dash });
    c.d = d;
    if (fired) p.mark(fired, pts[pts.length - 1][1], `uprising at month ${fired}`, { fill: RED, dx: 8, dy: 4 });
  }
  legend(cv, 330, 128, cases.map((c) => ({ color: c.color, dash: c.dash, label: `${c.label} (${c.d >= 0 ? '+' : ''}${fmt(c.d, 2)} a month)` })));
  cv.text(16, 352, `An uprising also needs average militancy of ${T.uprisingMilitancy} or more. Starting radicalism ${start}.`, { size: 11, fill: MUTED });
  save('culture-and-nationalism-radicalism-chart.svg', cv, 'Line chart of movement radicalism over 60 months for three cases. The calm well-fed movement fades, the middling one climbs slowly to about 40, and the angry exclusionary one passes the uprising gate of 85 in about two years.');
}

// ---------------------------------------------------------------------------
// crises
// ---------------------------------------------------------------------------
{
  const C = 'src/sim/systems/crisis.ts';
  const floor = constNum(C, 'SPAWN_TENSION_FLOOR');
  const [decayBase, decayRate] = grab(C, /decay = ([\d.]+) \+ tension \* ([\d.]+)/);
  const [capWar, perWar] = grab(C, /Math\.min\((\d+), gpWars \* ([\d.]+)\)/);
  const capInf = grab1(C, /Math\.min\((\d+), infamyPressure\)/);
  const [infBase, infOver] = grab(C, /infamyPressure \+= ([\d.]+) \+ \(nation\.infamy - infamyLimit\) \* ([\d.]+)/);
  const [capRiv, perRiv] = grab(C, /Math\.min\(([\d.]+), gpRivalries \* ([\d.]+)\)/);
  const [capBit, perBit] = grab(C, /Math\.min\(([\d.]+), bitterPairs \* ([\d.]+)\)/);
  const [capCon, perCon] = grab(C, /Math\.min\((\d+), contested \* ([\d.]+)\)/);
  const crisisAdd = grab1(C, /label: 'Active crisis', value: ([\d.]+)/);
  const start = grab1(C, /world\.tension \?\? ([\d.]+)/);
  const [spawnSpan, spawnScale, spawnMin] = grab(C, /spawnChance = \(\(tension - SPAWN_TENSION_FLOOR\) \/ \((\d+) - SPAWN_TENSION_FLOOR\)\) \* ([\d.]+) \+ ([\d.]+)/);
  // EXAMPLE world: counts of each cause per month for two years
  const months = 24;
  const sched = (m) => ({
    wars: m < 5 ? 0 : m < 15 ? 2 : 1,
    infamous: m < 8 ? 0 : m < 18 ? 1 : 0,
    infamyOver: 4,
    rivalries: m < 3 ? 1 : m < 12 ? 3 : 4,
    bitter: m < 10 ? 0 : 2,
    contested: m < 6 ? 1 : 3,
    crisis: m >= 14 && m < 20 ? 1 : 0,
  });
  let tension = start;
  const rows = [];
  for (let m = 1; m <= months; m++) {
    const s = sched(m);
    const parts = {
      'Wars': Math.min(capWar, s.wars * perWar),
      'Infamy': s.infamous ? Math.min(capInf, s.infamous * (infBase + s.infamyOver * infOver)) : 0,
      'Rivalries': Math.min(capRiv, s.rivalries * perRiv),
      'Bitter pairs': Math.min(capBit, s.bitter * perBit),
      'Contested spheres': Math.min(capCon, s.contested * perCon),
      'Active crisis': s.crisis * crisisAdd,
    };
    const decay = decayBase + tension * decayRate;
    const total = Object.values(parts).reduce((a, b) => a + b, 0);
    rows.push({ m, parts, decay, total, tension });
    tension = clamp(tension + total - decay, 0, 100);
    rows[rows.length - 1].after = tension;
  }
  const cv = new Canvas('Where world tension comes from (example world)', 640, 560);
  const p = new Plot(cv, {
    box: { x: 62, y: 70, w: 520, h: 214 },
    x: [0, months, 'lin'], y: [0, 12, 'lin'],
    xticks: [0, 4, 8, 12, 16, 20, 24], yticks: [0, 3, 6, 9, 12],
    xlabel: 'Months', ylabel: 'Tension added or lost per month', ylabelDx: 40,
  });
  const colors = ['#1d4ed8', '#3b82f6', '#93c5fd', '#bfdbfe', '#a1a1aa', RED];
  const keys = Object.keys(rows[0].parts);
  const bw = p.box.w / months;
  rows.forEach((r, i) => {
    let y = p.sy(0);
    keys.forEach((k, ki) => {
      const h = p.sy(0) - p.sy(r.parts[k]);
      y -= h;
      cv.rect(p.box.x + i * bw + 1, y, bw - 2, h, colors[ki]);
    });
  });
  p.line(rows.map((r, i) => [i + 0.5, r.decay]), { stroke: INK, width: 2, dash: '5 3' });
  // tension level on the right axis (0 to 100)
  const ty = (v) => p.box.y + p.box.h - (v / 100) * p.box.h;
  cv.poly(rows.map((r, i) => [p.box.x + (i + 0.5) * bw, ty(r.after)]), { stroke: RED, width: 2.2 });
  [0, 25, 50, 75, 100].forEach((v) => cv.text(p.box.x + p.box.w + 6, ty(v) + 4, String(v), { size: 11, fill: RED }));
  cv.text(p.box.x + p.box.w + 38, p.box.y + p.box.h / 2, 'World tension', { size: 12, fill: RED, anchor: 'middle', rotate: 90 });
  cv.line(p.box.x, ty(floor), p.box.x + p.box.w, ty(floor), { stroke: RED, dash: '5 4', width: 1.2 });
  cv.text(p.box.x + 4, ty(floor) - 5, `crisis can spawn at ${floor}`, { size: 11, fill: RED });
  // legend row beneath the title
  keys.forEach((k, i) => {
    const x = 14 + i * 100;
    cv.rect(x, 38, 10, 10, colors[i]);
    cv.text(x + 14, 47, k.length > 12 ? k.replace('Contested spheres', 'Spheres') : k, { size: 10.5 });
  });
  cv.line(14, 59, 40, 59, { stroke: INK, dash: '5 3', width: 2 });
  cv.text(46, 62, `Decay (${decayBase} + ${decayRate} x tension)`, { size: 10.5 });
  cv.line(200, 59, 226, 59, { stroke: RED, width: 2.2 });
  cv.text(232, 62, 'Tension level (right axis)', { size: 10.5, fill: RED });
  // panel 2: spawn chance
  const q = new Plot(cv, {
    box: { x: 62, y: 372, w: 520, h: 130 },
    x: [floor, spawnSpan, 'lin'], y: [0, 0.5, 'lin'],
    xticks: [35, 50, 65, 80, 100], yticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    xlabel: 'World tension', ylabel: 'Monthly spawn chance', fy: pct, ylabelDx: 40, xlabelDy: 34,
  });
  q.line(linspace(floor, spawnSpan, 65).map((t) => [t, ((t - floor) / (spawnSpan - floor)) * spawnScale + spawnMin]), { stroke: BLUE });
  q.mark(floor, spawnMin, pct(spawnMin), { dx: 8, dy: -8 });
  q.mark(spawnSpan, spawnScale + spawnMin, pct(spawnScale + spawnMin), { dx: -8, dy: 16, anchor: 'end' });
  cv.text(16, 346, 'Example world: the number of wars, rivalries and other causes per month is illustrative.', { size: 11, fill: MUTED });
  save('crises-tension-chart.svg', cv, 'Stacked bars of the monthly tension added by wars, infamy, rivalries, bitter relations, contested spheres and an active crisis in an example world, against the decay line and the tension level with its spawn floor of 35. A second panel shows the monthly crisis spawn chance rising from 5 percent at tension 35 to 50 percent at 100.');
}
{
  const C = 'src/sim/systems/crisis.ts';
  const show = constNum(C, 'SHOWDOWN_POWER_RATIO');
  const back = constNum(C, 'AI_BACKDOWN_RATIO');
  const lo = 0.5;
  const hi = 2.5;
  const cv = new Canvas("What happens at showdown, by your bloc's power ratio", 640, 300);
  const box = { x: 40, y: 90, w: 560, h: 56 };
  const sx = (v) => box.x + ((v - lo) / (hi - lo)) * box.w;
  const segs = [
    [lo, back, RED, 0.55, 'AI backs down'],
    [back, 1 / show, RED, 0.25, 'Other side wins'],
    [1 / show, show, '#71717a', 0.85, 'War'],
    [show, hi, BLUE, 0.7, 'You win'],
  ];
  for (const [a, b, c, o, label] of segs) {
    cv.rect(sx(a), box.y, sx(b) - sx(a), box.h, c, { opacity: o });
    if (sx(b) - sx(a) > 50) cv.text((sx(a) + sx(b)) / 2, box.y + box.h / 2 + 5, label, { size: 12.5, weight: 600, anchor: 'middle', fill: '#fff' });
  }
  [0.5, 1 / show, 1, show, 2, 2.5].forEach((v) => {
    cv.line(sx(v), box.y + box.h, sx(v), box.y + box.h + 7, { stroke: INK });
    cv.text(sx(v), box.y + box.h + 22, fmt(v, 2), { size: 11, anchor: 'middle', fill: MUTED });
  });
  cv.line(sx(back), box.y + box.h, sx(back), box.y + box.h + 7, { stroke: RED });
  cv.text(box.x + box.w / 2, box.y + box.h + 46, 'Your bloc power divided by the other bloc power', { size: 12, anchor: 'middle' });
  const callout = (x, y, label, c) => {
    cv.line(x, y + 3, x, box.y, { stroke: c, width: 1.2 });
    cv.text(x + 5, y + 2, label, { size: 11, fill: c });
  };
  callout(sx(back), 50, `Below ${back} an AI lead folds early`, RED);
  callout(sx(1 / show), 68, `${back} to ${fmt(1 / show, 2)}: congress for the other side`, RED);
  callout(sx(show), 50, `${show} or more: congress for you`, BLUE);
  cv.text(sx(1), box.y + box.h + 78, `War between ${fmt(1 / show, 2)} and ${show}`, { size: 12, anchor: 'middle', fill: INK });
  cv.text(16, 280, `The AI backs down early only while temperature is between 50 and 99.`, { size: 11, fill: MUTED });
  save('crises-showdown-chart.svg', cv, 'Bar of power ratio from 0.5 to 2.5 split into outcome bands: an AI lead backs down early below 0.62, the other side wins a congress up to 0.69, a bloc war between 0.69 and 1.45, and a congress for you at 1.45 or more.');
}

// ---------------------------------------------------------------------------
// events-and-decisions
// ---------------------------------------------------------------------------
{
  const EV = 'src/sim/systems/events.ts';
  const [scale, cap] = grab(EV, /fireChance = clamp\(totalWeight \* ([\d.]+), 0, ([\d.]+)\)/);
  const minW = grab1(EV, /Math\.max\(([\d.]+), \(event\.weight/);
  const chance = (n, mtth, weight = 1) => clamp(n * Math.max(minW, weight / mtth) * scale, 0, cap) * 100;
  const cv = new Canvas('Chance an event fires at a check');
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 556, h: 244 },
    x: [0, 16, 'lin'], y: [0, 45, 'lin'],
    xticks: [], yticks: [0, 10, 20, 30, 42],
    xlabel: 'Number of eligible events (each weight 1)', ylabel: 'Chance something fires (%)', fy: (v) => `${v}%`, ylabelDx: 42,
  });
  const ns = Array.from({ length: 15 }, (_, i) => i + 1);
  const bw = p.box.w / 16;
  p.hline(cap * 100, `cap ${fmt(cap * 100, 0)}%`, { stroke: RED, anchor: 'start', dy: -5 });
  const series = [[100, BLUE, 0.9], [12, RED, 0.9]];
  ns.forEach((n, i) => {
    series.forEach(([mtth, color], si) => {
      const v = chance(n, mtth);
      const x = p.box.x + (i + 0.5) * bw + (si - 0.5) * (bw * 0.42) - bw * 0.2;
      const y = p.sy(v);
      cv.rect(x, y, bw * 0.4, p.sy(0) - y, color, { opacity: color === RED ? 0.75 : 0.9 });
    });
    cv.text(p.box.x + (i + 0.5) * bw, p.sy(0) + 16, String(n), { size: 11, anchor: 'middle', fill: MUTED });
  });
  legend(cv, 90, 96, [
    { swatch: true, color: BLUE, label: 'Mean time to happen 100 months' },
    { swatch: true, color: RED, opacity: 0.75, label: 'Mean time to happen 12 months' },
  ]);
  save('events-and-decisions-fire-chance-chart.svg', cv, 'Bar chart of the chance that an event fires at a check against the number of eligible events, for events with mean time to happen 100 months and 12 months. Slow events add very little, while faster ones reach the 42 percent cap.');
}

// ---------------------------------------------------------------------------
// war
// ---------------------------------------------------------------------------
const WAR = 'src/sim/systems/war.ts';
{
  const cap = constNum(WAR, 'LAND_COMBAT_WIDTH_CAP');
  const factor = constNum(WAR, 'LAND_COMBAT_WIDTH_EXCESS_FACTOR');
  const eff = (n) => (n <= cap ? n : cap + Math.sqrt(n - cap) * factor);
  const cv = new Canvas('Combat width: committing more regiments to one battle', 640, 360);
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 482, h: 244 },
    x: [1, 60, 'lin'], y: [0, 60, 'lin'],
    xticks: [1, 10, 20, 30, 40, 50, 60], yticks: [0, 10, 20, 30, 40, 50, 60],
    xlabel: 'Regiments committed to one battle', ylabel: 'Effective regiments (fighting power)', ylabelDx: 42,
  });
  const ns = linspace(1, 60, 118);
  p.line([[1, 1], [60, 60]], { stroke: '#a1a1aa', dash: '4 4', width: 1.5 });
  p.line(ns.map((n) => [n, eff(n)]), { stroke: BLUE });
  p.vline(cap, `cap ${cap}`, { stroke: RED });
  for (const n of [48, 60]) p.mark(n, eff(n), `${n} -> ${fmt(eff(n), 1)}`, { dx: -8, dy: -10, anchor: 'end' });
  // share that counts, right axis 0 to 100%
  const sy2 = (v) => p.box.y + p.box.h - v * p.box.h;
  cv.poly(ns.map((n) => [p.sx(n), sy2(eff(n) / n)]), { stroke: RED, width: 2.2 });
  [0, 0.25, 0.5, 0.75, 1].forEach((v) => cv.text(p.box.x + p.box.w + 6, sy2(v) + 4, pct(v), { size: 11, fill: RED }));
  cv.text(p.box.x + p.box.w + 52, p.box.y + p.box.h / 2, 'Share of the stack that counts', { size: 11.5, fill: RED, anchor: 'middle', rotate: 90 });
  legend(cv, 90, 70, [
    { color: BLUE, label: 'Effective regiments' },
    { color: '#a1a1aa', dash: '4 4', label: 'If every regiment counted' },
    { color: RED, label: 'Share that counts (right axis)' },
  ], { gap: 17 });
  save('war-combat-width-chart.svg', cv, 'Line chart of effective regiments against regiments committed to one battle. It follows y equals x up to 24, then flattens: 48 regiments fight as 26.7 and 60 as 27.3. A second line shows the share of the stack that counts falling to 45 percent.');
}
{
  const flip = grab1(WAR, /occupationProgress >= ([\d.]+)\) \{\n\s+province\.controller = army\.owner/);
  const [daily, fortStep] = grab(WAR, /const daily = \(([\d.]+) \/ \(1 \+ province\.fortLevel \* ([\d.]+)\)\)/);
  const leader = grab1(WAR, /siegecraft' \? ([\d.]+) : 1/);
  const [artCap, artMult] = grab(WAR, /artilleryBoost = 1 \+ Math\.min\(([\d.]+), typePower\.artilleryShare \* ([\d.]+)\)/);
  const days = (fort, art, lead) => Math.ceil(flip / ((daily / (1 + fort * fortStep)) * (lead ? leader : 1) * (1 + Math.min(artCap, art * artMult))));
  const cases = [
    ['Infantry only', 0, false, BLUE, 0.55],
    ['Artillery 50% of stack', 0.5, false, BLUE, 0.9],
    ['Artillery 100% of stack', 1, false, '#1e3a8a', 1],
    ['Infantry, siegecraft general', 0, true, RED, 0.85],
  ];
  const cv = new Canvas('Days for a province to fall to a siege');
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 556, h: 244 },
    x: [0, 2, 'lin'], y: [0, 70, 'lin'],
    xticks: [], yticks: [0, 10, 20, 30, 40, 50, 60, 70],
    xlabel: '', ylabel: 'Days until the province flips',
    ylabelDx: 40,
  });
  [0, 1].forEach((fort, gi) => {
    const gw = p.box.w / 2;
    cases.forEach(([label, art, lead, color, op], ci) => {
      const d = days(fort, art, lead);
      const bw = gw / 6;
      const x = p.box.x + gi * gw + gw * 0.12 + ci * bw * 1.15;
      const y = p.sy(d);
      cv.rect(x, y, bw, p.sy(0) - y, color, { opacity: op });
      cv.text(x + bw / 2, y - 5, String(d), { size: 12, anchor: 'middle', weight: 600 });
    });
    cv.text(p.box.x + gi * gw + gw / 2, p.sy(0) + 18, fort === 0 ? 'Fort level 0 (open ground)' : 'Fort level 1 (hills and mountains)', { size: 12, anchor: 'middle' });
  });
  legend(cv, 80, 64, cases.map(([label, , , color, op]) => ({ swatch: true, color, opacity: op, label })), { gap: 16 });
  save('war-siege-chart.svg', cv, 'Grouped bar chart of days for a province to flip under siege. At fort level 0: 36 days with infantry only, 21 with artillery at half the stack, 19 with all artillery and 29 with a siegecraft general. At fort level 1 the same cases take 63, 37, 33 and 50 days.');
}
{
  const band = constNum(WAR, 'WHITE_PEACE_SCORE_BAND');
  const mutual = constNum(WAR, 'WHITE_PEACE_MUTUAL_EXHAUSTION');
  const fee = constNum(WAR, 'WHITE_PEACE_PRESTIGE_FEE');
  const cv = new Canvas('Prestige you pay to ask for white peace', 640, 520);
  const draw = (box, xr, ticks, xlabel, fn, note) => {
    const p = new Plot(cv, { box, x: [xr[0], xr[1], 'lin'], y: [0, fee + 2, 'lin'], xticks: ticks, yticks: [0, 2, 4, 6], xlabel, ylabel: 'Prestige paid', ylabelDx: 38 });
    const xs = linspace(xr[0], xr[1], 400);
    const pts = [];
    xs.forEach((x, i) => {
      const y = fn(x);
      if (i > 0 && y !== pts[pts.length - 1][1]) pts.push([x, pts[pts.length - 1][1]]);
      pts.push([x, y]);
    });
    p.line(pts, { stroke: BLUE });
    cv.text(box.x + 6, box.y - 8, note, { size: 11.5, fill: MUTED });
    return p;
  };
  const p1 = draw({ x: 62, y: 62, w: 540, h: 150 }, [-100, 100], [-100, -50, -10, 0, 10, 50, 100], 'War score from the asker\'s view', (s) => (Math.abs(s) <= band ? 0 : fee), `Free when the score is within ${band} of zero.`);
  p1.band(-band, band, BLUE, 0.12);
  p1.mark(-band, fee, `${fee}`, { dx: -8, dy: -8, anchor: 'end' });
  p1.mark(band, fee, `${fee}`, { dx: 8, dy: -8 });
  const p2 = draw({ x: 62, y: 296, w: 540, h: 150 }, [0, 100], [0, 25, 50, mutual, 100], 'Exhaustion of both sides (score outside the free band)', (x) => (x >= mutual ? 0 : fee), `Free when both sides are at ${mutual} or more.`);
  p2.band(mutual, 100, BLUE, 0.12);
  save('war-white-peace-chart.svg', cv, 'Step charts of the prestige paid to ask for white peace: 6 when the war score is outside minus 10 to plus 10, and free inside that band; and 6 unless both sides are at 75 exhaustion or more, when it is free.');
}

// ---------------------------------------------------------------------------
// diplomacy
// ---------------------------------------------------------------------------
{
  const D = 'src/sim/systems/diplomacy.ts';
  const limit = constNum(D, 'INFAMY_LIMIT');
  const irr = constNum(D, 'IRREDENTIST_INFAMY_DISCOUNT');
  const uni = constNum(D, 'UNIFICATION_INFAMY_DISCOUNT');
  const [noCbMin, noCbMult] = grab('src/sim/commands.ts', /Math\.max\((\d+), rule\.infamyUse \* ([\d.]+)\)/);
  const names = { annex_state: 'Annex', liberate_state: 'Liberate', humiliate: 'Humiliate', add_to_sphere: 'Sphere', take_colony: 'Colony', cut_down_to_size: 'Cut down' };
  const groups = Object.entries(WAR_GOALS).map(([k, r]) => ({ label: names[k] ?? k, pretext: r.infamyUse, none: Math.max(noCbMin, r.infamyUse * noCbMult) }));
  const annex = WAR_GOALS.annex_state;
  groups.push({ label: 'Irredentist', pretext: annex.infamyUse * irr, none: null }, { label: 'Unification', pretext: annex.infamyUse * uni, none: null });
  const cv = new Canvas('Infamy added by declaring war, by war goal', 640, 380);
  const p = new Plot(cv, {
    box: { x: 56, y: 50, w: 566, h: 240 },
    x: [0, groups.length, 'lin'], y: [0, 24, 'lin'],
    xticks: [], yticks: [0, 6, 12, 18, 24], ylabel: 'Infamy added', ylabelDx: 36,
  });
  p.hline(limit, `limit ${limit} (outlaw)`, { stroke: RED, anchor: 'start' });
  const gw = p.box.w / groups.length;
  groups.forEach((g, i) => {
    const x0 = p.box.x + i * gw + gw * 0.12;
    const bw = gw * 0.37;
    [['pretext', BLUE, 0], ['none', RED, 1]].forEach(([k, c, j]) => {
      if (g[k] == null) return;
      const y = p.sy(g[k]);
      cv.rect(x0 + j * (bw + 2), y, bw, p.sy(0) - y, c, { opacity: 0.9 });
      cv.text(x0 + j * (bw + 2) + bw / 2, y - 4, fmt(g[k], 2).replace(/\.00$/, ''), { size: 10, anchor: 'middle' });
    });
    cv.text(p.box.x + (i + 0.5) * gw, p.sy(0) + 15, g.label, { size: 10.5, anchor: 'middle' });
  });
  const fab = annex.infamyUse + annex.infamyFabrication;
  const two = 2 * Math.max(noCbMin, annex.infamyUse * noCbMult);
  legend(cv, 80, 76, [
    { swatch: true, color: BLUE, label: 'With a pretext (cost on declaring)' },
    { swatch: true, color: RED, opacity: 0.9, label: `Without a pretext (max of ${noCbMin} and ${noCbMult} x base)` },
  ], { gap: 16 });
  cv.text(16, 330, `Annexing with a fabricated pretext costs ${fmt(fab, 1)} in total (${annex.infamyUse} + ${annex.infamyFabrication} to fabricate).`, { size: 11, fill: MUTED });
  cv.text(16, 346, `Two unpretexted annexations reach ${fmt(two, 1)}, past the limit of ${limit}.`, { size: 11, fill: MUTED });
  save('diplomacy-infamy-by-goal-chart.svg', cv, 'Grouped bar chart of infamy added by declaring war for each war goal, with and without a pretext, against the outlaw limit of 18. Irredentist annexation adds 2.93 and unification 3.9. Annexing with a fabricated pretext totals 7.9, and two annexations without pretexts reach 22.8.');
}
{
  const D = 'src/sim/systems/diplomacy.ts';
  const limit = constNum(D, 'INFAMY_LIMIT');
  const decay = grab1(D, /nation\.infamy - ([\d.]+)\)\.toFixed\(2\)/);
  const annex = WAR_GOALS.annex_state;
  const one = annex.infamyUse + annex.infamyFabrication;
  const run = (start) => linspace(0, 60, 60).map((m) => [m, Math.max(0, start - decay * m)]);
  const cv = new Canvas('How infamy fades after annexation wars');
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 556, h: 244 },
    x: [0, 60, 'lin'], y: [0, 26, 'lin'],
    xticks: linspace(0, 60, 5), yticks: [0, 6, 12, 18, 24],
    xlabel: 'Months after the last war', ylabel: 'Infamy', ylabelDx: 40,
  });
  p.hline(limit, `limit ${limit}`, { stroke: RED, anchor: 'start', dy: 15 });
  p.line(run(3 * one), { stroke: RED });
  p.line(run(one), { stroke: BLUE });
  const mZero = Math.ceil(one / decay);
  const mLimit = Math.ceil((3 * one - limit) / decay);
  p.mark(0, one, fmt(one, 1), { dx: 8, dy: 16 });
  p.mark(0, 3 * one, fmt(3 * one, 1), { fill: RED, dx: 8, dy: 4 });
  p.mark(mZero, 0, `zero at month ${mZero}`, { dx: -8, dy: -10, anchor: 'end' });
  p.mark(mLimit, limit, `under the limit at month ${mLimit}`, { fill: RED, dx: 10, dy: -8 });
  legend(cv, 400, 214, [
    { color: BLUE, label: 'One annexation' },
    { color: RED, label: 'Three annexations in a row' },
  ]);
  cv.text(16, 352, `Infamy falls ${decay} a month. Each annexation counts ${fmt(one, 1)} (declaring plus fabricating).`, { size: 11, fill: MUTED });
  save('diplomacy-infamy-decay-chart.svg', cv, 'Line chart of infamy over months: one annexation at 7.9 fades to zero by month 57, while three annexations in a row start at 23.7 and fall back under the limit of 18 at month 41.');
}

// ---------------------------------------------------------------------------
// ai-nations: war declaration thresholds
// ---------------------------------------------------------------------------
{
  const minAdv = BALANCE.ai.warDeclareMinAdvantage;
  const strong = BALANCE.ai.warDeclareStrongAdvantage;
  const C = 'src/sim/systems/crisis.ts';
  const show = constNum(C, 'SHOWDOWN_POWER_RATIO');
  const back = constNum(C, 'AI_BACKDOWN_RATIO');
  const lo = 0;
  const hi = 2;
  const cv = new Canvas('Where the AI acts on bloc power ratio', 640, 330);
  const box = { x: 40, y: 150, w: 560, h: 40 };
  const sx = (v) => box.x + ((v - lo) / (hi - lo)) * box.w;
  cv.rect(box.x, box.y, box.w, box.h, '#f4f4f5', { stroke: '#d4d4d8' });
  cv.rect(sx(minAdv), box.y, sx(strong) - sx(minAdv), box.h, BLUE, { opacity: 0.35 });
  cv.rect(sx(strong), box.y, sx(hi) - sx(strong), box.h, BLUE, { opacity: 0.65 });
  cv.rect(sx(lo), box.y, sx(back) - sx(lo), box.h, RED, { opacity: 0.4 });
  for (let v = 0; v <= 2.001; v += 0.25) {
    cv.line(sx(v), box.y + box.h, sx(v), box.y + box.h + 6, { stroke: INK });
    cv.text(sx(v), box.y + box.h + 20, fmt(v, 2).replace(/\.?0+$/, '') || '0', { size: 11, anchor: 'middle', fill: MUTED });
  }
  cv.text(box.x + box.w / 2, box.y + box.h + 42, 'Stronger bloc power divided by weaker bloc power', { size: 12, anchor: 'middle' });
  const marks = [
    [back, `${back}: an AI crisis lead concedes`, RED, 0],
    [minAdv, `${minAdv}: AI declares for a minor goal`, BLUE, 1],
    [strong, `${strong}: AI declares for annexation`, BLUE, 2],
    [show, `${show}: a congress forms`, INK, 3],
  ];
  marks.forEach(([v, label, c, row]) => {
    const y = box.y - 12 - (marks.length - 1 - row) * 20;
    cv.line(sx(v), y + 4, sx(v), box.y, { stroke: c, width: 1.4 });
    cv.text(sx(v) + 5, y + 2, label, { size: 11, fill: c });
  });
  cv.text(box.x, 280, `The other side of the crisis concedes at the same line seen from the stronger bloc: above ${fmt(1 / back, 2)}.`, { size: 11, fill: MUTED });
  save('ai-nations-thresholds-chart.svg', cv, 'Threshold bar of bloc power ratio from 0 to 2: an AI crisis lead concedes below 0.62, an AI declares war for a minor goal from 1.08, for annexation from 1.25, and a congress forms at 1.45.');
}

// ---------------------------------------------------------------------------
// research
// ---------------------------------------------------------------------------
{
  const R = 'src/sim/systems/research.ts';
  const flat = constNum(R, 'RESEARCH_FLAT_BASE');
  const weight = constNum(R, 'RESEARCH_LITERACY_WEIGHT');
  const gp = constNum(R, 'RESEARCH_GP_BONUS');
  const rateBonus = 0.2; // EXAMPLE: a +20% research rate from technology
  const points = (lit, isGp, rate) => (flat + lit * weight + (isGp ? gp : 0)) * (1 + rate);
  const cv = new Canvas('Research points per month against literacy');
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 556, h: 244 },
    x: [0, 1, 'lin'], y: [0, 12, 'lin'],
    xticks: linspace(0, 1, 5), yticks: [0, 3, 6, 9, 12],
    xlabel: 'National literacy', ylabel: 'Research points per month', fx: pct, ylabelDx: 40,
  });
  const xs = linspace(0, 1, 50);
  const lines = [
    ['Great power, +20% research rate', true, rateBonus, RED, undefined],
    ['Great power, no bonus', true, 0, RED, '7 4'],
    ['Other nation, +20% research rate', false, rateBonus, BLUE, undefined],
    ['Other nation, no bonus', false, 0, BLUE, '7 4'],
  ];
  for (const [, g, r, c, d] of lines) p.line(xs.map((x) => [x, points(x, g, r)]), { stroke: c, dash: d });
  legend(cv, 90, 70, lines.map(([label, , , c, d]) => ({ color: c, dash: d, label })), { gap: 17 });
  p.mark(0, points(0, false, 0), fmt(points(0, false, 0), 1), { dx: 8, dy: 16 });
  p.mark(0, points(0, true, 0), fmt(points(0, true, 0), 1), { fill: RED, dx: 8, dy: 4 });
  cv.text(16, 352, `Points = (${flat} + ${weight} x literacy${' + ' + gp + ' if a great power'}) x (1 + research rate).`, { size: 11, fill: MUTED });
  save('research-points-chart.svg', cv, 'Line chart of research points per month against literacy: four lines for great powers and other nations with and without a 20 percent research-rate bonus, each rising at 4.8 points per unit of literacy from 1.4, or 2.9 for great powers.');
}
{
  const R = 'src/sim/systems/research.ts';
  const flat = constNum(R, 'RESEARCH_FLAT_BASE');
  const weight = constNum(R, 'RESEARCH_LITERACY_WEIGHT');
  const gp = constNum(R, 'RESEARCH_GP_BONUS');
  const techCost = (key) => grab1('src/data/techs.ts', new RegExp(`key: '${key}'[^\\n]*cost: (\\d+)`));
  const techs = ['army_professional_drill', 'army_field_logistics', 'army_staff_corps', 'army_integrated_logistics'].map(techCost);
  const levels = [
    ['Other nation, literacy 0.26', 0.26, false, '#93c5fd'],
    ['Great power, literacy 0.45', 0.45, true, BLUE],
    ['Great power, literacy 0.90', 0.9, true, '#1e3a8a'],
  ];
  const months = (cost, lit, isGp) => Math.ceil(cost / (flat + lit * weight + (isGp ? gp : 0)));
  const cv = new Canvas('Months to research a technology');
  const p = new Plot(cv, {
    box: { x: 62, y: 46, w: 556, h: 244 },
    x: [0, techs.length, 'lin'], y: [0, 180, 'lin'],
    xticks: [], yticks: [0, 30, 60, 90, 120, 150, 180],
    ylabel: 'Months', ylabelDx: 40,
  });
  const gw = p.box.w / techs.length;
  techs.forEach((cost, gi) => {
    const bw = gw / 4.2;
    levels.forEach(([, lit, isGp, color], li) => {
      const m = months(cost, lit, isGp);
      const x = p.box.x + gi * gw + gw * 0.12 + li * bw * 1.1;
      const y = p.sy(m);
      cv.rect(x, y, bw, p.sy(0) - y, color);
      cv.text(x + bw / 2, y - 4, String(m), { size: 11, anchor: 'middle', weight: 600 });
    });
    cv.text(p.box.x + (gi + 0.5) * gw, p.sy(0) + 17, `${cost}-point technology`, { size: 11.5, anchor: 'middle' });
  });
  legend(cv, 80, 64, levels.map(([label, , , color]) => ({ swatch: true, color, label })), { gap: 16 });
  cv.text(16, 352, 'No research-rate bonus. Rounded up to whole months.', { size: 11, fill: MUTED });
  save('research-months-chart.svg', cv, 'Grouped bar chart of months to research technologies costing 24, 34, 125 and 470 points for three nations: a small nation at literacy 0.26 and great powers at literacy 0.45 and 0.90.');
}

console.log(`wrote ${made.length} charts to ${OUT}`);
console.log(made.join('\n'));
