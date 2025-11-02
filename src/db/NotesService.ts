import { db, Note as NoteType } from './QuickNotesDB';

// Re-export Note type so other files can use it
export type Note = NoteType;

// Create
export const addNote = async (note: Omit<Note, 'id'>) => {
  return await db.notes.add(note);
};

// Read
export const getNotes = async (): Promise<Note[]> => {
  return await db.notes.toArray();
};

// Update
export const updateNote = async (id: number, updates: Partial<Note>) => {
  return await db.notes.update(id, updates);
};

// Delete
export const deleteNote = async (id: number) => {
  return await db.notes.delete(id);
};

