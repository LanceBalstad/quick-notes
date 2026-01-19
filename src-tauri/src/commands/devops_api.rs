use crate::commands::devops_helper::{call_get, call_post, call_wiql_query, extract_item_ids};
use serde::Serialize;
use tauri::{command, AppHandle};

#[derive(Serialize)]
struct WorkItemsBatchRequestBody {
    ids: Vec<i32>,
    fields: Vec<&'static str>,
}

#[command]
pub async fn devops_get_work_item_pat(app: AppHandle) -> Result<String, String> {
    let endpoint = "https://dev.azure.com/Lbalstad/Quick%20Notes/_apis/wit/workitems/1?api-version=7.2-preview.3";

    let return_body = call_get(endpoint, &app).await?;

    Ok(return_body)
}

#[command]
pub async fn devops_get_users_work_items_pat(app: AppHandle) -> Result<String, String> {
    // Get all work item ids for user with PAT
    let users_work_item_ids = devops_get_users_work_item_ids_pat(&app).await?;

    // display content of work items for each work item id
    devops_get_work_items_pat(&app, users_work_item_ids).await
}

#[command]
async fn devops_get_work_items_pat(app: &AppHandle, ids: Vec<i32>) -> Result<String, String> {
    let endpoint =
        "https://dev.azure.com/Lbalstad/Quick%20Notes/_apis/wit/workitemsbatch?api-version=7.1";

    let body = WorkItemsBatchRequestBody {
        ids: ids,
        fields: vec![
            "System.Id",
            "System.Title",
            "System.WorkItemType",
            "Microsoft.VSTS.Common.ClosedDate",
            "System.AssignedTo",
        ],
    };

    let return_body = call_post(
        endpoint,
        &serde_json::to_string(&body).map_err(|e| e.to_string())?,
        &app,
    )
    .await?;

    Ok(return_body)
}

pub async fn devops_get_users_work_item_ids_pat(app: &AppHandle) -> Result<Vec<i32>, String> {
    let wiql = "Select [System.Id] From WorkItems Where [System.AssignedTo] = @Me";

    let response_body = call_wiql_query(wiql, app).await?;

    extract_item_ids(&response_body)
}
