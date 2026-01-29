import { db, DeletedSyncedNotes as DeletedSyncedNotesType } from '../QuickNotesDB';

export type DeletedSyncedNotes = DeletedSyncedNotesType;

// Create
export const addDeletedSyncedNote = async (thirdPartyId: number) => {
  await db.deletedSyncedNotes.add({ thirdPartyId });
};

// Read
export const getDeletedSyncedNotes = async (): Promise<Set<number>> => {
  const rows = await db.deletedSyncedNotes.toArray();
  return new Set(rows.map(r => Number(r.thirdPartyId)));
};