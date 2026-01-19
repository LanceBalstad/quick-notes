import { getAllNotifications, NoteNotification, deleteNotificationsByNoteIds } from "../db/Services/NotificationsService";
import { getNote } from "../db/Services/NotesService";
import { Note, NotificationType } from "../db/QuickNotesDB";

export function formatNotification(
  notificationType: NotificationType,
  noteId?: number
): string {
  if (noteId){
    switch (notificationType) {
      case "NOTE_CREATED_BY_SYNC":
        return `Note was created by sync process`;

      case "NOTE_SENT_TO_TRASH_BY_SYNC":
        return `Note was moved to trash by sync process`;

      case "NOTE_SENT_TO_TRASH_BY_USER":
          return `Note was moved to trash manually`;

      case "NOTE_DELETED_SOON":
          return `Note will be permanently deleted soon`;

      default:
        return 'You have a new notification';
    }
  }
  return "";
}

export const checkNotificationsForNotes = async (notes: Note[]): Promise<boolean> => {
  if (!notes.length) return false;

  const noteIds = notes
    .map((n) => n.id)
    .filter((id): id is number => id !== undefined);

  const notifications = await getAllNotifications();

  if (!notifications.length) return false;

  const ans = notifications.some((notif) => notif.noteId !== undefined && noteIds.includes(notif.noteId));
  return ans;
};

export const deleteNotificationsForNotes = async (notes: Note[]) => {
  const noteIds = notes
    .map(n => n.id)
    .filter((id): id is number => Boolean(id));

  if (!noteIds.length) return;

  await deleteNotificationsByNoteIds(noteIds);
};
