import Dexie, { Table } from 'dexie';

export interface Note {
  id?: number;
  noteId?: string;
  azureId?: string;
  title: string;
  content?: string;
  createdAt: Date;
  lastSyncedAt?: Date;
  softDeleted: boolean;
}

export interface AzureUser {
  id?: number;
  azureId?: string;
  createdAt: Date;
}

export class QuickNotesDB extends Dexie {
  notes!: Table<Note>;
  azureUsers!: Table<AzureUser>;

  constructor() {
    super('QuickNotesDB');
    this.version(1).stores({
      notes: '++id, &noteId, azureId, title, createdAt', // indexed fields
      azureUsers: '++id, azureId, createdAt'
    });
  }
}

export const db = new QuickNotesDB();
