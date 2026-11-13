use tauri::ipc::{InvokeBody, Request, Response};
use tauri_plugin_dialog::DialogExt;

/// Largest save file the app will read from disk.
const MAX_SAVE_BYTES: u64 = 256 * 1024 * 1024;

/// Writes the raw request body to a path the player picks in a save dialog.
/// The page never supplies a path, so it cannot write anywhere on its own.
/// Returns false if the player cancels.
#[tauri::command]
async fn export_save_file(app: tauri::AppHandle, request: Request<'_>) -> Result<bool, String> {
  let bytes = match request.body() {
    InvokeBody::Raw(bytes) => bytes.clone(),
    _ => return Err("expected raw save bytes".into()),
  };
  let name = request
    .headers()
    .get("x-file-name")
    .and_then(|value| value.to_str().ok())
    .unwrap_or("save.gcsave")
    .to_string();
  let picked = app
    .dialog()
    .file()
    .add_filter("Grand Century save", &["gcsave"])
    .set_file_name(&name)
    .blocking_save_file();
  let Some(picked) = picked else { return Ok(false) };
  let path = picked.into_path().map_err(|e| e.to_string())?;
  std::fs::write(path, bytes).map_err(|e| e.to_string())?;
  Ok(true)
}

/// Lets the player pick a .gcsave file and returns one byte of file-name
/// length, the file name, then the file contents. An empty body means cancelled.
#[tauri::command]
async fn import_save_file(app: tauri::AppHandle) -> Result<Response, String> {
  let picked = app
    .dialog()
    .file()
    .add_filter("Grand Century save", &["gcsave"])
    .blocking_pick_file();
  let Some(picked) = picked else { return Ok(Response::new(Vec::<u8>::new())) };
  let path = picked.into_path().map_err(|e| e.to_string())?;
  let size = std::fs::metadata(&path).map_err(|e| e.to_string())?.len();
  if size > MAX_SAVE_BYTES {
    return Err("that file is too large to be a save".into());
  }
  let contents = std::fs::read(&path).map_err(|e| e.to_string())?;
  let name = path
    .file_name()
    .map(|n| n.to_string_lossy().into_owned())
    .unwrap_or_else(|| "save.gcsave".into());
  let name_bytes: Vec<u8> = name.into_bytes().into_iter().take(255).collect();
  let mut out = Vec::with_capacity(1 + name_bytes.len() + contents.len());
  out.push(name_bytes.len() as u8);
  out.extend_from_slice(&name_bytes);
  out.extend_from_slice(&contents);
  Ok(Response::new(out))
}

/// Grand Century desktop shell. The game is the repo web build served from the
/// bundled frontend; this crate hosts the window and the save file dialogs.
///
/// The window-state plugin remembers size, position and fullscreen in the app
/// config directory and restores them on the next launch. The dialog plugin is
/// used only from the two commands above, which read or write the single path
/// the player chose; the page gets no general filesystem access.
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![export_save_file, import_save_file])
    .run(tauri::generate_context!())
    .expect("error while running Grand Century");
}
