import React, { useEffect } from "react";
import NavBar from "../components/Note/NavBar";
import Body from "../components/Note/Body";
import {
  addNote,
  getActiveNotes,
  updateNote,
  getNote,
  isCurrentNameUnique,
  getInactiveNotes,
} from "../db/Services/NotesService";
import { Note } from "../db/Services/NotesService";

function NotePage() {
  const [body, setBody] = React.useState("");
  const [noteList, setNoteList] = React.useState<Note[]>([]);
  const [currentNoteId, setCurrentNoteId] = React.useState<number | null>(null);
  const [title, setTitle] = React.useState("");
  const [trashList, setTrashList] = React.useState<Note[]>([]);

  const fetchNotes = async () => {
    const notes = await getActiveNotes();
    setNoteList(notes);
  };

  const fetchTrashNotes = async () => {
    const notes = await getInactiveNotes();
    setTrashList(notes);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    fetchTrashNotes();
  }, []);

  const handleSave = async () => {
    const isUniqueName = await isCurrentNameUnique(currentNoteId || -1, title);
    if (title.trim() === "") {
      alert("Note title cannot be empty!");
      return;
    }
    if (!isUniqueName) {
      alert("Note title must be unique!");
      return;
    }
    if (currentNoteId) {
      await updateNote(currentNoteId, { title: title, content: body });
    } else {
      const newId = await addNote({
        title: title,
        content: body,
        createdAt: new Date(),
        softDeleted: false,
      });

      setCurrentNoteId(Number(newId));
    }

    await fetchNotes();
  };

  const handleOpenNote = async (noteId?: number) => {
    if (!noteId) {
      setBody("");
      setCurrentNoteId(null);
      setTitle("");
      return;
    }
    const note = await getNote(noteId);
    if (note) {
      setCurrentNoteId(note.id || null);
      setBody(note.content || "");
      setTitle(note.title || "");
    }
  };

  const handleSoftDelete = async () => {
    if (currentNoteId) {
      await updateNote(currentNoteId, { softDeleted: true });
      await fetchNotes();
      await fetchTrashNotes();
    }
  };

  return (
    <>
      <NavBar
        onSave={handleSave}
        notes={noteList}
        onOpenNote={handleOpenNote}
        title={title}
        setTitle={setTitle}
        onSoftDelete={handleSoftDelete}
        trashList={trashList}
      />
      <Body body={body} setBody={setBody} />
    </>
  );
}

export default NotePage;
