// Desktop smoke test: drives the INSTALLED app over WebView2 remote debugging.
// Proves: a campaign starts, runs, saves, survives a full quit, and continues.
// Usage: node smoke.mjs <path-to-installed-exe> <screenshot-dir>
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const exe = process.argv[2];
const shots = process.argv[3] ?? 'smoke-shots';
const PORT = 9222;
const CDP = `http://127.0.0.1:${PORT}`;
if (!exe) {
  console.log('FAIL: no exe path given');
  process.exit(1);
}
mkdirSync(shots, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let stage = 'start';
const log = (m) => console.log(`[smoke] ${m}`);

function killApp() {
  for (const image of ['grandcentury-desktop.exe', 'GrandCentury.exe', 'msedgewebview2.exe']) {
    spawnSync('taskkill', ['/F', '/T', '/IM', image], { stdio: 'ignore' });
  }
}

function diagnose(pid) {
  const ps = (cmd) => spawnSync('powershell', ['-NoProfile', '-Command', cmd], { encoding: 'utf8' }).stdout;
  log(`diagnostics: app pid ${pid} alive: ${ps(`[bool](Get-Process -Id ${pid} -ErrorAction SilentlyContinue)`).trim()}`);
  log(`diagnostics: webview browser process has remote-debugging flag: ${ps('(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "msedgewebview2.exe" -and $_.CommandLine -match "embedded-browser-webview" }).CommandLine -match "remote-debugging-port"').trim()}`);
  log(`diagnostics: browser cmd tail: ${ps('$c=(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq "msedgewebview2.exe" -and $_.CommandLine -match "embedded-browser-webview" } | Select-Object -First 1).CommandLine; if($c){$c.Substring([Math]::Max(0,$c.Length-400))}').trim()}`);
  log(`diagnostics: webview/app listeners:\n${ps('$ids=(Get-Process | Where-Object { $_.ProcessName -match "msedgewebview2|grandcentury" }).Id; Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ids -contains $_.OwningProcess } | Select-Object LocalAddress,LocalPort,OwningProcess | Format-Table -AutoSize | Out-String')}`);
  log(`diagnostics: env var seen by node: ${process.env.WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS ?? '(unset in parent)'}`);
}

async function launch() {
  const child = spawn(exe, [], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${PORT}` },
  });
  child.unref();
  log(`launched pid ${child.pid}`);
  let lastErr;
  for (let i = 0; i < 60; i++) {
    try {
      const browser = await chromium.connectOverCDP(CDP, { timeout: 5000 });
      let page;
      for (let j = 0; j < 30 && !page; j++) {
        page = browser.contexts().flatMap((c) => c.pages())[0];
        if (!page) await sleep(1000);
      }
      if (!page) throw new Error('connected over CDP but no page found');
      log(`attached over CDP after ${i + 1} attempt(s), url ${page.url()}`);
      return { browser, page };
    } catch (e) {
      lastErr = e;
      await sleep(2000);
    }
  }
  diagnose(child.pid);
  throw new Error(`could not attach over CDP: ${lastErr}`);
}

const shot = (page, name) => page.screenshot({ path: join(shots, `${name}.png`) }).catch((e) => log(`screenshot ${name} failed: ${e.message}`));
const hudDate = (page) => page.getByTestId('hud-date').first().innerText();

let fail = null;
let recorded = null;
try {
  stage = 'first launch';
  killApp();
  let { browser, page } = await launch();
  await page.getByTestId('menu-new-game').waitFor({ state: 'visible', timeout: 90000 });
  await shot(page, '1-main-menu');

  stage = 'start campaign';
  await page.getByTestId('menu-new-game').click();
  await page.getByTestId('hud-date').first().waitFor({ state: 'visible', timeout: 90000 });
  const startDate = await hudDate(page);
  log(`campaign started, date ${startDate}`);
  await shot(page, '2-campaign-started');

  stage = 'run at speed 3';
  // The runner has no GPU, so the page is busy while the sim runs. Use dispatched
  // clicks with long timeouts, no screenshot while running, and read the date
  // only after pausing.
  await page.dispatchEvent('[data-testid="speed-3"]', 'click', undefined, { timeout: 90000 });
  await sleep(8000);
  await page.dispatchEvent('[data-testid="speed-0"]', 'click', undefined, { timeout: 90000 });
  await sleep(3000);
  await shot(page, '3-paused-after-run');
  recorded = await hudDate(page);
  log(`recorded date after run: ${recorded}`);
  if (recorded <= startDate) throw new Error(`date did not advance (start ${startDate}, now ${recorded})`);

  stage = 'manual save';
  await page.dispatchEvent('[data-testid="panel-save_load"]', 'click', undefined, { timeout: 90000 });
  const slot = page.locator('input[placeholder="slot-1"]');
  await slot.waitFor({ state: 'visible', timeout: 15000 });
  await slot.fill('smoke', { timeout: 90000 });
  await page.getByRole('button', { name: 'Save', exact: true }).dispatchEvent('click', undefined, { timeout: 90000 });
  await page.getByText(/save \[smoke\]/i).waitFor({ timeout: 30000 });
  const status = await page.getByText(/save \[smoke\]/i).first().innerText();
  log(`save status: ${status}`);
  await shot(page, '4-saved');
  if (/fail|error/i.test(status)) throw new Error(`save reported a problem: ${status}`);

  stage = 'quit';
  await browser.close().catch(() => {});
  killApp();
  await sleep(5000);

  stage = 'relaunch';
  ({ browser, page } = await launch());
  await page.getByTestId('menu-resume').waitFor({ state: 'visible', timeout: 90000 });
  await shot(page, '5-relaunch-menu');
  log('relaunch menu offers Continue');

  stage = 'continue';
  await page.dispatchEvent('[data-testid="menu-resume"]', 'click', undefined, { timeout: 90000 });
  await page.getByTestId('menu-resume').waitFor({ state: 'hidden', timeout: 60000 });
  await sleep(3000);
  const after = await hudDate(page);
  log(`date after continue: ${after}`);
  await shot(page, '6-continued');
  if (!after || after < recorded) throw new Error(`continued date ${after} is before saved date ${recorded}`);
  await browser.close().catch(() => {});
} catch (e) {
  fail = `${stage}: ${e.message}`;
}
killApp();
if (fail) {
  console.log(`FAIL: ${fail}`);
  process.exit(1);
}
console.log(`PASS: campaign started, ran, saved at ${recorded}, app quit and relaunched, Continue loaded the save`);
