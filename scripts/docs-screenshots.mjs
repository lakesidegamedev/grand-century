#!/usr/bin/env node
/**
 * Captures the Grand Century docs screenshots into docs/images (PNG).
 *
 * Regenerate: start the game's dev server from the game repo
 *   npm run dev -- --host 127.0.0.1 --port 4120
 * then
 *   GAME_REPO_PATH=/path/to/game GAME_URL=http://127.0.0.1:4120 node scripts/docs-screenshots.mjs [shot-name ...]
 * Uses the game repo's own Playwright and a fresh single-player 1830 campaign
 * (United Kingdom, no multiplayer names). Shots that need a live war or crisis
 * play the campaign forward until the situation exists; a shot that never
 * appears is skipped and reported, never faked.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', 'docs', 'images');
const GAME = process.env.GAME_REPO_PATH || new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const URL = process.env.GAME_URL || 'http://127.0.0.1:4120';
const only = process.argv.slice(2);
const { chromium } = createRequire(path.join(GAME, 'package.json'))('@playwright/test');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1240, height: 900 } });
await page.addInitScript(() => localStorage.setItem('grand-century.tutorial.v0_2_0.seen', '1'));
await page.goto(URL);
await page.getByTestId('menu-new-game').waitFor({ state: 'visible', timeout: 60000 });
await page.getByTestId('menu-new-game').click();
await page.locator('.menu-overlay').waitFor({ state: 'hidden', timeout: 30000 });
await page.waitForTimeout(16000); // map and first snapshot

const results = { made: [], skipped: [] };
const want = (n) => only.length === 0 || only.includes(n);
const click = (id) => page.dispatchEvent(`[data-testid="${id}"]`, 'click');
const text = async (loc) => (await loc.first().innerText().catch(() => '')) || '';

async function openPanel(id) {
  await click(`panel-${id}`);
  await page.waitForSelector('aside.panel-host', { timeout: 10000 });
  await page.waitForTimeout(900);
  return page.locator('aside.panel-host');
}
async function closePanel() {
  const done = page.locator('.panel-host__close');
  if (await done.count()) await done.first().click().catch(() => {});
  await page.waitForTimeout(300);
}
async function clipOf(...locs) {
  const boxes = [];
  for (const l of locs) {
    const b = await l.boundingBox();
    if (b) boxes.push(b);
  }
  const x0 = Math.max(0, Math.min(...boxes.map((b) => b.x)) - 6);
  const y0 = Math.max(0, Math.min(...boxes.map((b) => b.y)) - 6);
  const x1 = Math.min(1240, Math.max(...boxes.map((b) => b.x + b.width)) + 6);
  const y1 = Math.min(900, Math.max(...boxes.map((b) => b.y + b.height)) + 6);
  return { x: x0, y: y0, width: Math.min(1200, x1 - x0), height: y1 - y0 };
}
async function save(name, clip, alt) {
  await page.screenshot({ path: path.join(OUT, name), clip });
  results.made.push({ file: name, alt });
  console.log('made', name);
}
async function skip(name, why) {
  results.skipped.push({ file: name, why });
  console.log('SKIP', name, why);
}
async function hoverTrace(scope, nth = 0) {
  const t = (typeof nth === 'object' ? scope.locator('.trace-value-wrap', { hasText: nth }).first() : scope.locator('.trace-value-wrap').nth(nth));
  await t.scrollIntoViewIfNeeded().catch(() => {});
  await t.hover();
  await page.waitForTimeout(500);
  return t;
}

async function panelShot(name, id, alt, { before, after, tooltip } = {}) {
  if (!want(name)) return;
  try {
    const panel = await openPanel(id);
    if (before) await before(panel);
    let clip;
    if (tooltip) {
      await hoverTrace(panel, tooltip.match ?? tooltip.nth ?? 0);
      const tip = page.locator('.trace-value-wrap.is-open .trace-tooltip, .trace-value-wrap.is-open [role="tooltip"], .trace-value-wrap.is-open > span:last-child').first();
      clip = await clipOf(panel, tip);
    } else clip = await clipOf(panel);
    await save(name, clip, alt);
    if (after) await after(panel);
  } catch (e) {
    await skip(name, `error: ${String(e.message).slice(0, 120)}`);
  } finally {
    await page.mouse.move(5, 5);
    await closePanel();
  }
}

// --- top bar ----------------------------------------------------------------
if (want('time-and-the-tick-top-bar.png')) {
  await page.locator('.hud-top').waitFor();
  await save('time-and-the-tick-top-bar.png', await clipOf(page.locator('.hud-top')), 'Top bar of the 1830 campaign showing the date, the Paused badge and the Pause and x1 to x5 speed buttons.');
}

// --- panels -----------------------------------------------------------------
await panelShot('population-panel.png', 'population', 'Population panel', {});
await panelShot('population-needs-tooltip.png', 'population', 'Population panel with a Needs tooltip open', { tooltip: { nth: 1 } });
await panelShot('production-and-industry-panel.png', 'production', 'Production panel', {});
await panelShot('the-world-market-panel.png', 'market', 'Market panel with a price tooltip', { tooltip: { nth: 0 } });
await panelShot('budget-and-taxation-panel.png', 'budget', 'Budget panel with a tax tooltip', { tooltip: { nth: 0 } });
await panelShot('politics-and-reform-panel.png', 'politics', 'Politics panel', {});
await panelShot('culture-and-nationalism-panel.png', 'cultures', 'Cultures panel', {});
await panelShot('events-and-decisions-decisions-panel.png', 'decisions', 'Decisions panel', {});
await panelShot('research-technology-panel.png', 'technology', 'Technology panel', {});
await panelShot('war-military-panel.png', 'military', 'Military panel', {});
await panelShot('diplomacy-panel.png', 'diplomacy', 'Diplomacy panel', {});
await panelShot('diplomacy-great-powers-panel.png', 'great_powers', 'Great Powers panel', {});

if (want('README-map.png')) {
  await page.mouse.click(600, 420);
  await page.waitForTimeout(1500);
  await save('README-map.png', { x: 0, y: 0, width: 1200, height: 800 }, 'Main map at the start of the 1830 campaign');
}
if (want('README-graphics-toggle.png')) {
  const bar = page.getByText('2D \u00b7 Low power').first().locator('xpath=..');
  await save('README-graphics-toggle.png', await clipOf(bar), 'Graphics toggle');
}
if (want('budget-and-taxation-tariff-slider.png')) {
  const panel = await openPanel('budget');
  const lab = panel.getByText(/Tariff \d+%/).first();
  const b = await lab.boundingBox();
  const pb = await panel.boundingBox();
  await save('budget-and-taxation-tariff-slider.png', { x: pb.x, y: b.y - 10, width: pb.width, height: 62 }, 'Tariff slider');
  await closePanel();
}
console.log(JSON.stringify(results, null, 1));
await browser.close();
