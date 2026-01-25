import React, { useEffect, useRef, useContext } from "react";
import NavBar from "../components/Note/NavBar";
import Body from "../components/Note/Body";
import { invoke } from "@tauri-apps/api/core";
import {
  Note,
  addNote,
  getActiveNotes,
  updateNote,
  getNote,
  isCurrentNameUnique,
  getInactiveNotes,
  getActiveNotesAzureIds,
  getSoftDeletedNotesAzureIds,
} from "../db/Services/NotesService";
import { getDeletedSyncedNotes } from "../db/Services/HardDeletedSyncedNotesService";
import {
  getThirdPartyAccount,
  updateLastSyncedAtDate,
} from "../db/Services/ThirdPartyAccountService";
import {
  softDeleteNoteWithNotification,
  recoverNoteWithNotification,
  hardDeleteNotesWithNotification,
  addNoteWithNotification,
  softDeleteNotesWithNotificationUsingAzureId,
} from "../Helpers/NoteHelper";
import { ConfirmModalContext } from "../App";

function NotePage() {
  const confirmModal = useContext(ConfirmModalContext);

  const [body, setBody] = React.useState("");
  const [hasUserEdited, setHasUserEdited] = React.useState(false);
  const [noteList, setNoteList] = React.useState<Note[]>([]);
  const [currentNoteId, setCurrentNoteId] = React.useState<number | null>(null);
  const [title, setTitle] = React.useState("");
  const [trashList, setTrashList] = React.useState<Note[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);

  const currentNote = noteList.find((note) => note.id === currentNoteId);

  const fetchNotes = async () => {
    const notes = await getActiveNotes();
    setNoteList(notes);
  };

  const fetchTrashNotes = async () => {
    const notes = await getInactiveNotes();
    setTrashList(notes);
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

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    fetchTrashNotes();
  }, []);

  // auto-save
  useEffect(() => {
    if (!currentNoteId || !hasUserEdited) return;

    const timeout = setTimeout(async () => {
      try {
        setIsSaving(true);
        await handleSave(false);
      } catch (error) {
        console.error("Error auto-saving note:", error);
        alert("Failed to auto-save note. Please try to save manually.");
      } finally {
        setIsSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [body, hasUserEdited, currentNoteId]);

  // auto-sync
  useEffect(() => {
    handleSync();

    const interval = setInterval(() => {
      handleSync().catch((error) => {
        console.error("Error auto-syncing note:", error);
      });
    }, 30000);
    return () => clearTimeout(interval);
  }, []);

  // prevents handleSync from being called if it is already running.
  // A useState would cause rerenders. useRef is better to use when the const is not a UI state
  const isSyncingRef = useRef(false);

  const handleSync = async () => {
    if (isSyncingRef.current) {
      console.log("Skipping auto-sync since sync is already running");
      return;
    }

    isSyncingRef.current = true;

    try {
      setIsSyncing(true);

      const existingNoteIdList = await getActiveNotesAzureIds();
      const existingTrashIdList = await getSoftDeletedNotesAzureIds();
      const hardDeletedThirdPartyIds = Array.from(
        await getDeletedSyncedNotes(),
      );

      const syncResult = await invoke<SyncRequest>("sync_notes_with_devops", {
        existingNotesAzureIds: existingNoteIdList,
        existingTrashAzureIds: existingTrashIdList,
        hardDeletedSyncedNotesAzureIds: hardDeletedThirdPartyIds,
      });

      for (const note of syncResult.to_create) {
        // if the note to be created is NOT in the HardDeletedSyncedNotes, existingTrashIdList, or hardDeletedThirdPartyIds, then create it
        await addNoteWithNotification({
          title: note.title,
          azureId: note.azure_id,
          createdAt: new Date(),
          lastSavedAt: new Date(),
          softDeleted: false,
        });
      }

      // if the note is (closed, or not in azure anymore) AND the note currently exists in the existingNoteIdList, send it to the trash
      for (const note of syncResult.to_delete) {
        await softDeleteNotesWithNotificationUsingAzureId(note.azure_id);
      }

      // refresh note lists
      await fetchNotes();
      await fetchTrashNotes();

      // will update lastSyncedDate IF ThirdPartyAccount exists
      const newLastSyncedAt = await updateLastSyncedAtDate();
      setLastSyncedAt(newLastSyncedAt ?? null);
    } catch (err) {
      console.error("Sync Failed:", err);
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  };

  const handleSave = async (saveTitle: boolean = true) => {
    const isUniqueName = await isCurrentNameUnique(currentNoteId || -1, title);
    if (title.trim() === "" && saveTitle) {
      alert("Note title cannot be empty!");
      return;
    }
    if (!isUniqueName && saveTitle) {
      alert("Note title must be unique!");
      return;
    }
    if (currentNoteId) {
      await updateNote(currentNoteId, {
        ...(saveTitle ? { title: title } : {}),
        content: body,
        lastSavedAt: new Date(),
      });
    } else {
      const newId = await addNote({
        title: title,
        content: body,
        createdAt: new Date(),
        lastSavedAt: new Date(),
        softDeleted: false,
      });

      setCurrentNoteId(Number(newId));
    }

    await fetchNotes();
  };

  const handleOpenNote = async (noteId?: number) => {
    if (!noteId) {
      setBody("");
      setCurrentNoteId(null);
      setTitle("");

      setHasUserEdited(false);
      return;
    }
    const note = await getNote(noteId);
    if (note) {
      setCurrentNoteId(note.id || null);
      setBody(note.content || "");
      setTitle(note.title.trim() || "");

      setHasUserEdited(false);
    }
  };

  const handleSoftDelete = async () => {
    if (currentNoteId) {
      await softDeleteNoteWithNotification(
        currentNoteId,
        "NOTE_SENT_TO_TRASH_BY_USER",
      );
      await fetchNotes();
      await fetchTrashNotes();

      handleOpenNote(currentNoteId);
    }
  };

  const handleRecoverNote = async (noteId?: number) => {
    if (noteId) {
      const isNoteFinished = await handleIsDevopsNotesFinished(noteId);

      if (isNoteFinished) {
        confirmModal?.showConfirm(
          "Create an Unlinked Copy?",
          'This note is linked to a complete Azure work item. \nRevert the work item back to "Active" or click Confirm to create an unlinked copy.' +
            "\n(The copy won't follow the linked work item's status)",
          async () => {
            const linkedNote = await getNote(noteId);

            if (linkedNote) {
              const newId = await addNote({
                title: "(COPY): " + linkedNote.title,
                content: linkedNote.content,
                createdAt: linkedNote.createdAt,
                lastSavedAt: linkedNote.lastSavedAt,
                softDeleted: false,
              });

              fetchNotes();
              handleOpenNote(Number(newId));
            }
          },
        );
      } else {
        await recoverNoteWithNotification(noteId);
        await fetchNotes();
        await fetchTrashNotes();
        handleOpenNote(noteId);
      }
    }
  };

  const handleHardDelete = async (noteId?: number) => {
    if (noteId) {
      await hardDeleteNotesWithNotification(noteId);
      await fetchNotes();
      await fetchTrashNotes();

      handleOpenNote();
    }
  };

  const handleIsDevopsNotesFinished = async (
    noteId?: number,
  ): Promise<boolean> => {
    if (noteId === undefined) {
      return false; // if noteId does not exist, return false. No note synced
    }

    const note = await getNote(noteId);

    if (!note || note.azureId === undefined) {
      return false; // if note or azureId does not exist, return false. No note synced
    }

    // return true if note in azure is either completed or it does not exists
    return await invoke<boolean>("is_devops_note_finished", {
      id: note.azureId,
    });
  };

  return (
    <>
      <div className="note-page">
        <div className="navbar-wrapper">
          <NavBar
            onSave={handleSave}
            notes={noteList}
            onOpenNote={handleOpenNote}
            title={title}
            setTitle={setTitle}
            onSoftDelete={handleSoftDelete}
            trashList={trashList}
            lastSavedAt={currentNote?.lastSavedAt}
            isDeleted={currentNoteId != undefined && !currentNote}
            onHardDelete={handleHardDelete}
            onRecoverNote={handleRecoverNote}
            onSync={handleSync}
            lastSyncedAt={lastSyncedAt ?? undefined}
            isSyncing={isSyncing}
          />
        </div>
        <Body
          body={body}
          setBody={setBody}
          onSave={handleSave}
          setHasUserEdited={setHasUserEdited}
          isDeleted={currentNoteId != undefined && !currentNote}
        />
      </div>
    </>
  );
}

export default NotePage;
