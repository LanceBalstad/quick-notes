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

pub async fn call_wiql_query(wiql: &str, app: &AppHandle) -> Result<String, String> {
    call_wiql_query_with_pat(wiql, app, None).await
}

// Helper function to run WIQL query
// Used with any query for work orders
// AND used for validating PAT since the only api calls we have authorization to use are work order reads
pub async fn call_wiql_query_with_pat(
    wiql: &str,
    app: &AppHandle,
    pat: Option<&str>,
) -> Result<String, String> {
    let pat_to_use = if let Some(p) = pat {
        p.to_string()
    } else {
        get_pat(&app)?
    };

    let auth = basic_auth_header_for_pat(&pat_to_use);

    let client = Client::new();

    let org = get_devops_organization(&app)?;
    let project = get_devops_project(&app)?;

    let endpoint = format!(
        "https://dev.azure.com/{}/{}/_apis/wit/wiql?api-version=7.1",
        org, project
    );

    let res = client
        .post(&endpoint)
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
        return Err("Pat does not have permission (203) \nMake sure you give your PAT Work Item Read permission.".into());
    }

    let return_body = res
        .text()
        .await
        .map_err(|e| format!("Read body error: {}", e))?;

    Ok(return_body)
}

pub fn get_devops_organization(app: &AppHandle) -> Result<String, String> {
    app.keyring()
        .get_password(SERVICE, "azure_devops_org")
        .map_err(|_| "Failed to access keychain".to_string())?
        .ok_or("No organization stored".to_string())
}

pub fn get_devops_project(app: &AppHandle) -> Result<String, String> {
    app.keyring()
        .get_password(SERVICE, "azure_devops_project")
        .map_err(|_| "Failed to access keychain".to_string())?
        .ok_or("No project stored".to_string())
}
