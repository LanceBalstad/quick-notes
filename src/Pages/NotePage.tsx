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
  softDeleteNote,
  hardDeleteNote,
  recoverNote,
} from "../db/Services/NotesService";
import { Note } from "../db/Services/NotesService";

function NotePage() {
  const [body, setBody] = React.useState("");
  const [hasUserEdited, setHasUserEdited] = React.useState(false);
  const [noteList, setNoteList] = React.useState<Note[]>([]);
  const [currentNoteId, setCurrentNoteId] = React.useState<number | null>(null);
  const [title, setTitle] = React.useState("");
  const [trashList, setTrashList] = React.useState<Note[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const currentNote = noteList.find((note) => note.id === currentNoteId);

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

  useEffect(() => {
    if (!currentNoteId || !hasUserEdited) return;

    const timeout = setTimeout(async () => {
      try {
        setIsSaving(true);
        await handleSave(false);
      } catch (error) {
        console.error("Error auto-saving note:", error);
        alert("Failed to auto-save note. Please try to save manually.");
      } finally {
        setIsSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [body, hasUserEdited, currentNoteId]);

  const handleSave = async (saveTitle: boolean = true) => {
    const isUniqueName = await isCurrentNameUnique(currentNoteId || -1, title);
    if (title.trim() === "" && saveTitle) {
      alert("Note title cannot be empty!");
      return;
    }
    if (!isUniqueName && saveTitle) {
      alert("Note title must be unique!");
      return;
    }
    if (currentNoteId) {
      await updateNote(currentNoteId, {
        ...(saveTitle ? { title: title } : {}),
        content: body,
        lastSavedAt: new Date(),
      });
    } else {
      const newId = await addNote({
        title: title,
        content: body,
        createdAt: new Date(),
        lastSavedAt: new Date(),
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

      setHasUserEdited(false);
      return;
    }
    const note = await getNote(noteId);
    if (note) {
      setCurrentNoteId(note.id || null);
      setBody(note.content || "");
      setTitle(note.title.trim() || "");

      setHasUserEdited(false);
    }
  };

  const handleSoftDelete = async () => {
    if (currentNoteId) {
      await softDeleteNote(currentNoteId);
      await fetchNotes();
      await fetchTrashNotes();

      handleOpenNote();
    }
  };

  const handleRecoverNote = async (noteId?: number) => {
    if (noteId) {
      await recoverNote(noteId);
      await fetchNotes();
      await fetchTrashNotes();

      handleOpenNote(noteId);
    }
  }

  const handleHardDelete = async (noteId?: number) => {
    if (noteId) {
      await hardDeleteNote(noteId);
      await fetchNotes();
      await fetchTrashNotes();

      handleOpenNote(noteId);
    }
  };

  return (
    <>
      <div className="note-page">
        <div className="navbar-wrapper">
          <NavBar
            onSave={handleSave}
            notes={noteList}
            onOpenNote={handleOpenNote}
            title={title}
            setTitle={setTitle}
            onSoftDelete={handleSoftDelete}
            trashList={trashList}
            lastSavedAt={currentNote?.lastSavedAt}
            isDeleted={currentNoteId != undefined && !currentNote}
            onHardDelete={handleHardDelete}
            onRecoverNote={handleRecoverNote}
          />
        </div>
        <Body
          body={body}
          setBody={setBody}
          onSave={handleSave}
          setHasUserEdited={setHasUserEdited}
          isDeleted={currentNoteId != undefined && !currentNote}
        />
      </div>
    </>
  );
}

export default NotePage;
