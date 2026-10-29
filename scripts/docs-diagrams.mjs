#!/usr/bin/env node
/**
 * Writes the hand-authored diagram SVGs for the Grand Century docs
 * (docs/images/*-<name>.svg). Diagrams show structure and order, not data, so
 * nothing here is read from the game; the labels are copied from the docs pages.
 * Charts (which do read the game) come from docs-charts.mjs.
 *
 * Regenerate:  node scripts/docs-diagrams.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', 'docs', 'images');
fs.mkdirSync(OUT, { recursive: true });

const BLUE = '#2563eb';
const RED = '#dc2626';
const INK = '#27272a';
const MUTED = '#52525b';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const TINT = { blue: '#eff6ff', red: '#fef2f2', gray: '#f4f4f5', white: '#ffffff' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r1 = (v) => Math.round(v * 10) / 10;

class Svg {
  constructor(title, w = 640, h = 360) {
    Object.assign(this, { title, w, h, parts: [] });
  }
  add(s) {
    this.parts.push(s);
  }
  text(x, y, s, { size = 12, anchor = 'middle', fill = INK, weight = 400, italic = false } = {}) {
    this.add(`<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" text-anchor="${anchor}" fill="${fill}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`);
  }
  /** Wrapped, vertically centred text inside a width. */
  para(cx, cy, label, maxW, o = {}) {
    const size = o.size ?? 12;
    const lines = wrap(label, maxW, size);
    const lh = size + 3;
    const y0 = cy - ((lines.length - 1) * lh) / 2 + size * 0.35;
    lines.forEach((l, i) => this.text(cx, y0 + i * lh, l, { ...o, size }));
    return lines.length;
  }
  box(x, y, w, h, label, { kind = 'blue', size = 12, weight = 400, dashed = false } = {}) {
    const stroke = kind === 'red' ? RED : kind === 'gray' ? '#a1a1aa' : BLUE;
    this.add(`<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="6" fill="${TINT[kind] ?? '#fff'}" stroke="${stroke}" stroke-width="1.5"${dashed ? ' stroke-dasharray="5 4"' : ''}/>`);
    this.para(x + w / 2, y + h / 2, label, w - 10, { size, weight });
  }
  path(pts, { color = MUTED, dashed = false, width = 1.6, arrow = true } = {}) {
    const id = color === RED ? 'ahr' : color === BLUE ? 'ahb' : 'ahg';
    this.add(`<polyline points="${pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"${dashed ? ' stroke-dasharray="5 4"' : ''}${arrow ? ` marker-end="url(#${id})"` : ''}/>`);
  }
  label(x, y, s, { color = INK, size = 11 } = {}) {
    const lines = Array.isArray(s) ? s : [s];
    const w = Math.max(...lines.map((l) => l.length)) * size * 0.54 + 8;
    const h = lines.length * (size + 2) + 4;
    x = Math.max(w / 2 + 6, Math.min(this.w - w / 2 - 6, x));
    this.add(`<rect x="${r1(x - w / 2)}" y="${r1(y - h / 2)}" width="${r1(w)}" height="${r1(h)}" fill="#fff" fill-opacity="0.92" rx="3"/>`);
    lines.forEach((l, i) => this.text(x, y - h / 2 + (size + 2) * (i + 1) - 1, l, { size, fill: color }));
  }
  out(name, desc) {
    const defs = ['ahg:' + MUTED, 'ahb:' + BLUE, 'ahr:' + RED]
      .map((d) => {
        const [id, c] = d.split(':');
        return `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;
      })
      .join('');
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" font-family='${FONT}' role="img" aria-label="${esc(desc)}">`,
      `<title>${esc(desc)}</title><defs>${defs}</defs>`,
      `<rect x="0.5" y="0.5" width="${this.w - 1}" height="${this.h - 1}" fill="#fff" stroke="#d4d4d8"/>`,
      `<text x="16" y="26" font-size="15" font-weight="600" fill="${INK}">${esc(this.title)}</text>`,
      ...this.parts,
      '</svg>',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(OUT, name), svg);
    made.push(name);
  }
}
const made = [];

function wrap(label, maxW, size) {
  const cw = size * 0.56;
  const per = Math.max(4, Math.floor(maxW / cw));
  const out = [];
  for (const part of String(label).split('\n')) {
    let cur = '';
    for (const word of part.split(' ')) {
      if ((cur + ' ' + word).trim().length > per && cur) {
        out.push(cur);
        cur = word;
      } else cur = (cur + ' ' + word).trim();
    }
    out.push(cur);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

/** Lanes of ordered steps (phase-order diagrams). */
function lanes(title, laneDefs, { name, desc, perRow = 5, bw = 100, bh = 40, gap = 12, note, tags = {}, arcs = [], down = [], extraH = 0, laneW = 64 }) {
  const rowGap = 34;
  const left = 16 + laneW;
  let y = 52;
  const placed = {};
  const blocks = [];
  laneDefs.forEach((lane, li) => {
    const rows = Math.ceil(lane.steps.length / perRow);
    const top = y + (lane.headroom ?? 18);
    blocks.push({ top, rows, lane });
    lane.steps.forEach((s, si) => {
      const row = Math.floor(si / perRow);
      const col = si % perRow;
      placed[`${li}:${si}`] = { x: left + col * (bw + gap), y: top + row * (bh + rowGap), row, col };
    });
    y = top + rows * (bh + rowGap) - rowGap + 14;
  });
  const h = y + 14 + (note ? 30 : 0) + extraH;
  const s = new Svg(title, 640, h);
  blocks.forEach(({ top, rows, lane }, li) => {
    const bottom = top + rows * (bh + rowGap) - rowGap;
    s.add(`<rect x="10" y="${top - 12}" width="620" height="${bottom - top + 24}" rx="8" fill="${lane.kind === 'red' ? '#fef2f2' : '#fafafa'}" stroke="#e4e4e7"/>`);
    s.para(16 + laneW / 2 - 4, (top + bottom) / 2, lane.name, laneW - 4, { size: 12, weight: 600 });
    lane.steps.forEach((step, si) => {
      const p = placed[`${li}:${si}`];
      s.box(p.x, p.y, bw, bh, step, { kind: lane.kind ?? 'blue', size: 11.5 });
      const next = placed[`${li}:${si + 1}`];
      if (next) {
        if (next.row === p.row) s.path([[p.x + bw + 1, p.y + bh / 2], [next.x - 1, next.y + bh / 2]]);
        else {
          const my = p.y + bh + rowGap / 2;
          s.path([[p.x + bw / 2, p.y + bh + 1], [p.x + bw / 2, my], [next.x + bw / 2, my], [next.x + bw / 2, next.y - 1]]);
        }
      }
      const tag = tags[`${li}:${si}`];
      if (tag) s.text(p.x + bw - 2, p.y - 5, tag, { size: 10.5, fill: RED, weight: 600, anchor: 'end' });
    });
  });
  // arrows from a lane to the next lane
  down.forEach(({ from, to, label }) => {
    const a = placed[from];
    const b = placed[to];
    const x = a.x + 22;
    const bx = b.x + 22;
    s.path([[x, a.y + bh + 1], [x, a.y + bh + 8], [bx, a.y + bh + 8], [bx, b.y - 1]], { color: BLUE });
    if (label) s.label(Math.max(x, bx) + 80, a.y + bh + 8, label, { color: BLUE, size: 10.5 });
  });
  // labelled arcs for load-bearing pairs
  arcs.forEach(({ from, to, label, color = RED }) => {
    const a = placed[from];
    const b = placed[to];
    const x1 = a.x + bw / 2;
    const x2 = b.x + bw / 2;
    const y1 = a.y - 3;
    const lift = 20;
    if (a.row === b.row) {
      s.add(`<path d="M${r1(x1)},${r1(y1)} Q${r1((x1 + x2) / 2)},${r1(y1 - lift * 1.6)} ${r1(x2)},${r1(b.y - 3)}" fill="none" stroke="${color}" stroke-width="1.6" marker-end="url(#${color === RED ? 'ahr' : 'ahb'})"/>`);
      s.label((x1 + x2) / 2, y1 - lift * 0.9 - 2, label, { color });
    }
  });
  if (note) s.text(16, h - 16, note, { size: 11, anchor: 'start', fill: MUTED });
  s.out(name, desc);
  return placed;
}

/** Driven by / Affects hub. */
function hub(title, centre, ins, outs, { name, desc, note }) {
  const rows = Math.max(ins.length, outs.length);
  const rh = 40;
  const h = 70 + rows * rh + (note ? 34 : 14);
  const s = new Svg(title, 640, h);
  const cx = 320;
  const cy = 62 + (rows * rh) / 2;
  s.text(115, 54, 'Driven by', { size: 12, weight: 600, fill: BLUE });
  s.text(525, 54, 'Affects', { size: 12, weight: 600, fill: RED });
  const col = (list, x, kind) =>
    list.map((label, i) => {
      const y = 66 + (rows * rh - list.length * rh) / 2 + i * rh;
      return { label, x, y, kind };
    });
  const L = col(ins, 20, 'blue');
  const R = col(outs, 440, 'red');
  const bw = 180;
  L.forEach((n) => {
    s.box(n.x, n.y, bw, 30, n.label, { kind: 'blue', size: 11.5 });
    s.path([[n.x + bw + 1, n.y + 15], [cx - 62, cy]], { color: BLUE });
  });
  R.forEach((n) => {
    s.box(n.x, n.y, bw, 30, n.label, { kind: 'red', size: 11.5 });
    s.path([[cx + 62, cy], [n.x - 1, n.y + 15]], { color: RED });
  });
  s.add(`<rect x="${cx - 60}" y="${cy - 22}" width="120" height="44" rx="8" fill="${BLUE}"/>`);
  s.para(cx, cy, centre, 110, { size: 13, weight: 600, fill: '#fff' });
  if (note) s.text(16, h - 14, note, { size: 11, anchor: 'start', fill: MUTED });
  s.out(name, desc);
}

/** Free grid layout with auto-routed edges. */
function graph(title, { w = 640, h = 360, nodes, edges, name, desc, note, cw = 150, rh = 70, ox = 20, oy = 50, nw = 128, nh = 40 }) {
  const s = new Svg(title, w, h);
  const N = {};
  nodes.forEach((n) => {
    const width = n.w ?? nw;
    const height = n.h ?? nh;
    N[n.id] = { ...n, x: ox + n.c * cw, y: oy + n.r * rh, w: width, h: height };
  });
  const side = (n, d) => ({ r: [n.x + n.w, n.y + n.h / 2], l: [n.x, n.y + n.h / 2], t: [n.x + n.w / 2, n.y], b: [n.x + n.w / 2, n.y + n.h] })[d];
  edges.forEach((e) => {
    const a = N[e.from];
    const b = N[e.to];
    const color = e.color === 'red' ? RED : e.color === 'gray' ? MUTED : BLUE;
    let from = e.fromSide;
    let to = e.toSide;
    if (!from) {
      if (Math.abs(a.y - b.y) < 2) from = b.x > a.x ? 'r' : 'l';
      else if (Math.abs(a.x - b.x) < 2) from = b.y > a.y ? 'b' : 't';
      else from = b.y > a.y ? 'b' : 't';
    }
    if (!to) to = { r: 'l', l: 'r', b: 't', t: 'b' }[from];
    let p1 = side(a, from);
    let p2 = side(b, to);
    if (e.off) {
      const horiz = from === 'r' || from === 'l';
      if (horiz) { p1 = [p1[0], p1[1] + e.off]; p2 = [p2[0], p2[1] + e.off]; } else { p1 = [p1[0] + e.off, p1[1]]; p2 = [p2[0] + e.off, p2[1]]; }
    }
    let pts;
    if (e.via) pts = [p1, ...e.via, p2];
    else if (e.straight || p1[0] === p2[0] || p1[1] === p2[1]) pts = [p1, p2];
    else if (from === 'b' || from === 't') pts = [p1, [p1[0], p2[1]], p2];
    else pts = [p1, [p2[0], p1[1]], p2];
    // nudge arrow tips off the box edge
    s.path(pts, { color, dashed: e.dashed });
    if (e.label) {
      const lp = e.labelAt ?? [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
      s.label(lp[0], lp[1], e.label, { color: e.color === 'red' ? RED : INK, size: 10.5 });
    }
  });
  Object.values(N).forEach((n) => s.box(n.x, n.y, n.w, n.h, n.label, { kind: n.kind ?? 'blue', size: n.size ?? 11.5, dashed: n.dashed, weight: n.weight ?? 400 }));
  if (note) s.text(16, h - 14, note, { size: 11, anchor: 'start', fill: MUTED });
  s.out(name, desc);
  return N;
}

// ===========================================================================
// time-and-the-tick
// ===========================================================================
{
  const s = new Svg('Which things happen on which day', 640, 350);
  s.text(16, 50, 'One month', { size: 12, weight: 600, anchor: 'start' });
  const x0 = 40;
  const x1 = 604;
  const dx = (x1 - x0) / 32;
  const X = (d) => x0 + (d - 0.5) * dx;
  const y0 = 132;
  for (let d = 1; d <= 31; d++) {
    const weekly = d % 7 === 0;
    s.add(`<line x1="${r1(X(d))}" y1="${y0}" x2="${r1(X(d))}" y2="${y0 + (weekly ? 34 : 14)}" stroke="${weekly ? BLUE : '#a1a1aa'}" stroke-width="${weekly ? 3 : 1.2}"/>`);
    if (d === 1 || weekly || d === 31) s.text(X(d), y0 + 50, String(d), { size: 11, fill: MUTED });
  }
  s.add(`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#a1a1aa"/>`);
  s.add(`<line x1="${r1(X(32))}" y1="${y0}" x2="${r1(X(32))}" y2="${y0 + 34}" stroke="${RED}" stroke-width="3"/>`);
  s.text(X(32), y0 + 50, '1st', { size: 11, fill: RED });
  s.add(`<line x1="${r1(X(1))}" y1="${y0}" x2="${r1(X(1))}" y2="${y0 + 34}" stroke="${RED}" stroke-width="3"/>`);
  s.box(20, 58, 270, 48, 'Day 1, monthly: budget, population, culture, politics, research, diplomacy, crises, events, AI', { kind: 'red', size: 10.5 });
  s.path([[X(1) + 4, 107], [X(1) + 2, y0 - 6]], { color: RED });
  s.box(360, 58, 244, 34, 'Every 7th day, weekly: economy', { kind: 'blue', size: 11 });
  s.path([[X(21), 93], [X(21), y0 - 2]], { color: BLUE });
  s.path([[X(19), y0 + 74], [X(32) - 4, y0 + 74]], { color: MUTED, dashed: true });
  s.text(X(19), y0 + 70, 'tax slider changed here', { size: 11, anchor: 'start', fill: INK });
  s.text(X(32) + 4, y0 + 92, 'applies on the next 1st', { size: 11, anchor: 'end', fill: RED });
  s.text(16, 254, 'One year', { size: 12, weight: 600, anchor: 'start' });
  const yy = 292;
  const YX = (d) => 40 + (d / 365) * 564;
  s.add(`<line x1="40" y1="${yy}" x2="604" y2="${yy}" stroke="#a1a1aa"/>`);
  for (let d = 7; d <= 364; d += 7) s.add(`<line x1="${r1(YX(d))}" y1="${yy}" x2="${r1(YX(d))}" y2="${yy + 7}" stroke="${BLUE}" stroke-width="1" opacity="0.5"/>`);
  const mdays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let acc = 0;
  const mn = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  mdays.forEach((m, i) => {
    s.add(`<line x1="${r1(YX(acc))}" y1="${yy - 9}" x2="${r1(YX(acc))}" y2="${yy + 12}" stroke="${RED}" stroke-width="2"/>`);
    s.text(YX(acc + m / 2), yy + 28, mn[i], { size: 10.5, fill: MUTED });
    acc += m;
  });
  s.add(`<line x1="604" y1="${yy - 16}" x2="604" y2="${yy + 14}" stroke="${INK}" stroke-width="3"/>`);
  s.box(360, 226, 244, 34, 'Day 365, yearly: chronicle and autosave', { kind: 'gray', size: 11 });
  s.path([[560, 261], [603, yy - 18]], { color: MUTED });
  s.text(16, 338, 'Short blue ticks are weekly (every 7th day). Red ticks are the 1st of each month.', { size: 11, anchor: 'start', fill: MUTED });
  s.out('time-and-the-tick-calendar.svg', 'Calendar strips. In a month, a heavy tick every 7th day marks the weekly economy pass and day 1 marks the monthly pass; a tax slider change applies on the next 1st. In a year, day 365 marks the chronicle and autosave.');
}

const LANES = (monthlyTags = {}) => [
  { name: 'Daily', steps: ['Market housekeeping', 'War'] },
  { name: 'Weekly', steps: ['Begin week', 'Production', 'Pops shop', 'Standing orders', 'Settle producers', 'Price move'] },
  { name: 'Monthly', steps: ['Budget', 'Population', 'Culture', 'Politics', 'Research', 'Diplomacy', 'Crises', 'Events', 'AI'] },
  { name: 'Yearly', steps: ['Chronicle and autosave'], kind: 'gray' },
];
lanes('One advanceDay call, in order', LANES(), {
  name: 'time-and-the-tick-phase-order.svg',
  desc: 'Phase order of one day: daily steps (market housekeeping, war), then weekly (begin week, production, pops shop, standing orders, settle producers, price move), then monthly (budget, population, culture, politics, research, diplomacy, crises, events, AI), then yearly (chronicle and autosave).',
  down: [{ from: '0:1', to: '1:0', label: 'then, on every 7th day' }, { from: '1:5', to: '2:0', label: 'then, on the 1st' }, { from: '2:8', to: '3:0', label: 'then, on day 365' }],
  extraH: 0,
  note: 'Every step that applies on a given day runs in this order, top to bottom.',
});

// ===========================================================================
// population
// ===========================================================================
{
  const s = new Svg('How pops change class each month', 640, 560);
  const X = 236;
  const W = 150;
  const ys = [60, 196, 332, 468];
  const names = ['Farmer or laborer', 'Craftsman', 'Clerk', 'Capitalist'];
  names.forEach((n, i) => s.box(X, ys[i], W, 38, n, { kind: i === 3 ? 'gray' : 'blue', size: 12.5, weight: 600 }));
  const gaps = [
    { up: ['2.5% a month', 'needs above 35%, literacy above 12%,', 'more than 8 free factory jobs'], down: ['back: 1% if farms pay 1.3 times', 'more; 0.4% if needs under 8%'] },
    { up: ['1% a month', 'needs above 50%, literacy above 20%,', 'more than 8 free clerk jobs'], down: ['back: 0.6% if needs under 12%', 'or fewer than 2 free clerk jobs'] },
    { up: ['0.2% a month', 'needs above 60%, and a factory', 'in the state with a profit'], down: [] },
  ];
  gaps.forEach((g, i) => {
    const y1 = ys[i] + 38;
    const y2 = ys[i + 1];
    s.path([[X + 40, y1 + 1], [X + 40, y2 - 1]], { color: BLUE });
    if (g.down.length) s.path([[X + W - 40, y2 - 1], [X + W - 40, y1 + 1]], { color: RED, dashed: true });
    g.up.forEach((l, k) => s.text(X + 30, y1 + 22 + k * 14, l, { size: k === 0 ? 11.5 : 10.5, anchor: 'end', weight: k === 0 ? 600 : 400, fill: BLUE }));
    g.down.forEach((l, k) => s.text(X + W - 30, y1 + 28 + k * 14, l, { size: 10.5, anchor: 'start', fill: RED }));
  });
  s.box(496, 400, 120, 38, 'Soldier', { kind: 'gray', size: 12.5, weight: 600 });
  s.path([[X + W + 1, ys[0] + 19], [556, ys[0] + 19], [555, 398]], { color: BLUE });
  s.text(X + W + 10, ys[0] + 12, 'drafted from farmers, laborers', { size: 10.5, anchor: 'start', fill: BLUE });
  s.text(X + W + 10, ys[0] + 38, 'and craftsmen', { size: 10.5, anchor: 'start', fill: BLUE });
  ['Up to 0.8% a month while', 'the nation is short of soldiers,', 'needs above 45%'].forEach((l, k) => s.text(556, 456 + k * 14, l, { size: 10.5, fill: BLUE }));
  ['Back to laborer: 1% a month', 'if needs are under 35%'].forEach((l, k) => s.text(556, 506 + k * 14, l, { size: 10.5, fill: RED }));
  s.text(16, 544, 'Promotion out of farming also needs factory pay to beat farm pay by 1.05 times.', { size: 11, anchor: 'start', fill: MUTED });
  s.out('population-class-flow.svg', 'Class change flow. Farmers and laborers become craftsmen, craftsmen become clerks, and clerks become capitalists, each at a monthly rate with gates on needs met, literacy and free jobs. Craftsmen can fall back to laborers and clerks to craftsmen. Farmers, laborers and craftsmen can be drafted into soldiers, who return to laborer when needs are low.');
}
hub('Population: connections', 'Population',
  ['Production', 'The world market', 'Budget and taxation', 'Politics and reform', 'Research', 'Culture and nationalism', 'War'],
  ['Production', 'The world market', 'Budget and taxation', 'Politics and reform', 'Culture and nationalism', 'War'],
  { name: 'population-connections.svg', desc: 'Population in the centre. Production, market, budget, politics, research, culture and war feed in. Production, market, budget, politics, culture and war receive its effects.' });

// ===========================================================================
// production-and-industry
// ===========================================================================
graph('One week in a factory', {
  h: 430, name: 'production-and-industry-factory-week.svg',
  desc: 'Factory week flow: buy inputs, produce limited by inputs and workers, register supply, the market clears, settle by the fraction sold, pay wages (45 percent), take operating cost, owners get 55 percent of net, the rest goes to the plant cash reserve. Side branches: expand after 26 profitable weeks, shrink after 6 loss weeks, close after 10 loss weeks at level 1.',
  nodes: [
    { id: 'buy', c: 0, r: 0, label: 'Buy inputs', h: 56 },
    { id: 'prod', c: 1, r: 0, label: 'Produce, limited by inputs and workers', h: 56 },
    { id: 'sup', c: 2, r: 0, label: 'Register supply' },
    { id: 'mk', c: 3, r: 0, label: 'Market clears' },
    { id: 'set', c: 3, r: 1, label: 'Settle by the fraction sold', h: 56 },
    { id: 'wage', c: 2, r: 1, label: 'Pay wages 45%' },
    { id: 'op', c: 1, r: 1, label: 'Operating cost' },
    { id: 'own', c: 0, r: 1, label: 'Owners 55% of net' },
    { id: 'plant', c: 0, r: 2, label: 'Profit to cash reserve', weight: 600 },
    { id: 'ex', c: 2, r: 2.35, w: 150, label: 'Expand: 26 profitable weeks in a row', kind: 'gray', h: 48 },
    { id: 'sh', c: 2, r: 3.15, w: 150, label: 'Shrink: 6 loss weeks in a row', kind: 'gray', h: 48 },
    { id: 'cl', c: 2, r: 3.95, w: 150, label: 'Close: 10 loss weeks at level 1', kind: 'red', h: 48 },
  ],
  cw: 152, rh: 66, ox: 20, oy: 54, nw: 112,
  edges: [
    { from: 'buy', to: 'prod' }, { from: 'prod', to: 'sup' }, { from: 'sup', to: 'mk' }, { from: 'mk', to: 'set', fromSide: 'b', toSide: 't' },
    { from: 'set', to: 'wage' }, { from: 'wage', to: 'op' }, { from: 'op', to: 'own' }, { from: 'own', to: 'plant', fromSide: 'b', toSide: 't' },
    { from: 'plant', to: 'ex', fromSide: 'r', toSide: 'l', straight: true, color: 'gray' },
    { from: 'plant', to: 'sh', fromSide: 'r', toSide: 'l', straight: true, color: 'gray' },
    { from: 'plant', to: 'cl', fromSide: 'r', toSide: 'l', straight: true, color: 'red' },
  ],
  note: 'The weekly result decides whether the plant grows, shrinks or closes.',
});
hub('Production: connections', 'Production',
  ['Population', 'The world market', 'Research', 'Budget and taxation', 'AI nations'],
  ['The world market', 'Population', 'Budget and taxation', 'Diplomacy'],
  { name: 'production-and-industry-connections.svg', desc: 'Production in the centre. Population, market, research, budget and AI feed in. Market, population, budget and diplomacy receive its effects.' });

// ===========================================================================
// the-world-market
// ===========================================================================
lanes('The weekly price step', [
  { name: 'Each good', steps: ['1. Effective demand and supply', '2. Pressure: log of the ratio, clamped', '3. Damping: price x exp(pressure x 0.09)', '4. Base reversion: 6% pull to base price', '5. Bounds: 0.35x to 6x base', '6. Smoothing: move 32% of the gap'], },
  { name: 'Result', steps: ['7. New price'], kind: 'gray' },
], {
  name: 'the-world-market-price-pipeline.svg',
  desc: 'Seven-step weekly price pipeline: effective demand and supply, pressure, damping, base reversion, bounds, smoothing, then the new price.',
  down: [{ from: '0:5', to: '1:0' }], note: 'Runs once a week for every good, after buyers and settlement.',
});

// ===========================================================================
// budget-and-taxation
// ===========================================================================
graph('Where the monthly budget comes from and goes', {
  h: 420, name: 'budget-and-taxation-flow.svg',
  desc: 'Money flow. Tax from the poor, middle and rich brackets, tariffs and production income flow into the treasury. Army and navy upkeep, provincial overhead, administration, reform upkeep and factory subsidies flow out. Bankruptcy cuts each outflow: army 45 percent, administration 60 percent, reforms 55 percent, subsidies 30 percent, overhead zero.',
  nodes: [
    { id: 'tp', c: 0, r: 0, label: 'Tax: poor', w: 120, nh: 32 },
    { id: 'tm', c: 0, r: 0.95, label: 'Tax: middle', w: 120 },
    { id: 'tr', c: 0, r: 1.9, label: 'Tax: rich', w: 120 },
    { id: 'tar', c: 0, r: 2.85, label: 'Tariffs', w: 120 },
    { id: 'pi', c: 0, r: 3.8, label: 'Production income', w: 120 },
    { id: 'tre', c: 1.4, r: 1.9, label: 'Treasury, settled on the 1st', w: 130, h: 70, weight: 600 },
    { id: 'o1', c: 3.0, r: 0, label: 'Army and navy upkeep (x0.45 if bankrupt)', w: 170, h: 38 },
    { id: 'o2', c: 3.0, r: 0.95, label: 'Provincial overhead (zero if bankrupt)', w: 170, h: 38 },
    { id: 'o3', c: 3.0, r: 1.9, label: 'Administration (x0.6 if bankrupt)', w: 170, h: 38 },
    { id: 'o4', c: 3.0, r: 2.85, label: 'Reform upkeep (x0.55 if bankrupt)', w: 170, h: 38 },
    { id: 'o5', c: 3.0, r: 3.8, label: 'Factory subsidies (x0.3 if bankrupt)', w: 170, h: 38 },
  ].map((n) => ({ ...n, h: n.h ?? 32 })),
  cw: 150, rh: 70, oy: 52, ox: 14,
  edges: [
    ...['tp', 'tm', 'tr', 'tar', 'pi'].map((id) => ({ from: id, to: 'tre', fromSide: 'r', toSide: 'l', straight: true })),
    ...['o1', 'o2', 'o3', 'o4', 'o5'].map((id) => ({ from: 'tre', to: id, fromSide: 'r', toSide: 'l', straight: true, color: 'red' })),
  ],
  note: 'Income on the left, bills on the right. A bankrupt nation pays the reduced bills shown.',
});
hub('Budget: connections', 'Budget',
  ['Population', 'Production', 'The world market', 'War', 'Politics and reform', 'Research', 'Diplomacy', 'Events', 'AI nations'],
  ['Population', 'Production', 'Politics and reform', 'Events', 'Diplomacy', 'AI nations'],
  { name: 'budget-and-taxation-connections.svg', desc: 'Budget in the centre. Population, production, market, war, politics, research, diplomacy, events and AI feed in. Population, production, politics, events, diplomacy and AI receive its effects.' });

// ===========================================================================
// engineering/architecture
// ===========================================================================
{
  const s = new Svg('The UI and simulation boundary', 640, 380);
  s.box(20, 64, 160, 96, 'UI thread\nReact, Zustand store\nsrc/ui, src/map\n(read-only snapshot)', { kind: 'blue', size: 11.5 });
  s.box(240, 64, 160, 96, 'Message protocol\nToWorker\nFromWorker', { kind: 'gray', size: 11.5 });
  s.box(460, 64, 160, 96, 'Worker\nsrc/worker/sim.worker.ts\nwraps src/sim\n(World, systems)', { kind: 'red', size: 11.5 });
  // arrows
  s.path([[182, 80], [238, 80]], { color: BLUE });
  s.label(210, 72, 'Command', { color: BLUE });
  s.path([[458, 100], [402, 100]], { color: RED });
  s.label(430, 92, 'Snapshot', { color: RED });
  s.path([[182, 124], [238, 124]], { color: BLUE });
  s.label(210, 144, ['requestProvince', 'requestNation'], { color: BLUE, size: 10 });
  s.path([[458, 130], [402, 130]], { color: RED });
  s.label(430, 150, ['provinceDetail', 'nationDetail'], { color: RED, size: 10 });
  s.path([[402, 80], [458, 80]], { color: BLUE });
  s.path([[402, 124], [458, 124]], { color: BLUE });
  // server
  s.box(380, 250, 240, 64, 'Node multiplayer server (server/)\nimports the same src/sim', { kind: 'gray', size: 11.5, dashed: true });
  s.path([[540, 248], [540, 162]], { color: MUTED, dashed: true });
  s.text(16, 210, 'Solid arrows are messages across the worker boundary.', { size: 11, anchor: 'start', fill: MUTED });
  s.text(16, 228, 'The UI never touches the World directly; it reads snapshots.', { size: 11, anchor: 'start', fill: MUTED });
  s.text(16, 346, 'Dashed: the multiplayer server runs the same simulation code, outside the browser.', { size: 11, anchor: 'start', fill: MUTED });
  s.out('architecture-boundary.svg', 'Three boxes: the UI thread with React, Zustand store, src/ui and src/map; the message protocol ToWorker and FromWorker; and the worker sim.worker.ts wrapping src/sim. Commands go down, world snapshots come up, and province and nation detail requests go down with detail replies up. A dashed link shows the Node multiplayer server reusing src/sim.');
}

// ===========================================================================
// engineering/simulation-loop
// ===========================================================================
lanes('Full order of one advanceDay call', LANES(), {
  name: 'simulation-loop-full-order.svg',
  desc: 'Timeline of one advanceDay call with daily, weekly, monthly and yearly lanes in function order. Labelled arrows mark the load-bearing pairs: culture before politics, settlement after buyers, price move last in the week, budget first and AI last in the month.',
  perRow: 5,
  tags: { '2:0': 'budget first', '2:8': 'AI last', '1:5': 'market weekly last' },
  arcs: [
    { from: '2:2', to: '2:3', label: 'culture before politics' },
    { from: '1:3', to: '1:4', label: 'settle after buyers' },
  ].map((a) => a),
  down: [{ from: '0:1', to: '1:0' }, { from: '1:5', to: '2:0' }, { from: '2:8', to: '3:0' }],
  extraH: 20,
  note: 'Within a lane, a step may read what the one before it just wrote. Reordering is a behaviour change.',
});

// ===========================================================================
// engineering/snapshots-and-protocol
// ===========================================================================
{
  const s = new Svg('How a snapshot reaches the screen', 640, 520);
  const lx = [70, 200, 330, 470, 590];
  const heads = ['UI', 'Worker', 'Store', ''];
  s.text(16, 50, 'In the browser', { size: 12, weight: 600, anchor: 'start' });
  const px = { ui: 80, wk: 270, st: 460 };
  [['UI', px.ui], ['Worker', px.wk], ['Store and panels', px.st]].forEach(([n, x]) => {
    s.box(x - 70, 58, 140, 28, n, { kind: 'blue', size: 12 });
    s.add(`<line x1="${x}" y1="86" x2="${x}" y2="270" stroke="#a1a1aa" stroke-dasharray="4 4"/>`);
  });
  void lx; void heads;
  const msg = (x1, x2, y, label, color = BLUE, dashed = false) => {
    s.path([[x1, y], [x2, y]], { color, dashed });
    s.text((x1 + x2) / 2, y - 6, label, { size: 11, fill: color === RED ? RED : INK });
  };
  msg(px.ui, px.wk, 106, 'command', BLUE);
  s.text(px.wk + 8, 124, 'applies it, marks a snapshot pending', { size: 10.5, anchor: 'start', fill: MUTED });
  msg(px.wk, px.st, 144, 'snapshot posted at once', RED);
  s.text(px.wk + 8, 168, 'running clock: days advance, snapshot pending', { size: 10.5, anchor: 'start', fill: MUTED });
  msg(px.wk, px.st, 188, 'posted at most 8 times a second', RED);
  msg(px.ui, px.wk, 216, 'requestProvince or requestNation', BLUE);
  msg(px.wk, px.ui, 242, 'detail reply', RED);
  s.text(16, 288, 'Paused or unchanged: nothing is posted.', { size: 11, anchor: 'start', fill: MUTED });
  s.text(16, 318, 'Multiplayer', { size: 12, weight: 600, anchor: 'start' });
  const mx = [{ n: 'Server', x: 80 }, { n: 'Codec', x: 270 }, { n: 'Client', x: 460 }];
  mx.forEach(({ n, x }) => {
    s.box(x - 70, 326, 140, 28, n, { kind: 'gray', size: 12 });
    s.add(`<line x1="${x}" y1="354" x2="${x}" y2="490" stroke="#a1a1aa" stroke-dasharray="4 4"/>`);
  });
  msg(80, 270, 382, 'builds the snapshot', MUTED);
  s.text(278, 404, 'splits shared state from the player view', { size: 10.5, anchor: 'start', fill: MUTED });
  msg(270, 460, 430, 'gzip diff', MUTED);
  s.text(468, 452, 'applies the diff', { size: 10.5, anchor: 'start', fill: MUTED });
  s.out('snapshots-and-protocol-cadence.svg', 'Sequence diagram. A UI command is applied by the worker and a snapshot is posted at once. While the clock runs, a pending snapshot is posted at most 8 times a second. A detail request returns a detail reply. In multiplayer the server builds a snapshot, the codec splits shared and player view, a gzip diff goes to the client, which applies it.');
}

// ===========================================================================
// politics-and-reform
// ===========================================================================
graph('The reform and unrest loop', {
  h: 420, name: 'politics-and-reform-unrest-loop.svg',
  desc: 'Loop diagram. Pop needs, militancy, consciousness and ideology produce a reform demand. The demand is either enacted or refused. A refused demand raises militancy, which raises state unrest risk. After 6 hot months a rebellion spawns with that demand. Suppression, set by franchise, press rights and government, adds militancy, and literacy feeds research and consciousness.',
  nodes: [
    { id: 'lit', c: 0, r: 0, label: 'Literacy (feeds consciousness and research)', kind: 'gray', h: 64 },
    { id: 'in', c: 1, r: 0, label: 'Pop needs, militancy, consciousness, ideology', h: 76 },
    { id: 'dem', c: 2, r: 0, label: 'Reform demand', h: 76 },
    { id: 'en', c: 3, r: 0, label: 'Enacted if the upper house passes it', kind: 'gray', h: 76 },
    { id: 'sup', c: 0, r: 1.5, label: 'Suppression: franchise, press rights, government', kind: 'gray', h: 76 },
    { id: 'mil', c: 1, r: 1.5, label: 'Militancy rises', kind: 'red', h: 50 },
    { id: 'ref', c: 2, r: 1.5, label: 'Demand refused', kind: 'red', h: 50 },
    { id: 'unr', c: 1, r: 2.7, label: 'State unrest risk', kind: 'red', h: 50 },
    { id: 'reb', c: 2, r: 2.7, label: 'After 6 hot months: rebellion with the demand', kind: 'red', h: 76 },
  ],
  cw: 156, rh: 74, ox: 10, oy: 54, nw: 130,
  edges: [
    { from: 'lit', to: 'in' },
    { from: 'in', to: 'dem' }, { from: 'dem', to: 'en' },
    { from: 'dem', to: 'ref', fromSide: 'b', toSide: 't', color: 'red', label: 'blocked' },
    { from: 'ref', to: 'mil', color: 'red' }, { from: 'sup', to: 'mil', color: 'gray' },
    { from: 'mil', to: 'unr', fromSide: 'b', toSide: 't', color: 'red' }, { from: 'unr', to: 'reb', color: 'red' },
    { from: 'mil', to: 'in', fromSide: 't', toSide: 'b', color: 'red', dashed: true },
  ],
  note: 'A refused demand raises militancy, which raises the next demand.',
});
lanes('Monthly politics pass order', [
  { name: 'Politics, monthly', steps: ['Reform fatigue decay', 'Election', 'Upper house drift', 'Suppression and demand effects', 'Literacy', 'Unrest recompute', 'Rebellion spawn'] },
], { name: 'politics-and-reform-monthly-order.svg', desc: 'Monthly politics pass order: fatigue decay, election, upper house drift, suppression and demand effects, literacy, unrest recompute, then rebellion spawn.', note: 'Runs once on the 1st, after culture and before research.' });

// ===========================================================================
// culture-and-nationalism
// ===========================================================================
graph('From culture policy to uprising', {
  h: 410, name: 'culture-and-nationalism-movement-flow.svg',
  desc: 'Flow. Culture policy drives militancy and consciousness. A movement forms when the culture is 4 percent of the population with consciousness 2.5 and a heartland state. Radicalism rises, and at 85 radicalism and 4.2 militancy an uprising starts a rebellion, followed by a 6 year cooldown. Accepting a culture cuts radicalism by 40 and stops assimilation. Assimilation moves pops to the primary culture, and radicalism slows it.',
  nodes: [
    { id: 'pol', c: 0, r: 0, label: 'Culture policy', w: 120 },
    { id: 'mc', c: 1, r: 0, label: 'Militancy and consciousness', w: 124, h: 56 },
    { id: 'mov', c: 2, r: 0, label: 'Movement forms: 4% of population, consciousness 2.5, heartland state', w: 140, h: 84 },
    { id: 'asm', c: 1, r: 1.5, label: 'Assimilation to the primary culture', w: 124, h: 56, kind: 'gray' },
    { id: 'rad', c: 2, r: 1.5, label: 'Radicalism', w: 140 },
    { id: 'acc', c: 3, r: 1.5, label: 'Accept the culture: radicalism -40, assimilation stops', w: 124, h: 84, kind: 'gray' },
    { id: 'gate', c: 2, r: 2.9, label: 'Uprising gates: radicalism 85 and militancy 4.2', w: 140, h: 68, kind: 'red' },
    { id: 'reb', c: 1, r: 2.9, label: 'Rebellion', w: 124, kind: 'red' },
    { id: 'cd', c: 0, r: 2.9, label: '6 year cooldown', w: 120, kind: 'gray' },
  ],
  cw: 160, rh: 62, ox: 10, oy: 54,
  edges: [
    { from: 'pol', to: 'mc' }, { from: 'mc', to: 'mov' }, { from: 'mov', to: 'rad', fromSide: 'b', toSide: 't' },
    { from: 'rad', to: 'gate', fromSide: 'b', toSide: 't' }, { from: 'gate', to: 'reb', color: 'red' }, { from: 'reb', to: 'cd', color: 'red' },
    { from: 'acc', to: 'rad', color: 'gray' },
    { from: 'rad', to: 'asm', color: 'gray', dashed: true },
  ],
  note: 'Assimilation moves pops to the primary culture; high radicalism slows it.',
});

// ===========================================================================
// crises
// ===========================================================================
graph('The life of a crisis', {
  h: 490, name: 'crises-lifecycle.svg',
  desc: 'Crisis lifecycle. Tension of at least 35 gives a spawn roll of 5 to 50 percent. A flashpoint appears (sphere contest, containment or humiliation). Blocs join at score 45. Temperature rises (press 18, join 6). At showdown, at 100 or the deadline, a power ratio of 1.45 or more gives a congress, under 1.45 gives a war, and a lost lead fizzles. An AI lead can back down early at ratio 0.62 and temperature 50 to 99.',
  nodes: [
    { id: 'ten', c: 0, r: 0, label: 'Tension at 35 or more', w: 130, h: 56 },
    { id: 'roll', c: 1, r: 0, label: 'Spawn roll, 5% to 50%', w: 130, h: 56 },
    { id: 'fp', c: 2, r: 0, label: 'Flashpoint: sphere contest, containment or humiliation', w: 150, h: 72 },
    { id: 'join', c: 2, r: 1.4, label: 'Blocs join at score 45', w: 150, h: 56 },
    { id: 'temp', c: 1, r: 1.4, label: 'Temperature rises: press +18, join +6', w: 130, h: 72 },
    { id: 'bd', c: 0, r: 1.4, label: 'AI lead backs down early: ratio 0.62, temperature 50 to 99', w: 130, h: 84, kind: 'gray' },
    { id: 'show', c: 1, r: 2.8, label: 'Showdown at temperature 100 or the deadline', w: 130, h: 72 },
    { id: 'cong', c: 0, r: 2.8, label: 'Ratio 1.45 or more: congress', w: 130, h: 72, kind: 'gray' },
    { id: 'fiz', c: 2, r: 2.8, label: 'A lead is lost: fizzle', w: 130, h: 72, kind: 'gray' },
    { id: 'war', c: 1, r: 4.1, label: 'Ratio under 1.45: war', w: 130, h: 56, kind: 'red' },
  ],
  cw: 200, rh: 84, ox: 20, oy: 54,
  edges: [
    { from: 'ten', to: 'roll' }, { from: 'roll', to: 'fp' }, { from: 'fp', to: 'join', fromSide: 'b', toSide: 't' }, { from: 'join', to: 'temp' },
    { from: 'temp', to: 'bd', color: 'gray', dashed: true }, { from: 'temp', to: 'show', fromSide: 'b', toSide: 't' },
    { from: 'show', to: 'cong', color: 'gray' }, { from: 'show', to: 'fiz', color: 'gray', dashed: true }, { from: 'show', to: 'war', fromSide: 'b', toSide: 't', color: 'red' },
  ],
  note: 'Backing a side changes the ratio, so check the forecast again after you join.',
});

// ===========================================================================
// events-and-decisions
// ===========================================================================
{
  // number line drawn by hand (replaces the empty graph above)
  const s = new Svg('Balance of power: share of core states held', 640, 340);
  const x0 = 40;
  const w = 560;
  const X = (p) => x0 + (p / 100) * w;
  const y = 130;
  s.add(`<rect x="${X(0)}" y="${y}" width="${X(50) - X(0)}" height="30" fill="#f4f4f5" stroke="#a1a1aa"/>`);
  s.add(`<rect x="${X(50)}" y="${y}" width="${X(80) - X(50)}" height="30" fill="#fef3c7" stroke="#a1a1aa"/>`);
  s.add(`<rect x="${X(80)}" y="${y}" width="${X(100) - X(80)}" height="30" fill="#fecaca" stroke="#a1a1aa"/>`);
  s.text((X(0) + X(50)) / 2, y + 20, 'No reaction', { size: 12 });
  s.text((X(50) + X(80)) / 2, y + 20, 'Alarm', { size: 12, weight: 600 });
  s.text((X(80) + X(100)) / 2, y + 20, 'Rivalry', { size: 12, weight: 600, fill: RED });
  [0, 25, 50, 75, 100].forEach((p) => {
    s.add(`<line x1="${X(p)}" y1="${y + 30}" x2="${X(p)}" y2="${y + 36}" stroke="${INK}"/>`);
    s.text(X(p), y + 50, `${p}%`, { size: 11, fill: MUTED });
  });
  s.text(X(50) - 6, 100, 'Alarm at 50%: opinion -1.5 a month', { size: 11.5, anchor: 'end' });
  s.path([[X(50), 106], [X(50), y - 2]], { color: MUTED });
  s.text(X(100), 76, 'Rivalry at 80%: -3 a month,', { size: 11.5, anchor: 'end', fill: RED });
  s.text(X(100), 90, 'neutral becomes rivalry', { size: 11.5, anchor: 'end', fill: RED });
  s.path([[X(80), 96], [X(80), y - 2]], { color: RED });
  s.text(40, 52, 'Share of the nation’s core states that you hold', { size: 12, anchor: 'start', fill: MUTED });
  s.box(30, 214, 280, 52, 'Per nation: the alarm moves to the seed share plus 10 points (cap 90%), rivalry to plus 20 points (cap 95%).', { kind: 'gray', size: 11 });
  s.box(330, 214, 280, 52, 'Unification war goal: infamy is 60% of normal.', { kind: 'blue', size: 11 });
  s.text(16, 308, 'The thresholds are never lower than 50% and 80%.', { size: 11, anchor: 'start', fill: MUTED });
  s.out('events-and-decisions-balance-of-power.svg', 'Number line of core-state share from 0 to 100 percent. An alarm starts at 50 percent and costs 1.5 opinion a month. Rivalry starts at 80 percent and costs 3 a month, turning neutral relations into rivalry. For each nation the thresholds shift to its seed share plus 10 and plus 20 points, capped at 90 and 95 percent. A unification war goal costs 60 percent of normal infamy.');
}
graph('How an event happens', {
  h: 360, name: 'events-and-decisions-event-flow.svg',
  desc: 'Event flow. A monthly check per nation bucket finds eligible events that pass their trigger and cooldown. A fire chance decides whether one fires, which is picked by weight. For a player the event becomes pending and pauses the game. For an AI it picks a choice automatically. Then the effects are applied.',
  nodes: [
    { id: 'chk', c: 0, r: 0, label: 'Monthly check (nation bucket)', w: 140, h: 48 },
    { id: 'el', c: 1, r: 0, label: 'Eligible events: trigger and cooldown', w: 150, h: 48 },
    { id: 'fc', c: 2, r: 0, label: 'Fire chance', w: 130, h: 48 },
    { id: 'pick', c: 2, r: 1.15, label: 'Pick one by weight', w: 130, h: 48 },
    { id: 'pl', c: 1, r: 1.15, label: 'Player: pending, game pauses, you choose', w: 150, h: 56 },
    { id: 'ai', c: 2, r: 2.3, label: 'AI: automatic choice', w: 130, h: 48, kind: 'gray' },
    { id: 'fx', c: 1, r: 2.3, label: 'Effects applied', w: 150, h: 48, kind: 'red' },
  ],
  cw: 190, rh: 76, ox: 14, oy: 54,
  edges: [
    { from: 'chk', to: 'el' }, { from: 'el', to: 'fc' }, { from: 'fc', to: 'pick', fromSide: 'b', toSide: 't' },
    { from: 'pick', to: 'pl' }, { from: 'pick', to: 'ai', fromSide: 'b', toSide: 't' },
    { from: 'pl', to: 'fx', fromSide: 'b', toSide: 't', color: 'red' }, { from: 'ai', to: 'fx', color: 'red' },
  ],
});

// ===========================================================================
// war
// ===========================================================================
{
  const s = new Svg('How war score is built', 640, 400);
  const inputs = [
    ['Occupation', 'x48 share gap, plus goal progress x0.9'],
    ['Capital', '+/-8'],
    ['Blockade', '0.18 per province'],
    ['Battle', '+/-3.4 per decisive result'],
    ['Exhaustion', 'gap x0.35'],
  ];
  inputs.forEach(([t, d], i) => {
    const x = 16 + i * 124;
    s.box(x, 56, 116, 62, `${t}\n${d}`, { kind: 'blue', size: 10.5 });
    s.path([[x + 58, 119], [x + 58, 150]], { color: BLUE });
  });
  // score bar
  const bx = 40;
  const bw = 560;
  s.add(`<rect x="${bx}" y="152" width="${bw / 2}" height="28" fill="#fecaca" stroke="#a1a1aa"/>`);
  s.add(`<rect x="${bx + bw / 2}" y="152" width="${bw / 2}" height="28" fill="#bfdbfe" stroke="#a1a1aa"/>`);
  s.text(bx, 198, '-100', { size: 11, anchor: 'start', fill: MUTED });
  s.text(bx + bw / 2, 198, '0', { size: 11, fill: MUTED });
  s.text(bx + bw, 198, '+100', { size: 11, anchor: 'end', fill: MUTED });
  s.text(bx + bw / 4, 171, 'War score: the other side ahead', { size: 11.5, fill: RED });
  s.text(bx + (3 * bw) / 4, 171, 'War score: you ahead', { size: 11.5, fill: BLUE });
  s.text(16, 226, 'Peace options', { size: 12, weight: 600, anchor: 'start' });
  s.box(16, 244, 190, 52, 'Enforce goals, up to your score', { kind: 'blue', size: 11.5 });
  s.box(224, 244, 190, 52, 'White peace', { kind: 'gray', size: 11.5 });
  s.box(432, 244, 190, 52, 'Auto-peace at pressure 65 or exhaustion 96', { kind: 'red', size: 11.5 });
  s.path([[111, 206], [111, 242]], { color: MUTED, dashed: true });
  s.path([[319, 182], [319, 242]], { color: MUTED, dashed: true });
  s.path([[527, 182], [527, 242]], { color: MUTED, dashed: true });
  s.text(16, 330, 'The five inputs add up to a score between -100 and +100.', { size: 11, anchor: 'start', fill: MUTED });
  s.out('war-score-inputs.svg', 'Five inputs sum into a war score bar from -100 to +100: occupation, capital, blockade, battles and exhaustion. Below the bar are the peace options: enforce goals up to your score, white peace, and automatic peace at pressure 65 or exhaustion 96.');
}
lanes('One day of war, in order', [
  { name: 'Each day', steps: ['Movement (armies, fleets)', 'Supply and attrition', 'Battles', 'Sieges', 'Mobilization upkeep', 'Colonial claims'] },
  { name: 'Then', steps: ['Rebellions (every 3rd day)', 'Cleanup', 'War scores', 'Auto-peace', 'Post-peace demobilization'] },
], { name: 'war-daily-order.svg', desc: 'Phase order of runWarDaily: movement, supply and attrition, battles, sieges, mobilization upkeep, colonial claims, rebellions every third day, cleanup, war scores, auto-peace, then post-peace demobilization.', down: [{ from: '0:5', to: '1:0' }], note: 'Runs every day, before the weekly economy.' });
hub('War: connections', 'War',
  ['Diplomacy', 'AI nations', 'Crises', 'Population', 'Research', 'Politics and reform', 'Budget and taxation', 'Culture and nationalism', 'Events'],
  ['Diplomacy (truce)', 'Crises (tension)', 'Population', 'Budget (upkeep)', 'Politics (rebel demands)', 'AI nations', 'Research (AI weights)'],
  { name: 'war-connections.svg', desc: 'War in the centre. Diplomacy, AI, crises, population, research, politics, budget, culture and events feed in. Diplomacy (truce), crises (tension), population, budget (upkeep), politics (rebel demands), AI and research (AI weights) receive its effects.' });

// ===========================================================================
// diplomacy
// ===========================================================================
graph('Relations between two nations', {
  h: 420, name: 'diplomacy-relation-states.svg',
  desc: 'State diagram of a pair relation. Neutral can become an alliance (10 years, needs score 70), a guarantee (no end date) or a rivalry (12 diplomatic points, cap 4). A truce (5 years) follows any peace. A truce blocks war and alliance. Alliances and guarantees pull nations into wars.',
  nodes: [
    { id: 'riv', c: 1, r: 0, label: 'Rivalry: costs 12 DP, cap 4', w: 140, h: 46, kind: 'red' },
    { id: 'all', c: 0, r: 1, label: 'Alliance: 10 years, needs score 70', w: 130, h: 64 },
    { id: 'neu', c: 1, r: 1, label: 'Neutral', w: 140, h: 46, weight: 600 },
    { id: 'gua', c: 2, r: 1, label: 'Guarantee: no end date', w: 130, h: 64 },
    { id: 'war', c: 1, r: 2.1, label: 'War', w: 140, h: 46, kind: 'red', weight: 600 },
    { id: 'tru', c: 1, r: 3.2, label: 'Truce: 5 years, after any peace, then back to Neutral', w: 160, h: 64, kind: 'gray' },
  ],
  cw: 200, rh: 80, ox: 20, oy: 56, 
  edges: [
    { from: 'neu', to: 'riv', fromSide: 't', toSide: 'b', color: 'red', label: 'declare' },
    { from: 'neu', to: 'all', fromSide: 'l', toSide: 'r' }, { from: 'neu', to: 'gua', fromSide: 'r', toSide: 'l' },
    { from: 'all', to: 'war', fromSide: 'b', toSide: 'l', color: 'red', label: 'pulls in' }, { from: 'gua', to: 'war', fromSide: 'b', toSide: 'r', color: 'red', label: 'pulls in' },
    { from: 'war', to: 'tru', fromSide: 'b', toSide: 't', color: 'gray', label: 'any peace' },
  ],
  note: 'A truce blocks war and alliance until it ends.',
});
graph('How great powers and spheres form', {
  h: 330, name: 'diplomacy-great-powers-flow.svg',
  desc: 'Flow. Each month a power score (9 times the square root of industry, plus 2.5 times military, plus prestige) ranks nations. The top 8 become great powers ranked 1 to 8. Influence accrues by rank. 100 points makes a nation a client in a sphere. The patron gains 6 treasury and 0.08 prestige per client. Falling out of the top 8 releases all clients.',
  nodes: [
    { id: 'ps', c: 0, r: 0, label: 'Monthly power score: 9 x sqrt(industry) + 2.5 x military + prestige', w: 160, h: 72 },
    { id: 'top', c: 1, r: 0, label: 'Top 8 become great powers, rank 1 to 8', w: 160, h: 72 },
    { id: 'inf', c: 2, r: 0, label: 'Influence accrues, rank based', w: 150, h: 72 },
    { id: 'rel', c: 1, r: 1.3, label: 'Falls out of the top 8: all clients released', w: 160, h: 64, kind: 'red' },
    { id: 'cl', c: 2, r: 1.3, label: '100 points makes a client sphere member', w: 150, h: 56 },
    { id: 'pat', c: 2, r: 2.5, label: 'Patron gets +6 treasury and +0.08 prestige per client', w: 150, h: 64, kind: 'gray' },
  ],
  cw: 205, rh: 78, ox: 16, oy: 54,
  edges: [
    { from: 'ps', to: 'top' }, { from: 'top', to: 'inf' }, { from: 'inf', to: 'cl', fromSide: 'b', toSide: 't' }, { from: 'cl', to: 'pat', fromSide: 'b', toSide: 't' },
    { from: 'top', to: 'rel', fromSide: 'b', toSide: 't', color: 'red', dashed: true, label: 'if it drops out' },
  ],
});
lanes('Monthly diplomacy pass order', [
  { name: 'Diplomacy, monthly', steps: ['Clear expired relations', 'Rank great powers', 'Drift opinions', 'Accrue and spend influence', 'DP accrual', 'Pretext queues', 'Infamy decay and coalitions', 'Sphere income and prestige decay'] },
], { name: 'diplomacy-monthly-order.svg', desc: 'Phase order of runDiplomacyMonthly: clear expired relations, rank great powers, drift opinions, accrue and spend influence, DP accrual, pretext queues, infamy decay and coalitions, then sphere income and prestige decay.', note: 'Runs on the 1st, after research and before crises.' });
hub('Diplomacy: connections', 'Diplomacy',
  ['Time and the tick', 'War', 'AI nations', 'Production', 'Events', 'Crises'],
  ['War', 'Crises', 'AI nations', 'Budget and taxation', 'Research'],
  { name: 'diplomacy-connections.svg', desc: 'Diplomacy in the centre. Time, war, AI, production, events and crises feed in. War, crises, AI, budget and research receive its effects.' });

// ===========================================================================
// ai-nations
// ===========================================================================
graph('How an AI nation picks a war', {
  h: 440, name: 'ai-nations-war-decision.svg',
  desc: 'Decision flow. Look at neighbours, build both blocs, work out the advantage and score, pick a goal, and ask whether it has its own pretext. If not, it fabricates one and waits 70 to 140 days. Then check infamy, treasury and bankruptcy, and declare. Standing claims skip fabrication.',
  nodes: [
    { id: 'nb', c: 0, r: 0, label: 'Neighbours', w: 120 },
    { id: 'bl', c: 1, r: 0, label: 'Build both blocs', w: 140 },
    { id: 'ad', c: 2, r: 0, label: 'Advantage and score', w: 150 },
    { id: 'pk', c: 2, r: 1.1, label: 'Pick a goal', w: 150 },
    { id: 'pre', c: 2, r: 2.2, label: 'Own pretext?', w: 150, kind: 'gray', weight: 600 },
    { id: 'fab', c: 1, r: 2.2, label: 'No: fabricate and wait 70 to 140 days', w: 150, h: 64, kind: 'red' },
    { id: 'chk', c: 2, r: 3.4, label: 'Check infamy, treasury and bankruptcy', w: 150, h: 64 },
    { id: 'dec', c: 3, r: 3.4, label: 'Declare war', w: 100, h: 64, kind: 'red', weight: 600 },
    { id: 'claim', c: 0, r: 3.4, label: 'Standing claim: skips fabrication', w: 130, h: 64, kind: 'gray' },
  ],
  cw: 172, rh: 66, ox: 14, oy: 54,
  edges: [
    { from: 'nb', to: 'bl' }, { from: 'bl', to: 'ad' }, { from: 'ad', to: 'pk', fromSide: 'b', toSide: 't' }, { from: 'pk', to: 'pre', fromSide: 'b', toSide: 't' },
    { from: 'pre', to: 'fab', color: 'red', label: 'no' }, { from: 'pre', to: 'chk', fromSide: 'b', toSide: 't', label: 'yes' },
    { from: 'fab', to: 'chk', fromSide: 'b', toSide: 'l', color: 'red' },
    { from: 'claim', to: 'chk', color: 'gray', dashed: true },
    { from: 'chk', to: 'dec' },
  ],
});
lanes('Monthly AI pass order', [
  { name: 'Every month', steps: ['Tax stabilization', 'Peace check', 'War movement', 'Mobilization', 'Formables'] },
  { name: 'Heavy months', steps: ['Reforms', 'Factory', 'Military build', 'Diplomacy', 'Colonies and spheres', 'Formables'], kind: 'red' },
], { name: 'ai-nations-monthly-order.svg', desc: 'Phase order of runAiMonthly: every month, tax stabilization, peace check, war movement, mobilization and formables; then on heavy months, which come every third month for each nation, reforms, factory, military build, diplomacy, colonies and spheres, and formables.', down: [{ from: '0:4', to: '1:0', label: 'every third month per nation' }], note: 'Heavy planning is staggered so nations do not all plan in the same month.' });
hub('AI nations: connections', 'AI nations',
  ['Time and the tick', 'Diplomacy', 'War', 'Research', 'Politics and reform', 'Budget and taxation', 'Population', 'Crises'],
  ['War', 'Diplomacy', 'Crises', 'Production', 'Budget and taxation', 'Politics and reform', 'Research'],
  { name: 'ai-nations-connections.svg', desc: 'AI nations in the centre. Time, diplomacy, war, research, politics, budget, population and crises feed in. War, diplomacy, crises, production, budget, politics and research receive its effects.' });

// ===========================================================================
// research
// ===========================================================================
graph('One month of research', {
  h: 360, name: 'research-monthly-flow.svg',
  desc: 'Monthly flow. Earn points, choose a target (a player picks automatically at 1.5 times the cheapest), pay into the target, and the technology completes. Its modifiers flow out to economy, budget, population and war. Inventions roll, and literacy and prestige drips follow.',
  nodes: [
    { id: 'earn', c: 0, r: 0, label: 'Earn points', w: 110 },
    { id: 'tgt', c: 1.15, r: 0, label: 'Choose a target (player auto-picks at 1.5x the cheapest)', w: 190, h: 52 },
    { id: 'pay', c: 2.75, r: 0, label: 'Pay into the target', w: 130 },
    { id: 'done', c: 2.75, r: 1.2, label: 'Technology completes', w: 130, kind: 'gray' },
    { id: 'mod', c: 1.15, r: 1.2, label: 'Modifiers flow out to economy, budget, population and war', w: 190, h: 52, kind: 'red' },
    { id: 'inv', c: 0, r: 1.2, label: 'Inventions roll', w: 110, kind: 'gray' },
    { id: 'dr', c: 0, r: 2.4, label: 'Literacy and prestige drips', w: 150, kind: 'gray' },
  ],
  cw: 150, rh: 66, ox: 16, oy: 54,
  edges: [{ from: 'earn', to: 'tgt' }, { from: 'tgt', to: 'pay' }, { from: 'pay', to: 'done', fromSide: 'b', toSide: 't' }, { from: 'done', to: 'mod', color: 'red' }, { from: 'mod', to: 'inv', color: 'gray' }, { from: 'inv', to: 'dr', fromSide: 'b', toSide: 't', color: 'gray' }],
});
hub('Research: connections', 'Research',
  ['Time and the tick', 'Politics (literacy)', 'Diplomacy', 'Events', 'AI nations', 'War'],
  ['War', 'Production', 'Budget and taxation', 'The world market', 'Population', 'Politics and reform', 'AI nations'],
  { name: 'research-connections.svg', desc: 'Research in the centre. Time, politics (literacy), diplomacy, events, AI and war feed in. War, production, budget, market, population, politics and AI receive its effects.' });

console.log(`wrote ${made.length} diagrams to ${OUT}`);
console.log(made.join('\n'));
