use std::fs;
use std::path::Path;
use tauri::command;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_file, read_image_as_base64, resolve_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
