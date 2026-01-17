use crate::commands::devops_api::devops_get_users_work_items_pat;
use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle};

#[derive(Deserialize)]
struct DevOpsWorkItemsResponse {
    value: Vec<DevOpsWorkItem>,
}

#[derive(Deserialize)]
struct DevOpsWorkItem {
    id: i32,
    fields: DevOpsFields,
}

#[derive(Deserialize)]
pub struct DevOpsFields {
    #[serde(rename = "System.Title")]
    pub title: String,

    #[serde(rename = "Microsoft.VSTS.Common.ClosedDate")]
    pub closed_date: Option<String>,
}

#[derive(Serialize)]
pub struct SyncInstruction {
    pub to_create: Vec<DevOpsCreateNoteReq>,
    pub to_delete: Vec<DevOpsDeleteNoteReq>, // azureIds of notes to delete
}

#[derive(Serialize)]
pub struct DevOpsCreateNoteReq {
    pub azure_id: i32,
    pub title: String,
}

#[derive(Serialize)]
pub struct DevOpsDeleteNoteReq {
    pub azure_id: i32,
}

#[command]
pub async fn sync_notes_with_devops(
    app: AppHandle,
    existing_notes_azure_ids: Vec<i32>,
    existing_trash_azure_ids: Vec<i32>,
) -> Result<SyncInstruction, String> {
    let devops_notes_json = devops_get_users_work_items_pat(app).await?;

    let devops_work_items_response: DevOpsWorkItemsResponse =
        serde_json::from_str(&devops_notes_json).map_err(|e| e.to_string())?;

    let devops_notes = devops_work_items_response.value;

    let devops_work_item_ids: std::collections::HashSet<i32> =
        devops_notes.iter().map(|w| w.id).collect();

    // get notes to create
    let to_create: Vec<DevOpsCreateNoteReq> = devops_notes
        .iter()
        .filter(|w| {
            !existing_notes_azure_ids.contains(&w.id)
                && !existing_trash_azure_ids.contains(&w.id)
                && w.fields.closed_date.is_none()
        })
        .map(|w| DevOpsCreateNoteReq {
            azure_id: w.id,
            title: w.fields.title.clone(),
        })
        .collect();

    // Get Notes to delete
    let closed_devops_ids: std::collections::HashSet<i32> = devops_notes
        .iter()
        .filter(|w| w.fields.closed_date.is_some())
        .map(|w| w.id)
        .collect();
    let missing_devops_ids: std::collections::HashSet<i32> = existing_notes_azure_ids
        .iter()
        .filter(|id| !devops_work_item_ids.contains(id))
        .copied()
        .collect();
    let to_delete: Vec<DevOpsDeleteNoteReq> = closed_devops_ids
        .union(&missing_devops_ids)
        .filter(|id| !existing_trash_azure_ids.contains(id))
        .map(|id| DevOpsDeleteNoteReq { azure_id: *id })
        .collect();

    Ok(SyncInstruction {
        to_create,
        to_delete,
    })
}
