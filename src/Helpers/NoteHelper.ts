import { addNote, softDeleteNotesByAzureIds, getNote, softDeleteNote, recoverNote, hardDeleteNote } from "../db/Services/NotesService";
import { addNotification, deleteNotification, deleteNotificationsByNoteIds } from "../db/Services/NotificationsService";
import { NotificationType, Note } from "../db/QuickNotesDB";
import { deleteNotificationsForNotes } from "./NotificationHelper";

export async function addNoteWithNotification(
  note: Omit<Note, "id" | "noteId">,
) {
  // The noteID is generated on creation so we have to create the note first
  // and then get the note to grabs its noteID
  const dbId = await addNote(note);

  const savedNote = await getNote(dbId);
  if (!savedNote) throw new Error("Note not found after adding");

  await addNotification({
    noteId: savedNote.id,
    notificationType: "NOTE_CREATED_BY_SYNC",
    isImportant: false,
    createdAt: new Date(),
    isRead: false,
  });

  return savedNote;
}

export async function softDeleteNoteWithNotification(
  id: number,
  type: NotificationType
) {
  await softDeleteNote(id);

  await addNotification({
    noteId: id,
    notificationType: type,
    isImportant: false,
    createdAt: new Date(),
    isRead: false,
  });
}

export async function softDeleteNotesWithNotificationUsingAzureID(
  azureId: number,
) {
  await softDeleteNotesByAzureIds(azureId);

  await addNotification({
    notificationType: "NOTE_SENT_TO_TRASH_BY_SYNC",
    isImportant: false,
    createdAt: new Date(),
    isRead: false,
  });
}

// when a note is recovered, it should lose its deleted notification
export async function recoverNoteNoteWithNotification(
  id: number,
) {
  await deleteNotificationsByNoteIds([id]);

  await recoverNote(id);
}

// when a note is hard deleted, all notifications should be deleted as well
export async function hardDeleteNotesWithNotification(
  id: number,
) {
  await deleteNotificationsByNoteIds([id]);
  
  await hardDeleteNote(id);
}