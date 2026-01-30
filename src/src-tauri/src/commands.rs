use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileResult {
    pub success: bool,
    pub content: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InstallResult {
    pub success: bool,
    pub message: String,
    pub error: Option<String>,
}

/// Get the Claude config directory path (~/.claude)
#[tauri::command]
pub fn get_claude_config_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|home| home.join(".claude").to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine home directory".to_string())
}

/// Check if a file exists
#[tauri::command]
pub fn file_exists(path: String) -> bool {
    PathBuf::from(&path).exists()
}

/// Create a directory (and parent directories if needed)
#[tauri::command]
pub fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

/// Read a config file
#[tauri::command]
pub fn read_config_file(path: String) -> FileResult {
    match fs::read_to_string(&path) {
        Ok(content) => FileResult {
            success: true,
            content: Some(content),
            error: None,
        },
        Err(e) => FileResult {
            success: false,
            content: None,
            error: Some(e.to_string()),
        },
    }
}

/// Write a config file
#[tauri::command]
pub fn write_config_file(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = PathBuf::from(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    fs::write(&path, content).map_err(|e| e.to_string())
}

/// Copy a file from source to destination
#[tauri::command]
pub fn copy_file(source: String, destination: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = PathBuf::from(&destination).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    fs::copy(&source, &destination)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// Set file permissions (Unix only)
#[tauri::command]
pub fn set_executable(path: String) -> Result<(), String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
        let mut permissions = metadata.permissions();
        permissions.set_mode(0o755); // rwxr-xr-x
        fs::set_permissions(&path, permissions).map_err(|e| e.to_string())
    }

    #[cfg(not(unix))]
    {
        // Windows doesn't need explicit executable permissions
        Ok(())
    }
}

/// Merge hooks into existing settings.json safely
#[tauri::command]
pub fn merge_hooks_to_settings(
    settings_path: String,
    hooks_json: String,
) -> InstallResult {
    // Read existing settings or create empty object
    let existing_content = fs::read_to_string(&settings_path).unwrap_or_else(|_| "{}".to_string());

    let mut settings: Value = match serde_json::from_str(&existing_content) {
        Ok(v) => v,
        Err(e) => {
            return InstallResult {
                success: false,
                message: String::new(),
                error: Some(format!("Failed to parse existing settings: {}", e)),
            };
        }
    };

    let hooks: Value = match serde_json::from_str(&hooks_json) {
        Ok(v) => v,
        Err(e) => {
            return InstallResult {
                success: false,
                message: String::new(),
                error: Some(format!("Failed to parse hooks JSON: {}", e)),
            };
        }
    };

    // Ensure settings is an object
    if !settings.is_object() {
        settings = json!({});
    }

    // Merge hooks into settings
    if let Some(settings_obj) = settings.as_object_mut() {
        if let Some(hooks_obj) = hooks.as_object() {
            // Get or create hooks section
            let existing_hooks = settings_obj
                .entry("hooks")
                .or_insert_with(|| json!({}));

            if let Some(existing_hooks_obj) = existing_hooks.as_object_mut() {
                // Merge each hook event
                for (key, value) in hooks_obj {
                    existing_hooks_obj.insert(key.clone(), value.clone());
                }
            }
        }
    }

    // Write back to file
    let pretty_json = match serde_json::to_string_pretty(&settings) {
        Ok(s) => s,
        Err(e) => {
            return InstallResult {
                success: false,
                message: String::new(),
                error: Some(format!("Failed to serialize settings: {}", e)),
            };
        }
    };

    match fs::write(&settings_path, pretty_json) {
        Ok(_) => InstallResult {
            success: true,
            message: "Hooks merged successfully".to_string(),
            error: None,
        },
        Err(e) => InstallResult {
            success: false,
            message: String::new(),
            error: Some(format!("Failed to write settings: {}", e)),
        },
    }
}

/// Remove hooks from settings.json
#[tauri::command]
pub fn remove_hooks_from_settings(
    settings_path: String,
    hook_events: Vec<String>,
) -> InstallResult {
    // Read existing settings
    let existing_content = match fs::read_to_string(&settings_path) {
        Ok(c) => c,
        Err(e) => {
            return InstallResult {
                success: false,
                message: String::new(),
                error: Some(format!("Failed to read settings: {}", e)),
            };
        }
    };

    let mut settings: Value = match serde_json::from_str(&existing_content) {
        Ok(v) => v,
        Err(e) => {
            return InstallResult {
                success: false,
                message: String::new(),
                error: Some(format!("Failed to parse settings: {}", e)),
            };
        }
    };

    // Remove specified hook events
    if let Some(settings_obj) = settings.as_object_mut() {
        if let Some(hooks) = settings_obj.get_mut("hooks") {
            if let Some(hooks_obj) = hooks.as_object_mut() {
                for event in hook_events {
                    hooks_obj.remove(&event);
                }
            }
        }
    }

    // Write back to file
    let pretty_json = match serde_json::to_string_pretty(&settings) {
        Ok(s) => s,
        Err(e) => {
            return InstallResult {
                success: false,
                message: String::new(),
                error: Some(format!("Failed to serialize settings: {}", e)),
            };
        }
    };

    match fs::write(&settings_path, pretty_json) {
        Ok(_) => InstallResult {
            success: true,
            message: "Hooks removed successfully".to_string(),
            error: None,
        },
        Err(e) => InstallResult {
            success: false,
            message: String::new(),
            error: Some(format!("Failed to write settings: {}", e)),
        },
    }
}

/// Show file in Finder (macOS) or File Explorer (Windows/Linux)
#[tauri::command]
pub fn show_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        // Try to use xdg-open to open the parent directory
        let parent = std::path::Path::new(&path)
            .parent()
            .ok_or("Failed to get parent directory")?;
        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Open directory in file manager
#[tauri::command]
pub fn open_directory(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Play a system sound by name
#[tauri::command]
pub fn play_sound(sound_name: String) -> Result<(), String> {
    use std::process::Command;

    #[cfg(target_os = "macos")]
    {
        let sound_path = format!("/System/Library/Sounds/{}.aiff", sound_name);
        Command::new("afplay")
            .arg(&sound_path)
            .spawn()
            .map_err(|e| format!("Failed to play sound: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        // Windows system sounds are in C:\Windows\Media
        // Map common sound names to Windows equivalents
        let windows_sound = match sound_name.to_lowercase().as_str() {
            "glass" | "ping" | "pop" => "Windows Notify System Generic.wav",
            "basso" | "funk" => "Windows Critical Stop.wav",
            "blow" | "bottle" => "Windows Balloon.wav",
            "frog" => "Windows Ringin.wav",
            "hero" => "Windows Logon.wav",
            "morse" => "Windows Notify Messaging.wav",
            "purr" => "Windows Proximity Notification.wav",
            "sosumi" => "Windows Exclamation.wav",
            "submarine" => "Windows Notify Calendar.wav",
            "tink" => "Windows Navigation Start.wav",
            _ => "Windows Notify System Generic.wav",
        };
        let sound_path = format!("C:\\Windows\\Media\\{}", windows_sound);

        // Use PowerShell to play the sound
        Command::new("powershell")
            .args(["-Command", &format!("(New-Object Media.SoundPlayer '{}').PlaySync()", sound_path)])
            .spawn()
            .map_err(|e| format!("Failed to play sound: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try paplay (PulseAudio) or aplay (ALSA)
        let result = Command::new("paplay")
            .arg(format!("/usr/share/sounds/freedesktop/stereo/complete.oga"))
            .spawn();

        if result.is_err() {
            Command::new("aplay")
                .arg("/usr/share/sounds/alsa/Front_Center.wav")
                .spawn()
                .map_err(|e| format!("Failed to play sound: {}", e))?;
        }
    }

    Ok(())
}

/// Get the resource directory path for templates
#[tauri::command]
pub fn get_resource_path(app: AppHandle, relative_path: String) -> Result<String, String> {
    // In development, use the source directory
    #[cfg(debug_assertions)]
    {
        // Try current_dir/public first (if running from src-tauri)
        let dev_path = std::env::current_dir()
            .map_err(|e| e.to_string())?
            .join("public")
            .join(&relative_path);

        if dev_path.exists() {
            return Ok(dev_path.to_string_lossy().to_string());
        }

        // Try parent/public (if running from src-tauri, templates are in ../public)
        let parent_path = std::env::current_dir()
            .map_err(|e| e.to_string())?
            .parent()
            .map(|p| p.join("public").join(&relative_path));

        if let Some(path) = parent_path {
            if path.exists() {
                return Ok(path.to_string_lossy().to_string());
            }
        }
    }

    // In production, use the resource directory
    let resource_path = app.path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join(&relative_path);

    Ok(resource_path.to_string_lossy().to_string())
}
