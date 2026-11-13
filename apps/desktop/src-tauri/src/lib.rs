/// Grand Century desktop shell. The game is the repo web build served from the
/// bundled frontend; this crate only hosts the window.
///
/// The window-state plugin remembers size, position and fullscreen in the app
/// config directory and restores them on the next launch. It runs entirely on
/// the Rust side and grants the page no extra capability.
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .run(tauri::generate_context!())
    .expect("error while running Grand Century");
}
