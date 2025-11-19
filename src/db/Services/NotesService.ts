import { db, Note as NoteType } from '../QuickNotesDB';

// Re-export Note type so other files can use it
export type Note = NoteType;

// Create
export const addNote = async (note: Omit<Note, 'id' | 'noteId'>) => {
  return await db.notes.add({...note, noteId: crypto.randomUUID()});
};

// Read
export const getNote = async (id: number): Promise<Note | undefined> => {
  return await db.notes.get(id);
};

export const getNotes = async (): Promise<Note[]> => {
  return await db.notes.toArray();
};

export const getActiveNotes = async (): Promise<Note[]> => {
  return await db.notes.where('softDeleted').equals('false').toArray();
};

export const isCurrentNameUnique = async (currentId: number, title: string): Promise<boolean> => {
  const count = await db.notes.where('title').equals(title).and(note => note.id !== currentId).first();
  return count === undefined;
}

// Update
export const updateNote = async (id: number, updates: Partial<Note>) => {
  return await db.notes.update(id, updates);
};

export const updateNoteByNoteId = async (noteId: string, updates: Partial<Note>) => {
  await db.notes.where('noteId').equals(noteId).modify(updates);
};

// Delete
export const deleteNote = async (id: number) => {
  return await db.notes.delete(id);
};

