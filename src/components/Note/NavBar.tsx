import React from "react";
import "./NavBar.css";
import { Note } from "../../db/Services/NotesService";

interface NavBarProps {
  // Save logic is in the NotePage component to grab body value
  onSave: () => void;
  notes: Note[];
  onOpenNote: (noteId?: number) => void;
}

const NavBar = ({ onSave, notes, onOpenNote }: NavBarProps) => {
  return (
    <>
      <div className="navbar">
        <button className="fileButton">File</button>
        <button className="editButton">edit</button>
        <button className="saveButton" onClick={onSave}>
          Save
        </button>
        <select
          title="Open"
          onChange={(e) =>
            onOpenNote(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">New Note</option>
          {notes.map((note) => (
            <option key={note.id} value={note.id}>
              {note.title || "Untitled"}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default NavBar;
