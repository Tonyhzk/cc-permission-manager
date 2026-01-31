// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::read_config_file,
            commands::write_config_file,
            commands::get_claude_config_dir,
            commands::file_exists,
            commands::create_directory,
            commands::copy_file,
            commands::set_executable,
            commands::merge_hooks_to_settings,
            commands::remove_hooks_from_settings,
            commands::show_in_folder,
            commands::open_directory,
            commands::get_resource_path,
            commands::play_sound,
            commands::check_python_command,
            commands::open_environment_variables,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
