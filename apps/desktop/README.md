# Grand Century desktop

A Tauri 2 shell that runs the Grand Century web build in a native window on
Windows, Linux and macOS. The game itself is the repo web build; this folder
only holds the window host.

## What it does

- Window title "Grand Century", 1280x800 by default, resizable, minimum 900x600.
- F11 and the "Fullscreen (F11)" main menu item toggle fullscreen. The bridge is
  `src/desktop/bridge.ts` and does nothing in the web or mobile builds.
- Window size, position and fullscreen are remembered in the app config folder.
- First run defaults the map to 3D Balanced when WebGL2 is available, otherwise
  2D low power. A choice made in the map controls always wins afterwards.
- Multiplayer connects to `wss://gc-server.lakesidegames.net/ws`. The content
  security policy allows only the app itself, that host, and the elevation tile
  host used by the optional detail layer.

## How CI builds it

`.github/workflows/desktop.yml` runs on manual dispatch and on pull requests
touching this folder. Each job:

1. builds the web app with `VITE_BASE=./` and `VITE_DESKTOP=1` (relative asset
   paths, service worker off);
2. generates the icon set from `apps/mobile/assets/grand-century-icon.png` with
   `tauri icon` (no icon binaries are committed);
3. runs `tauri-action`: NSIS installer on Windows, AppImage and deb on Linux,
   dmg on macOS (Apple silicon).

The Windows job also installs the setup silently, launches the app, waits 25
seconds, and uploads a screenshot as `desktop-windows-screenshot`. Passing
`release_tag` on a manual run attaches the installers to that existing release.

The app version comes from the root `package.json`.

## Save files

The Save / Load panel has an "Export slot" button per slot, in the web build
(downloads a `.gcsave` file) and in the desktop app (opens a save dialog). The
desktop app also shows "Import file", which opens a file dialog, stores the
chosen `.gcsave` as an `imported-<name>` slot and loads it. A `.gcsave` file is
a short `GCSAVE1` header plus the same compressed bytes a slot holds, so a save
exported in the browser imports in the desktop app. The normal loader still
checks the save version and world fingerprint and refuses foreign saves.

File access is two Rust commands (`export_save_file`, `import_save_file`) built
on the dialog plugin. The page never passes a path; only the file the player
picks in the dialog is read or written, and no filesystem permission is granted
to the page.

## Unsigned builds

Nothing is code signed. Windows shows a SmartScreen warning, and macOS needs
right click, Open on first launch.

## Where data lives

Saves and settings are the same browser storage the web build uses (IndexedDB
and localStorage), held in the WebView profile inside the per-user app data
folder (`%LOCALAPPDATA%\net.lakesidegames.grandcentury` on Windows). Window
state is in the app config folder. Uninstalling the app does not delete the
profile; delete the folder to reset saves.
