import "./NavBar.css";
import { Note } from "../../db/Services/NotesService";
import { useNavigate } from "react-router-dom";

interface NavBarProps {
  // Save logic is in the NotePage component to grab body value
  onSave: () => void;
  notes: Note[];
  onOpenNote: (noteId?: number) => void;
  title: string;
  setTitle: (title: string) => void;
  onSoftDelete: () => void;
}

const NavBar = ({
  onSave,
  notes,
  onOpenNote,
  title,
  setTitle,
  onSoftDelete,
}: NavBarProps) => {
  const navigate = useNavigate();

  const navToSyncAzurePage = () => {
    navigate("/sync-azure");
  };

  const navToThirdPartyNotesPage = () => {
    navigate("/third-party-notes");
  };

  return (
    <>
      <div className="navbar">
        <button className="fileButton">File</button>
        <button className="editButton">edit</button>
        <button className="saveButton" onClick={() => onSave()}>
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
              {note.title || ""}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={title || ""}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled..."
          // onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
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
      </div>
    </>
  );
};

export default NavBar;
