use crate::commands::devops_pat::basic_auth_header_for_pat;
use reqwest::Client;
use tauri::{command, AppHandle};
use tauri_plugin_keyring::KeyringExt;

const SERVICE: &str = "quick-notes";
const ACCOUNT: &str = "azure_devops_pat";

// Helper function to run WIQL query
// Used with any query for work orders
// AND used for validating PAT since the only api calls we have authorization to use are work order reads
pub async fn run_wiql_query(pat: &str, wiql: &str) -> Result<String, String> {
    let auth = basic_auth_header_for_pat(&pat);

    let client = Client::new();

    let res = client
        .post("https://dev.azure.com/Lbalstad/Quick%20Notes/_apis/wit/wiql?api-version=7.1")
        .header("Authorization", auth)
        .header("Content-Type", "application/json")
        .body(format!(r#"{{"query": "{wiql}"}}"#))
        .send()
        .await
        .map_err(|e| format!("Read error: {}", e))?;

    let status = res.status();

    if !status.is_success() {
        return Err(format!(
            "Azure DevOps returned returned an error status: {}",
            status
        ));
    }

    if status.as_u16() == 203 {
        return Err("Pat does not have permission (203)".into());
    }

    let return_body = res
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    Ok(return_body)
}

#[command]
pub async fn devops_get_work_items_pat(app: AppHandle) -> Result<String, String> {
    let pat = app
        .keyring()
        .get_password(SERVICE, ACCOUNT)
        .map_err(|_| "Failed to access keychain".to_string())?
        .ok_or("No PAT stored")?;

    let auth = basic_auth_header_for_pat(&pat);

    let client = Client::new();
    let res = client
        .get("https://dev.azure.com/Lbalstad/Quick%20Notes/_apis/wit/workitems/1?api-version=7.2-preview.3")
        .header("Authorization", auth)
        .send()
        .await
        .map_err(|e| format!("Read error: {}", e))?;

    let return_body = res
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    Ok(return_body)
}

#[command]
pub async fn devops_get_users_work_item_ids_pat(app: AppHandle) -> Result<String, String> {
    let pat = app
        .keyring()
        .get_password(SERVICE, ACCOUNT)
        .map_err(|_| "Failed to access keychain".to_string())?
        .ok_or("No PAT stored")?;

    let wiql = "Select [System.Id] From WorkItems Where [System.AssignedTo] = @Me";

    run_wiql_query(&pat, wiql).await
}
