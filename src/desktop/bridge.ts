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
  core?: {
    invoke?: (cmd: string, args?: unknown, options?: { headers?: Record<string, string> }) => Promise<unknown>;
  };
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

/** Opens a save dialog and writes the bytes to the chosen path. False if cancelled. */
export async function exportSaveFileDesktop(bytes: Uint8Array, fileName: string): Promise<boolean> {
  const invoke = tauri()?.core?.invoke;
  if (!invoke) throw new Error('Desktop file access is unavailable.');
  return (await invoke('export_save_file', bytes, { headers: { 'x-file-name': fileName } })) === true;
}

/** Opens a file dialog and returns the chosen file's bytes and name, or null if cancelled. */
export async function importSaveFileDesktop(): Promise<{ bytes: Uint8Array; name: string } | null> {
  const invoke = tauri()?.core?.invoke;
  if (!invoke) throw new Error('Desktop file access is unavailable.');
  const result = (await invoke('import_save_file')) as ArrayBuffer | number[];
  const bytes = result instanceof ArrayBuffer ? new Uint8Array(result) : new Uint8Array(result);
  if (bytes.length === 0) return null;
  // The first byte is the file-name length, then the name, then the file bytes.
  const nameLength = bytes[0];
  const name = new TextDecoder().decode(bytes.slice(1, 1 + nameLength));
  return { bytes: bytes.slice(1 + nameLength), name };
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
