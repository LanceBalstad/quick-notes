use base64::{engine::general_purpose, Engine as _};
use reqwest::Client;
use serde::Deserialize;
use tauri::AppHandle;
use tauri_plugin_keyring::KeyringExt;

const SERVICE: &str = "quick-notes";
const ACCOUNT: &str = "azure_devops_pat";

#[derive(Deserialize)]
struct WiqlWorkItem {
    id: i32,
}

#[derive(Deserialize)]
struct WiqlResponse {
    #[serde(rename = "workItems")]
    work_items: Vec<WiqlWorkItem>,
}

// Helper function to build the Basic Auth header for PAT
pub fn basic_auth_header_for_pat(pat: &str) -> String {
    let to_encode = format!(":{}", pat);
    let encoded = general_purpose::STANDARD.encode(to_encode.as_bytes());
    format!("Basic {}", encoded)
}

pub fn extract_item_ids(body: &str) -> Result<Vec<i32>, String> {
    let parsed: WiqlResponse = serde_json::from_str(body).map_err(|e| e.to_string())?;

    Ok(parsed.work_items.into_iter().map(|w| w.id).collect())
}

pub fn get_pat(app: &AppHandle) -> Result<String, String> {
    app.keyring()
        .get_password(SERVICE, ACCOUNT)
        .map_err(|_| "Failed to access keychain".to_string())?
        .ok_or("No PAT stored".to_string())
}

pub async fn call_get(endpoint: &str, app: &AppHandle) -> Result<String, String> {
    let pat = get_pat(&app)?;

    let auth = basic_auth_header_for_pat(&pat);

    let client = Client::new();

    let res = client
        .get(endpoint)
        .header("Authorization", auth)
        .send()
        .await
        .map_err(|e| format!("Read error: {}", e))?;

    res.text()
        .await
        .map_err(|e| format!("Read body error: {}", e))
}

pub async fn call_post(endpoint: &str, body: &str, app: &AppHandle) -> Result<String, String> {
    let pat = get_pat(&app)?;

    let auth = basic_auth_header_for_pat(&pat);

    let client = Client::new();

    let res = client
        .post(endpoint)
        .header("Authorization", auth)
        .header("Content-Type", "application/json")
        .body(body.to_string())
        .send()
        .await
        .map_err(|e| format!("Read error: {}", e))?;

    res.text()
        .await
        .map_err(|e| format!("Read body error: {}", e))
}

// Helper function to run WIQL query
// Used with any query for work orders
// AND used for validating PAT since the only api calls we have authorization to use are work order reads
pub async fn call_wiql_query(wiql: &str, app: &AppHandle) -> Result<String, String> {
    let pat = get_pat(&app)?;

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
