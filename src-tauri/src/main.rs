// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu};
use tauri_plugin_positioner::{Position, WindowExt};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit".to_string()).accelerator("Cmd+Q");
    let tray_menu = SystemTrayMenu::new().add_item(quit);

    let _ = fix_path_env::fix();

    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(|app, event| {
            tauri_plugin_positioner::on_tray_event(app, &event);

            match event {
                SystemTrayEvent::LeftClick { .. } => {
                    // Disabled for now
                    // let window = app.get_window("main").unwrap();
                    // let _ = window.move_window(Position::TrayCenter);
                    // if window.is_visible().unwrap() {
                    //     window.hide().unwrap();
                    // } else {
                    //     window.show().unwrap();
                    //     window.set_focus().unwrap();
                    // }
                }
                SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => {}
                },
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![
            commands::shell::shell::run_shell_script
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
