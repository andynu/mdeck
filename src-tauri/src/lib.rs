use std::fs;
use std::path::Path;
use std::env;
use tauri::command;
use tauri::{AppHandle, Emitter, Manager};
use notify::{Watcher, RecursiveMode, Event};
use std::sync::Mutex;

#[command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[command]
fn read_image_as_base64(path: String) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};

    let image_data = fs::read(&path)
        .map_err(|e| format!("Failed to read image: {}", e))?;

    // Determine MIME type from extension
    let mime_type = match Path::new(&path).extension().and_then(|s| s.to_str()) {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("svg") => "image/svg+xml",
        Some("webp") => "image/webp",
        _ => "image/png", // default to png
    };

    let base64_data = general_purpose::STANDARD.encode(&image_data);
    Ok(format!("data:{};base64,{}", mime_type, base64_data))
}

#[command]
fn resolve_path(base_path: String, relative_path: String) -> Result<String, String> {
    let base = Path::new(&base_path);
    let parent = base.parent()
        .ok_or_else(|| "Failed to get parent directory".to_string())?;
    let resolved = parent.join(&relative_path);
    resolved
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Failed to convert path to string".to_string())
}

struct WatcherState(Mutex<Option<notify::RecommendedWatcher>>);

#[derive(Clone, serde::Serialize)]
struct InitialFilePayload {
    path: String,
    content: String,
}

#[command]
fn start_watching_file(app: AppHandle, file_path: String) -> Result<(), String> {
    let state = app.state::<WatcherState>();
    let mut watcher_guard = state.0.lock().unwrap();

    // Stop any existing watcher
    if watcher_guard.is_some() {
        *watcher_guard = None;
    }

    let app_handle = app.clone();
    let watch_path = file_path.clone();

    let mut watcher = notify::recommended_watcher(move |result: Result<Event, notify::Error>| {
        match result {
            Ok(event) => {
                // Only emit on write events to avoid too many notifications
                if event.kind.is_modify() {
                    let _ = app_handle.emit("file-changed", &watch_path);
                }
            }
            Err(e) => eprintln!("Watch error: {:?}", e),
        }
    }).map_err(|e| format!("Failed to create watcher: {}", e))?;

    // Watch the specific file
    watcher.watch(Path::new(&file_path), RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch file: {}", e))?;

    *watcher_guard = Some(watcher);
    Ok(())
}

#[command]
fn stop_watching_file(app: AppHandle) -> Result<(), String> {
    let state = app.state::<WatcherState>();
    let mut watcher_guard = state.0.lock().unwrap();
    *watcher_guard = None;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Get command line arguments
    let args: Vec<String> = env::args().collect();

    // Check if a file path was provided as argument
    let initial_file = if args.len() > 1 {
        let file_path = &args[1];
        let absolute_path = if Path::new(file_path).is_absolute() {
            file_path.clone()
        } else {
            // Convert relative path to absolute
            match env::current_dir() {
                Ok(cwd) => cwd.join(file_path).to_string_lossy().to_string(),
                Err(_) => file_path.clone(),
            }
        };

        // Try to read the file content
        match fs::read_to_string(&absolute_path) {
            Ok(content) => Some(InitialFilePayload {
                path: absolute_path.clone(),
                content,
            }),
            Err(e) => {
                eprintln!("Failed to read initial file '{}': {}", absolute_path, e);
                None
            }
        }
    } else {
        None
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(WatcherState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            read_file,
            read_image_as_base64,
            resolve_path,
            start_watching_file,
            stop_watching_file
        ])
        .setup(move |app| {
            // If we have an initial file, emit an event after the window is ready
            if let Some(file_data) = initial_file {
                let app_handle = app.handle().clone();
                // Use a small delay to ensure the frontend is ready
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = app_handle.emit("load-initial-file", file_data);
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
