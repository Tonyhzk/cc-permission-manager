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
        let _ = path; // Suppress unused variable warning
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
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let sound_path = format!("/System/Library/Sounds/{}.aiff", sound_name);
        Command::new("afplay")
            .arg(&sound_path)
            .spawn()
            .map_err(|e| format!("Failed to play sound: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        use rodio::{Decoder, OutputStream, Sink};
        use std::fs::File;
        use std::io::BufReader;

        let sound_path = format!("C:\\Windows\\Media\\{}.wav", sound_name);

        // Check if the sound file exists
        if !std::path::Path::new(&sound_path).exists() {
            return Err(format!("Sound file not found: {}", sound_path));
        }

        // Spawn a thread to play the sound asynchronously
        std::thread::spawn(move || {
            // Get an output stream handle
            let (_stream, stream_handle) = match OutputStream::try_default() {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Failed to get audio output stream: {}", e);
                    return;
                }
            };

            // Create a sink to play the sound
            let sink = match Sink::try_new(&stream_handle) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Failed to create audio sink: {}", e);
                    return;
                }
            };

            // Load the sound file
            let file = match File::open(&sound_path) {
                Ok(f) => f,
                Err(e) => {
                    eprintln!("Failed to open sound file: {}", e);
                    return;
                }
            };

            let source = match Decoder::new(BufReader::new(file)) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Failed to decode sound file: {}", e);
                    return;
                }
            };

            // Play the sound
            sink.append(source);
            sink.sleep_until_end();
        });
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
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

/// Result for Python detection
#[derive(Debug, Serialize, Deserialize)]
pub struct PythonCheckResult {
    pub command: String,           // "python" or "python3" or "none"
    pub found_in_path: bool,       // Whether found in PATH
    pub installation_paths: Vec<String>, // Possible installation paths found
}

/// Check which Python command is available (python or python3)
#[tauri::command]
pub fn check_python_command() -> PythonCheckResult {
    use std::process::Command;

    // First try 'python'
    let python_check = Command::new("python")
        .arg("--version")
        .output();

    if python_check.is_ok() && python_check.unwrap().status.success() {
        return PythonCheckResult {
            command: "python".to_string(),
            found_in_path: true,
            installation_paths: vec![],
        };
    }

    // Then try 'python3'
    let python3_check = Command::new("python3")
        .arg("--version")
        .output();

    if python3_check.is_ok() && python3_check.unwrap().status.success() {
        return PythonCheckResult {
            command: "python3".to_string(),
            found_in_path: true,
            installation_paths: vec![],
        };
    }

    // Neither found in PATH, search for Python installations on Windows
    #[cfg(target_os = "windows")]
    {
        let found_paths = search_python_installations();
        return PythonCheckResult {
            command: if found_paths.is_empty() { "python3".to_string() } else { "python".to_string() },
            found_in_path: false,
            installation_paths: found_paths,
        };
    }

    #[cfg(not(target_os = "windows"))]
    {
        // On non-Windows, default to 'python3'
        PythonCheckResult {
            command: "python3".to_string(),
            found_in_path: false,
            installation_paths: vec![],
        }
    }
}

/// Search for Python installations in common Windows directories
#[cfg(target_os = "windows")]
fn search_python_installations() -> Vec<String> {
    use std::path::{Path, PathBuf};
    use std::fs;

    let mut found_paths = Vec::new();

    // Helper function to check if a directory contains python.exe
    let has_python_exe = |dir: &Path| -> bool {
        dir.join("python.exe").exists()
    };

    // Helper function to search a directory for Python installations
    let search_dir = |base_dir: &str| -> Vec<PathBuf> {
        let mut results = Vec::new();

        // First check if base_dir itself has python.exe
        let base_path = Path::new(base_dir);
        if base_path.exists() && has_python_exe(base_path) {
            results.push(base_path.to_path_buf());
        }

        // Then search subdirectories
        if let Ok(entries) = fs::read_dir(base_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    // Check if this directory has python.exe
                    if has_python_exe(&path) {
                        results.push(path.clone());
                    }

                    // Also check one level deeper for patterns like Python311/
                    if let Ok(sub_entries) = fs::read_dir(&path) {
                        for sub_entry in sub_entries.flatten() {
                            let sub_path = sub_entry.path();
                            if sub_path.is_dir() && has_python_exe(&sub_path) {
                                results.push(sub_path);
                            }
                        }
                    }
                }
            }
        }

        results
    };

    // Search common installation directories
    let search_locations = vec![
        "C:\\Python39",
        "C:\\Python310",
        "C:\\Python311",
        "C:\\Python312",
        "C:\\Python313",
        "C:\\Program Files\\Python39",
        "C:\\Program Files\\Python310",
        "C:\\Program Files\\Python311",
        "C:\\Program Files\\Python312",
        "C:\\Program Files\\Python313",
        "C:\\Program Files (x86)\\Python39",
        "C:\\Program Files (x86)\\Python310",
        "C:\\Program Files (x86)\\Python311",
        "C:\\Program Files (x86)\\Python312",
        "C:\\Program Files (x86)\\Python313",
    ];

    // Check exact paths first
    for location in &search_locations {
        let path = Path::new(location);
        if path.exists() && has_python_exe(path) {
            found_paths.push(location.to_string());
        }
    }

    // Search base directories for any Python installations
    let base_dirs = vec![
        "C:\\",
        "C:\\Program Files",
        "C:\\Program Files (x86)",
    ];

    for base_dir in base_dirs {
        for path in search_dir(base_dir) {
            let path_str = path.to_string_lossy().to_string();
            if !found_paths.contains(&path_str) {
                found_paths.push(path_str);
            }
        }
    }

    // Check AppData locations
    if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
        // Microsoft Store Python
        let store_path = format!("{}\\Microsoft\\WindowsApps", local_appdata);
        if Path::new(&store_path).join("python.exe").exists() {
            // For Microsoft Store, we need to find the actual installation
            let programs_python = format!("{}\\Programs\\Python", local_appdata);
            for path in search_dir(&programs_python) {
                let path_str = path.to_string_lossy().to_string();
                if !found_paths.contains(&path_str) {
                    found_paths.push(path_str);
                }
            }
        }

        // Regular AppData Python installations
        let programs_python = format!("{}\\Programs\\Python", local_appdata);
        for path in search_dir(&programs_python) {
            let path_str = path.to_string_lossy().to_string();
            if !found_paths.contains(&path_str) {
                found_paths.push(path_str);
            }
        }
    }

    if let Ok(appdata) = std::env::var("APPDATA") {
        let python_dir = format!("{}\\Python", appdata);
        for path in search_dir(&python_dir) {
            let path_str = path.to_string_lossy().to_string();
            if !found_paths.contains(&path_str) {
                found_paths.push(path_str);
            }
        }
    }

    // Check user profile
    if let Ok(userprofile) = std::env::var("USERPROFILE") {
        let user_python = format!("{}\\AppData\\Local\\Programs\\Python", userprofile);
        for path in search_dir(&user_python) {
            let path_str = path.to_string_lossy().to_string();
            if !found_paths.contains(&path_str) {
                found_paths.push(path_str);
            }
        }
    }

    found_paths
}

/// Open system environment variables settings (Windows only)
#[tauri::command]
pub fn open_environment_variables() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // Open Environment Variables dialog
        Command::new("rundll32")
            .args(["sysdm.cpl,EditEnvironmentVariables"])
            .spawn()
            .map_err(|e| format!("Failed to open environment variables: {}", e))?;

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("This function is only available on Windows".to_string())
    }
}

/// Open macOS System Preferences for Full Disk Access
#[tauri::command]
pub fn open_macos_full_disk_access() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        // Open System Settings > Privacy & Security > Full Disk Access
        Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles")
            .spawn()
            .map_err(|e| format!("Failed to open system preferences: {}", e))?;

        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("This function is only available on macOS".to_string())
    }
}

/// Check if the app has full disk access on macOS
/// Returns true if access is granted or not applicable (non-macOS)
#[tauri::command]
pub fn check_macos_file_access(test_path: Option<String>) -> bool {
    #[cfg(target_os = "macos")]
    {
        // Try to access a protected directory to test permissions
        let path = test_path.unwrap_or_else(|| {
            // Test with user's Documents folder
            dirs::home_dir()
                .map(|home| home.join("Documents").to_string_lossy().to_string())
                .unwrap_or_else(|| "/Users".to_string())
        });

        // Try to read the directory
        match fs::read_dir(&path) {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = test_path; // Suppress unused warning
        true // Non-macOS systems don't need this check
    }
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
    let resource_dir = app.path()
        .resource_dir()
        .map_err(|e| e.to_string())?;

    // Try multiple possible locations
    let possible_paths = vec![
        resource_dir.join("public").join(&relative_path),           // Standard location
        resource_dir.join("_up_").join("public").join(&relative_path), // NSIS location
        resource_dir.join(&relative_path),                          // Direct location
    ];

    // Debug logging
    eprintln!("[DEBUG] Resource dir: {:?}", resource_dir);
    eprintln!("[DEBUG] Relative path: {}", relative_path);

    for path in &possible_paths {
        eprintln!("[DEBUG] Trying path: {:?}", path);
        if path.exists() {
            eprintln!("[DEBUG] Found at: {:?}", path);
            return Ok(path.to_string_lossy().to_string());
        }
    }

    // If not found, return error with all tried paths
    let tried_paths: Vec<String> = possible_paths
        .iter()
        .map(|p| format!("{:?}", p))
        .collect();

    Err(format!(
        "Resource not found. Tried paths:\n{}",
        tried_paths.join("\n")
    ))
}
