import Dexie, { Table } from 'dexie';

export interface Note {
  id?: number;
  title: string;
  content: string;
  createdAt: Date;
}

export class QuickNotesDB extends Dexie {
  notes!: Table<Note>;

  constructor() {
    super('QuickNotesDB');
    this.version(1).stores({
      notes: '++id, title, createdAt' // indexed fields
    });
  }
}

export const db = new QuickNotesDB();
