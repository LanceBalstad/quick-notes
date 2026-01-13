import { db, NoteNotification as NoteNotificationType } from '../QuickNotesDB';

// Re-export Note type so other files can use it
export type NoteNotification = NoteNotificationType;

// Create
export const addNotification = async (notification: Omit<NoteNotification, 'id'>) => {
  return await db.notifications.add({...notification});
};

// Read
export const getNotification = async (id: number): Promise<NoteNotification | undefined> => {
  return await db.notifications.get(id);
};

export const getAllNotifications = async (): Promise<NoteNotification[]> => {
  return await db.notifications.toArray();
};

export const getNotificationsByNoteId = async (noteId: number): Promise<(NoteNotification[])> => {
  return await db.notifications.filter(notif => notif.noteId === noteId).toArray();
}

// Update
export const readNotification = async (id: number) => {
  return await db.notifications.update(id, { isRead: true });
};

// Delete
export const deleteNotification = async (id: number) => {
  return await db.notifications.delete(id);
};

export const deleteNotificationsByNoteIds = async (noteIds: number[]) => {
  if (!noteIds.length) return;

  await db.notifications
    .where("noteId")
    .anyOf(noteIds)
    .delete();
};
