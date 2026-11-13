// Store screenshot hook. Compiled in only when EXPO_PUBLIC_APPSTORE_SHOTS=1 at
// build time (the screenshot workflow); release builds never set it, so the
// poller is never installed. Commands arrive as text in Documents/shot-command.txt
// (written by the screenshot script) because iOS asks for confirmation on launch URLs.
export const SHOTS_ENABLED = process.env.EXPO_PUBLIC_APPSTORE_SHOTS === '1';

export type ShotCommand =
  | { kind: 'home' }
  | { kind: 'nations' }
  | { kind: 'campaign' }
  | { kind: 'panel'; panel: string };

/** Parses <home|nations|campaign|panel/<key>>, optionally prefixed by grandcentury://shot/. */
export function parseShotUrl(url: string): ShotCommand | null {
  if (!SHOTS_ENABLED) return null;
  const match = /^(?:grandcentury:\/\/\/?shot\/)?([a-z]+)(?:\/([a-z_]+))?\s*$/i.exec(url);
  if (!match) return null;
  const [, kind, arg] = match;
  if (kind === 'home' || kind === 'nations' || kind === 'campaign') return { kind };
  if (kind === 'panel' && arg) return { kind, panel: arg };
  return null;
}

type Listener = (panel: string) => void;
let panelListener: Listener | null = null;
export const shotPanels = {
  subscribe(listener: Listener) {
    panelListener = listener;
    return () => {
      if (panelListener === listener) panelListener = null;
    };
  },
  open(panel: string) {
    panelListener?.(panel);
  },
};
