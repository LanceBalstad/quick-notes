import { useState, useEffect } from "react";
import { Note, getNotes } from "../db/NotesService";

const NotesList = () => {
  const [notes, setNotes] = useState<Note[]>([]); // <-- explicitly type state

  useEffect(() => {
    getNotes().then(setNotes); // now TypeScript knows setNotes accepts Note[]
  }, []);

  return (
    <div>
      {notes.map((n) => (
        <div key={n.id}>{n.title}</div>
      ))}
    </div>
  );
};
