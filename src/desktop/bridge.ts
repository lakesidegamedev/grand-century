/**
 * Desktop (Tauri) bridge. Every export is a no-op or a neutral answer when the
 * page is not running inside the desktop shell, so the web and mobile builds
 * are unaffected.
 */
interface TauriWindowHandle {
  isFullscreen(): Promise<boolean>;
  setFullscreen(value: boolean): Promise<void>;
}
interface TauriGlobal {
  window?: { getCurrentWindow?: () => TauriWindowHandle };
}

function tauri(): TauriGlobal | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__ ?? null;
}

export function isDesktopApp(): boolean {
  return tauri() !== null;
}

export async function toggleFullscreen(): Promise<void> {
  const handle = tauri()?.window?.getCurrentWindow?.();
  if (!handle) return;
  try {
    await handle.setFullscreen(!(await handle.isFullscreen()));
  } catch {
    /* Window API unavailable: leave the window as it is. */
  }
}

function webgl2Available(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

/** First-run graphics default on desktop: 3D Balanced when WebGL2 works. */
export function desktopDefaultGraphics(): '3d' | null {
  return isDesktopApp() && webgl2Available() ? '3d' : null;
}

let hotkeysInstalled = false;
/** F11 toggles fullscreen inside the desktop app. */
export function installDesktopHotkeys(): void {
  if (hotkeysInstalled || !isDesktopApp()) return;
  hotkeysInstalled = true;
  window.addEventListener('keydown', (event) => {
    if (event.key !== 'F11') return;
    event.preventDefault();
    void toggleFullscreen();
  });
}
