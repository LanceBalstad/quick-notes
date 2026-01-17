import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { getActiveNotesAzureIds } from "../../db/Services/NotesService";
import {
  addNoteWithNotification,
  softDeleteNotesWithNotificationUsingAzureId,
} from "../../Helpers/NoteHelper";

const ThirdPartyNotes = () => {
  const navigate = useNavigate();

  const navToRecentNote = () => {
    navigate("/");
  };

  type NoteToCreate = {
    azure_id: number;
    title: string;
  };

  type NoteToDelete = {
    azure_id: number;
  };

  type SyncRequest = {
    to_create: NoteToCreate[];
    to_delete: NoteToDelete[];
  };

  async function getDevopsWorkItems() {
    const workItem = await invoke("devops_get_users_work_items_pat");
    console.log("DevOps Work ids item:", workItem);
  }

  async function syncDevopsNotes() {
    const quickNotes = await getActiveNotesAzureIds();
    const syncResult = await invoke<SyncRequest>("sync_notes_with_devops", {
      existingAzureIds: quickNotes,
    });

    for (const note of syncResult.to_create) {
      await addNoteWithNotification({
        title: note.title,
        azureId: note.azure_id,
        createdAt: new Date(),
        softDeleted: false,
      });
    }

    for (const note of syncResult.to_delete) {
      await softDeleteNotesWithNotificationUsingAzureId(note.azure_id);
    }
  }

  return (
    <>
      <div>Third Party Notes</div>
      <button className="backButton" onClick={() => navToRecentNote()}>
        Back
      </button>
      <button
        className="getuserWorkItemsTest"
        onClick={() => getDevopsWorkItems()}
      >
        Get Devops Users Work Items
      </button>
      <button className="syncDevopsNotes" onClick={() => syncDevopsNotes()}>
        Sync Devops Notes
      </button>
    </>
  );
};

export default ThirdPartyNotes;
