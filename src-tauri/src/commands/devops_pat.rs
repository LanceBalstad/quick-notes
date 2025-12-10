use crate::commands::devops_api::run_wiql_query;
use base64::{engine::general_purpose, Engine as _};
use tauri::{command, AppHandle};
use tauri_plugin_keyring::KeyringExt;

const SERVICE: &str = "quick-notes";
const ACCOUNT: &str = "azure_devops_pat";

// Helper function to build the Basic Auth header for PAT
pub fn basic_auth_header_for_pat(pat: &str) -> String {
    let to_encode = format!(":{}", pat);
    let encoded = general_purpose::STANDARD.encode(to_encode.as_bytes());
    format!("Basic {}", encoded)
}

async fn validate_pat(pat: &str) -> Result<(), String> {
    let wiql = "Select [System.Id] From WorkItems";

    run_wiql_query(pat, wiql).await.map(|_| ())
}

#[command]
pub async fn store_devops_pat(app: AppHandle, pat: String) -> Result<String, String> {
    if pat.trim().is_empty() {
        return Err("PAT cannot be empty".into());
    }

    validate_pat(&pat).await?;

    app.keyring()
        .set_password(SERVICE, ACCOUNT, &pat)
        .map_err(|e| format!("Failed to store PAT: {}", e))?;

    Ok("PAT stored successfully".into())
}

#[command]
pub async fn get_devops_pat(app: AppHandle) -> Result<Option<String>, String> {
    match app.keyring().get_password(SERVICE, ACCOUNT) {
        Ok(p) => Ok(p),
        Err(e) => {
            let msg = e.to_string();
            if msg.contains("No entry") || msg.contains("not found") {
                Ok(None)
            } else {
                Err(format!("Failed to read PAT: {}", e))
            }
        }
    }
}

#[command]
pub async fn delete_devops_pat(app: AppHandle) -> Result<String, String> {
    match app.keyring().delete_password(SERVICE, ACCOUNT) {
        Ok(_) => Ok("PAT deleted successfully".into()),
        Err(e) => {
            let msg = e.to_string();
            if msg.contains("No entry") || msg.contains("not found") {
                Err("PAT not found".into())
            } else {
                Err(format!("Failed to delete PAT: {}", e))
            }
        }
    }
}
