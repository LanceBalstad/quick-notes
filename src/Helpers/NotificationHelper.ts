// utils/notificationFormatter.ts
import { getAllNotifications, Notification, deleteNotificationsByNoteIds } from "../db/Services/NotificationsService";
import { Note } from "../db/QuickNotesDB";

export function formatNotification(
  notification: Notification,
  note?: Note
): string {
  switch (notification.notificationType) {
    case "NOTE_CREATED_BY_SYNC":
      return `Note "${note?.title ?? "Untitled"}" was created at "${note?.createdAt ?? "Unknown Time"} from Azure Devops sync"`;

    case "NOTE_SENT_TO_TRASH_BY_SYNC":
      return `Note "${note?.title ?? "Untitled"}" was deleted at "${note?.createdAt ?? "Unknown Time"} from Azure Devops sync"`;

    case "NOTE_SENT_TO_TRASH_BY_USER":
        return `Note "${note?.title ?? "Untitled"}" was deleted at "${note?.createdAt ?? "Unknown Time"} manually"`;

    case "NOTE_DELETED_SOON":
        return `Note "${note?.title ?? "Untitled"}" will be permanently deleted in "${note?.createdAt ?? "Unknown Time"} hours`;

    default:
      return "You have a new notification";
  }
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
