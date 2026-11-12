# App Store screenshot kit

Captures the web build at the two required App Store sizes. Output goes to
`artifacts/appstore/` (git-ignored). Nothing here builds the native app.

| Device | Device pixels | Viewport at scale |
| --- | --- | --- |
| iPhone 6.9 inch | 1320 x 2868 | 440 x 956 at 3x |
| iPad 13 inch | 2064 x 2752 | 1032 x 1376 at 2x |

Shots per device: `1-home` (main menu), `2-campaign` (running 1830 campaign),
`3-politics` (Politics panel), `4-market` (market panel).

## Steps

1. Install dependencies once: `npm ci`, then `npx playwright install chromium`.
2. Start the dev server: `npm run dev -- --host 127.0.0.1 --port 4120`.
3. In a second terminal run `node scripts/appstore-screenshots.mjs`.
   Pass `iphone` or `ipad` to capture one device only. Set `GAME_URL` if the
   server is elsewhere.
4. Collect the PNGs from `artifacts/appstore/` (`iphone-1-home.png`, and so on).
5. Check each image is exactly the pixel size in the table, then upload in
   App Store Connect under the matching device slot.

## Notes

- The script skips the tutorial overlay and waits about 16 seconds after
  starting a campaign so the map and first snapshot are ready.
- Capture the home shot before the campaign shot; the script already does.
- To get a mid-war or crisis shot, play the campaign forward by hand and take
  a manual capture; the script does not fake game state.
