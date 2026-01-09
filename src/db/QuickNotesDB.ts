import Dexie, { Table } from 'dexie';

export interface Note {
  id?: number;
  noteId?: string;
  azureId?: number;
  title: string;
  content?: string;
  createdAt: Date;
  lastSyncedAt?: Date;
  lastSavedAt?: Date;
  softDeleted: boolean;
}

export interface AzureUser {
  id?: number;
  azureId?: string;
  createdAt: Date;
}

export interface Notification {
  id?: number;
  noteId?: number;
  notificationType: NotificationType;
  isImportant: boolean;
  createdAt: Date;
  isRead: boolean;
}

export type NotificationType = 
  | 'NOTE_CREATED_BY_SYNC'
  | 'NOTE_SENT_TO_TRASH_BY_SYNC'
  | 'NOTE_SENT_TO_TRASH_BY_USER'
  | 'NOTE_DELETED_SOON';

export class QuickNotesDB extends Dexie {
  notes!: Table<Note>;
  azureUsers!: Table<AzureUser>;
  notifications!: Table<Notification>;

  constructor() {
    super('QuickNotesDB');
    this.version(1).stores({
      notes: '++id, &noteId, azureId, title, createdAt', // indexed fields
      azureUsers: '++id, azureId, createdAt',
      notifications: '++id, noteId, createdAt, isRead',
    });
  }
}

export const db = new QuickNotesDB();
