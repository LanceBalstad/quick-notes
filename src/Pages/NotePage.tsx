import React, { useEffect } from "react";
import NavBar from "../components/Note/NavBar";
import Body from "../components/Note/Body";
import {
  addNote,
  getNotes,
  updateNote,
  getNote,
  isCurrentNameUnique,
} from "../db/Services/NotesService";
import { Note } from "../db/Services/NotesService";

function NotePage() {
  const [body, setBody] = React.useState("");
  const [noteList, setNoteList] = React.useState<Note[]>([]);
  const [currentNoteId, setCurrentNoteId] = React.useState<number | null>(null);
  const [title, setTitle] = React.useState("");

  const fetchNotes = async () => {
    const notes = await getNotes();
    setNoteList(notes);
  };

  useEffect(() => {
    fetchNotes();
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

  return (
    <>
      <NavBar
        onSave={handleSave}
        notes={noteList}
        onOpenNote={handleOpenNote}
        title={title}
        setTitle={setTitle}
      />
      <Body body={body} setBody={setBody} />
    </>
  );
}

export default NotePage;
