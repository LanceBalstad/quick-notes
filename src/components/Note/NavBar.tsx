import "./NavBar.css";
import { Note } from "../../db/Services/NotesService";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface NavBarProps {
  // Save logic is in the NotePage component to grab body value
  onSave: () => void;
  notes: Note[];
  onOpenNote: (noteId?: number) => void;
  title: string;
  setTitle: (title: string) => void;
  onSoftDelete: () => void;
  trashList: Note[];
}

const NavBar = ({
  onSave,
  notes,
  onOpenNote,
  title,
  setTitle,
  onSoftDelete,
  trashList,
}: NavBarProps) => {
  const navigate = useNavigate();

  const navToSyncAzurePage = () => {
    navigate("/sync-azure");
  };

  const navToThirdPartyNotesPage = () => {
    navigate("/third-party-notes");
  };

  const [isNoteListOpen, setIsNoteListOpen] = useState(false);

  return (
    <>
      <div className="navbar">
        <button className="fileButton">File</button>
        <button className="editButton">edit</button>
        <button className="saveButton" onClick={() => onSave()}>
          Save
        </button>
        <div className="title-combo">
          <input
            type="text"
            value={title || ""}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled..."
          />

          <button className="title_dropdown_button" onClick={() => setIsNoteListOpen((d) => !d)}aria-label="Open notes">
            ▼
          </button>

          {isNoteListOpen && (
            <div className="title-dropdown">
              <div 
              className="dropdown-item" 
              onClick={() => {
                onOpenNote(undefined);
                setIsNoteListOpen(false);
              }}>
                New Note
              </div>

              {notes.map((note) => (
                <div 
                key={note.id}
                className="dropdown-item"
                onClick={() => {
                  onOpenNote(note.id);
                  setIsNoteListOpen(false);
                }}>
                  {note.title || "Untitled"}
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="deleteButton" onClick={() => onSoftDelete()}>
          Delete
        </button>
        <button
          className="syncAzureButton"
          onClick={() => navToSyncAzurePage()}
        >
          SyncAzure
        </button>
        <button
          className="azureNotesButton"
          onClick={() => navToThirdPartyNotesPage()}
        >
          AzureNotes
        </button>

        <select
          title="Trashbin"
          // onChange={(e) =>
          //   onOpenNote(e.target.value ? Number(e.target.value) : undefined)
          // }
        >
          <option value="">Trash Bin</option>
          {trashList.map((trashNote) => (
            <option key={trashNote.id} value={trashNote.id}>
              {trashNote.title || ""}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default NavBar;
