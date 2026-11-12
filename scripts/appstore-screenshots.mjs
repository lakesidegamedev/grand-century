#!/usr/bin/env node
/**
 * Captures App Store screenshots of the web build into artifacts/appstore/ (git-ignored).
 *
 * Sizes (device pixels): iPhone 6.9 inch 1320x2868 (viewport 440x956 at 3x),
 * iPad 13 inch 2064x2752 (viewport 1032x1376 at 2x).
 * Shots: home, campaign, politics, market. See scripts/appstore-screenshots.md.
 *
 *   npm run dev -- --host 127.0.0.1 --port 4120
 *   GAME_URL=http://127.0.0.1:4120 node scripts/appstore-screenshots.mjs [iphone|ipad]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', 'artifacts', 'appstore');
const BASE = process.env.GAME_URL || 'http://127.0.0.1:4120';
const DEVICES = {
  iphone: { width: 440, height: 956, scale: 3 },
  ipad: { width: 1032, height: 1376, scale: 2 },
};
const only = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const [name, d] of Object.entries(DEVICES)) {
  if (only.length && !only.includes(name)) continue;
  const ctx = await browser.newContext({
    viewport: { width: d.width, height: d.height },
    deviceScaleFactor: d.scale,
    isMobile: name === 'iphone',
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('grand-century.tutorial.v0_2_0.seen', '1'));
  const shot = async (label) => {
    await page.screenshot({ path: path.join(OUT, `${name}-${label}.png`) });
    console.log('made', `${name}-${label}.png`);
  };
  const click = (id) => page.dispatchEvent(`[data-testid="${id}"]`, 'click');

  await page.goto(BASE);
  await page.getByTestId('menu-new-game').waitFor({ state: 'visible', timeout: 60000 });
  await shot('1-home');

  await page.getByTestId('menu-new-game').click();
  await page.locator('.menu-overlay').waitFor({ state: 'hidden', timeout: 30000 });
  await page.waitForTimeout(16000); // map and first snapshot
  await shot('2-campaign');

  for (const [label, panel] of [['3-politics', 'politics'], ['4-market', 'market']]) {
    await click(`panel-${panel}`);
    await page.waitForSelector('aside.panel-host', { timeout: 10000 });
    await page.waitForTimeout(900);
    await shot(label);
    const close = page.locator('.panel-host__close');
    if (await close.count()) await close.first().click().catch(() => {});
    await page.waitForTimeout(300);
  }
  await ctx.close();
}
await browser.close();
