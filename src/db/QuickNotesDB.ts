import Dexie, { Table } from 'dexie';

export interface Note {
  id?: number;
  noteId?: string;
  azureId?: number;
  title: string;
  content?: string;
  createdAt: Date;
  lastSavedAt?: Date;
  softDeleted: boolean;
}

export interface AzureUser {
  id?: number;
  azureId?: string;
  createdAt: Date;
  lastSyncedAt?: Date;
}

export interface NoteNotification {
  id?: number;
  noteId?: number;
  notificationType: NotificationType;
  isImportant: boolean;
  createdAt: Date;
  isRead: boolean;
}

// Graveyard for hard delted notes that were synced with a third party work item
//
// held here so that if a note is hard delelted, but the third pary work item still exists,
// the note will not be created again on sync
export interface DeletedSyncedNotes {
  id?: number;
  thirdPartyId: number;
}

export type NotificationType = 
  | 'NOTE_CREATED_BY_SYNC'
  | 'NOTE_SENT_TO_TRASH_BY_SYNC'
  | 'NOTE_SENT_TO_TRASH_BY_USER'
  | 'NOTE_DELETED_SOON';

export class QuickNotesDB extends Dexie {
  notes!: Table<Note>;
  azureUsers!: Table<AzureUser>;
  notifications!: Table<NoteNotification>;
  deletedSyncedNotes!: Table<DeletedSyncedNotes>;

  constructor() {
    super('QuickNotesDB');
    this.version(1).stores({
      notes: '++id, &noteId, azureId, title, createdAt', // indexed fields
      azureUsers: '++id, azureId, createdAt',
      notifications: '++id, noteId, createdAt, isRead',
      deletedSyncedNotes: '++id, thirdPartyId',
    });
  }
}

export const db = new QuickNotesDB();
