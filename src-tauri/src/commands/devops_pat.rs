use crate::commands::devops_helper::call_wiql_query;
use tauri::{command, AppHandle};
use tauri_plugin_keyring::KeyringExt;

const SERVICE: &str = "quick-notes";
const ACCOUNT: &str = "azure_devops_pat";

async fn validate_pat(app: &AppHandle) -> Result<(), String> {
    let wiql = "Select [System.Id] From WorkItems";

    call_wiql_query(wiql, app).await.map(|_| ())
}

#[command]
pub async fn store_devops_pat(app: AppHandle, pat: String) -> Result<String, String> {
    if pat.trim().is_empty() {
        return Err("PAT cannot be empty".into());
    }

    validate_pat(&app).await?;

    app.keyring()
        .set_password(SERVICE, ACCOUNT, &pat)
        .map_err(|e| format!("Failed to store PAT: {}", e))?;

    Ok("PAT stored successfully".into())
}

#[command]
pub async fn has_devops_pat(app: AppHandle) -> Result<bool, String> {
    match app.keyring().get_password(SERVICE, ACCOUNT) {
        Ok(Some(_)) => Ok(true),
        Ok(None) => Ok(false),
        Err(e) => Err(format!("Failed to read PAT: {}", e)),
    }
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
