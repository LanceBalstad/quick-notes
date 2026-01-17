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

export const getActiveNotesAzureIds = async (): Promise<(number)[]> => {
  const activeAzureNotes = await db.notes.filter(note => !note.softDeleted && note.azureId !== undefined).toArray();
  return activeAzureNotes.map(n => n.azureId!);
};

export const getSoftDeletedNotesAzureIds = async (): Promise<(number)[]> => {
  const activeAzureNotes = await db.notes.filter(note => note.softDeleted && note.azureId !== undefined).toArray();
  return activeAzureNotes.map(n => n.azureId!);
};

export const getActiveNotes = async (): Promise<Note[]> => {
  return await db.notes.filter(note => note.softDeleted === false).toArray();
};

export const getInactiveNotes = async (): Promise<Note[]> => {
  return await db.notes.filter(note => note.softDeleted === true).toArray();
};

export const isCurrentNameUnique = async (currentId: number, title: string): Promise<boolean> => {
  const count = await db.notes.where('title').equals(title).and(note => note.id !== currentId && note.softDeleted === false).first();
  return count === undefined;
}

// Update
export const updateNote = async (id: number, updates: Partial<Note>) => {
  return await db.notes.update(id, updates);
};

export const updateNoteByNoteId = async (noteId: string, updates: Partial<Note>) => {
  await db.notes.where('noteId').equals(noteId).modify(updates);
};

export const recoverNote = async (id: number) => {
  return await db.notes.update(id, { softDeleted: false });
}

// Delete
export const deleteNote = async (id: number) => {
  return await db.notes.delete(id);
};

export const softDeleteNote = async (id: number) => {
  return await db.notes.update(id, { softDeleted: true });
}

export const softDeleteNotesByAzureIds = async (azureId: number) => {
  const notes = db.notes.where('azureId').equals(azureId).toArray();

  const noteIds = (await notes).map((n) =>n.id!).filter(Boolean);

  await db.notes.where('azureId').equals(azureId).modify({ softDeleted: true });

  return noteIds;
}

export const hardDeleteNote = async (id: number) => {
  return await db.notes.delete(id);
}

