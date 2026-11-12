import { defineConfig } from '@playwright/test';

/**
 * Headless Chromium on a GPU-less machine falls back to software GL on a
 * best-effort basis, and that fallback intermittently fails under load with
 * "Failed to initialize WebGL" (issue #31). Pin it to ANGLE + SwiftShader, the
 * same stack the CI graphics configs use, so map specs get a WebGL context
 * deterministically.
 */
const SOFTWARE_GL_ARGS = [
  '--enable-webgl',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  /**
   * Serial by default. Every spec here boots a full 620-province world and runs
   * the simulation in-browser; running twenty of those concurrently starves them
   * all and the suite fails 18/30 while each spec passes standalone. Override
   * with PW_WORKERS on a machine with headroom.
   */
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 1,
  /** One retry absorbs a residual software-GL init hiccup under host load. */
  retries: process.env.PW_RETRIES ? Number(process.env.PW_RETRIES) : 1,
  projects: [
    {
      name: 'dev',
      testIgnore: [/e6-platform\.spec\.ts/],
      use: {
        baseURL: 'http://127.0.0.1:4173',
        headless: true,
        launchOptions: { args: SOFTWARE_GL_ARGS },
      },
    },
    {
      name: 'prod-e6',
      testMatch: /e6-platform\.spec\.ts/,
      use: {
        baseURL: 'http://127.0.0.1:4174',
        headless: true,
        launchOptions: { args: SOFTWARE_GL_ARGS },
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      // Prefer an existing production build; build if dist is missing.
      command: 'npx vite preview --host 127.0.0.1 --port 4174',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npm run server',
      url: 'http://127.0.0.1:3412',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
