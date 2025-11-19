import React, { useEffect } from "react";
import NavBar from "../components/Note/NavBar";
import Body from "../components/Note/Body";
import {
  addNote,
  getNotes,
  updateNote,
  getNote,
} from "../db/Services/NotesService";
import { Note } from "../db/Services/NotesService";

function NotePage() {
  const [body, setBody] = React.useState("");
  const [noteList, setNoteList] = React.useState<Note[]>([]);
  const [currentNoteId, setCurrentNoteId] = React.useState<number | null>(null);

  const fetchNotes = async () => {
    const notes = await getNotes();
    setNoteList(notes);
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSave = async () => {
    if (currentNoteId) {
      await updateNote(currentNoteId, { content: body });
    } else {
      const newId = await addNote({
        title: "Untitled",
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
      return;
    }
    const note = await getNote(noteId);
    if (note) {
      setCurrentNoteId(note.id || null);
      setBody(note.content || "");
    }
  };

  return (
    <>
      <NavBar
        onSave={handleSave}
        notes={noteList}
        onOpenNote={handleOpenNote}
      />
      <Body body={body} setBody={setBody} />
    </>
  );
}

export default NotePage;
