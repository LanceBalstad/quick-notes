// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

mod commands;
use commands::azure_auth::login_to_azure;
use commands::devops_api::{devops_get_users_work_items_pat, devops_get_work_item_pat};
use commands::devops_pat::{
    delete_devops_pat, get_devops_pat, has_devops_pat, save_devops_org_project, store_devops_pat,
};
use commands::devops_sync::{is_devops_note_finished, sync_notes_with_devops};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_keyring::init())
        .invoke_handler(tauri::generate_handler![
            login_to_azure,
            store_devops_pat,
            get_devops_pat,
            delete_devops_pat,
            devops_get_work_item_pat,
            devops_get_users_work_items_pat,
            sync_notes_with_devops,
            has_devops_pat,
            is_devops_note_finished,
            save_devops_org_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
