import "./NavBar.css";
import { Note } from "../../db/Services/NotesService";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getNotesAzureIds } from "../../db/Services/NotesService";
import {
  getNotificationsByNoteId,
  NoteNotification,
} from "../../db/Services/NotificationsService";
import {
  addNoteWithNotification,
  softDeleteNotesWithNotificationUsingAzureID,
} from "../../Helpers/NoteHelper";
import {
  checkNotificationsForNotes,
  deleteNotificationsForNotes,
  formatNotification,
} from "../../Helpers/NotificationHelper";

interface NavBarProps {
  // multiple methods, such as onSave, is in the NotePage component to grab body value
  onSave: () => void;
  notes: Note[];
  onOpenNote: (noteId?: number) => void;
  title: string;
  setTitle: (title: string) => void;
  onSoftDelete: () => void;
  trashList: Note[];
  lastSavedAt?: Date;
  isDeleted?: boolean;
  onHardDelete: (noteId?: number) => void;
  onRecoverNote: (noteId?: number) => void;
}

const NavBar = ({
  onSave,
  notes,
  onOpenNote,
  title,
  setTitle,
  onSoftDelete,
  trashList,
  lastSavedAt,
  isDeleted,
  onHardDelete,
  onRecoverNote,
}: NavBarProps) => {
  const navigate = useNavigate();

  const navToSyncAzurePage = () => {
    navigate("/sync-azure");
  };

  const navToThirdPartyNotesPage = () => {
    navigate("/third-party-notes");
  };

  const [isNoteListOpen, setIsNoteListOpen] = useState(false);

  const [isTrashListOpen, setIsTrashListOpen] = useState(false);

  const [trashHasNotifications, setTrashHasNotifications] = useState(false);

  const [noteListHasNotifications, setNoteListHasNotifications] =
    useState(false);

  const [noteNotifications, setNoteNotifications] = useState<
    Record<number, boolean>
  >({});

  const [notificationMessages, setNotificationMessages] = useState<
    Record<number, NoteNotification[]>
  >({});

  const [hoveredNoteId, setHoveredNoteId] = useState<number | null>(null);

  const titleComboRef = useRef<HTMLDivElement | null>(null);

  const trashComboRef = useRef<HTMLDivElement | null>(null);

  const NotificationIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-notification"
    >
      <rect width="18" height="18" rx="9" fill="#8D9265" />
      <path
        d="M9 6V9M9 12H9.0075"
        stroke="#0A1E1D"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const NotificationTooltip = ({
    notifications,
  }: {
    notifications: NoteNotification[];
  }) => (
    <div className="notification-tooltip">
      {notifications.map((n) => (
        <div key={n.id} className="notification-item">
          <strong>{formatNotification(n.notificationType, n.noteId)}</strong>
          <span className="notification-date">
            {n.createdAt.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      const clickedOutsideTitle =
        titleComboRef.current && !titleComboRef.current.contains(target);

      const clickedOutsideTrash =
        trashComboRef.current && !trashComboRef.current.contains(target);

      if (clickedOutsideTitle) {
        setIsNoteListOpen(false);
      }

      if (clickedOutsideTrash) {
        setIsTrashListOpen(false);
      }
    }

    if (isNoteListOpen || isTrashListOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isNoteListOpen, isTrashListOpen]);

  type NoteToCreate = {
    azure_id: number;
    title: string;
  };

  type NoteToDelete = {
    azure_id: number;
  };

  type SyncRequest = {
    to_create: NoteToCreate[];
    to_delete: NoteToDelete[];
  };

  useEffect(() => {
    const run = async () => {
      setTrashHasNotifications(await checkNotificationsForNotes(trashList));
    };

    run();
  }, [trashList]);

  useEffect(() => {
    loadNotificationsForNotes(notes);
  }, [notes]);

  useEffect(() => {
    loadNotificationsForNotes(trashList);
  }, [trashList]);

  useEffect(() => {
    if (!isTrashListOpen) {
      // dropdown just closed
      deleteNotificationsForNotes(trashList).then(() => {
        setTrashHasNotifications(false);
        loadNotificationsForNotes(trashList);
      });
    }
  }, [isTrashListOpen]);

  useEffect(() => {
    if (!isNoteListOpen) {
      deleteNotificationsForNotes(notes).then(() => {
        setNoteListHasNotifications(false);
        loadNotificationsForNotes(notes);
      });
    }
  }, [isNoteListOpen]);

  async function syncDevopsNotes() {
    const quickNotes = await getNotesAzureIds();
    const syncResult = await invoke<SyncRequest>("sync_notes_with_devops", {
      existingAzureIds: quickNotes,
    });

    for (const note of syncResult.to_create) {
      await addNoteWithNotification({
        title: note.title,
        azureId: note.azure_id,
        createdAt: new Date(),
        softDeleted: false,
      });
    }

    for (const note of syncResult.to_delete) {
      await softDeleteNotesWithNotificationUsingAzureID(note.azure_id);
    }

    // resync notifications
    setNoteListHasNotifications(await checkNotificationsForNotes(notes));
    setTrashHasNotifications(await checkNotificationsForNotes(trashList));
  }

  async function loadNotificationsForNotes(notes: Note[]) {
    const entries = await Promise.all(
      notes.map(async (note) => [
        note.id!,
        (await getNotificationsByNoteId(note.id!)).length > 0,
      ])
    );

    setNoteNotifications(Object.fromEntries(entries));
  }

  async function loadNotificationsForNote(noteId: number) {
    if (notificationMessages[noteId]) return; // already loaded

    const notifs = await getNotificationsByNoteId(noteId);
    setNotificationMessages((prev) => ({
      ...prev,
      [noteId]: notifs,
    }));
  }

  return (
    <>
      <div className="navbar">
        <button className="file-button">
          {/* file button icon path */}
          <svg
            width="36"
            height="41"
            viewBox="0 0 36 41"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="36" height="41" rx="5" fill="#193232" />
            <path
              className="file-dot"
              d="M18 22.2083C18.8284 22.2083 19.5 21.4435 19.5 20.5C19.5 19.5565 18.8284 18.7917 18 18.7917C17.1716 18.7917 16.5 19.5565 16.5 20.5C16.5 21.4435 17.1716 22.2083 18 22.2083Z"
              stroke="#A8BFBC"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              className="file-dot"
              d="M18 10.25C18.8284 10.25 19.5 9.48515 19.5 8.54167C19.5 7.59818 18.8284 6.83333 18 6.83333C17.1716 6.83333 16.5 7.59818 16.5 8.54167C16.5 9.48515 17.1716 10.25 18 10.25Z"
              stroke="#A8BFBC"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              className="file-dot"
              d="M18 34.1667C18.8284 34.1667 19.5 33.4018 19.5 32.4583C19.5 31.5148 18.8284 30.75 18 30.75C17.1716 30.75 16.5 31.5148 16.5 32.4583C16.5 33.4018 17.1716 34.1667 18 34.1667Z"
              stroke="#A8BFBC"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className={`note-list-notification ${
            noteListHasNotifications ? "visible" : ""
          }`}
        >
          {/* notification icon path */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_13_201)">
              <rect width="18" height="18" rx="9" fill="#8D9265" />
              <path
                d="M9 6V9M9 12H9.0075M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z"
                stroke="#0A1E1D"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_13_201">
                <rect width="18" height="18" rx="9" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        <div className="dropdown-button-combo" ref={titleComboRef}>
          <button
            className="dropdown-button"
            onClick={() => setIsNoteListOpen((d) => !d)}
            aria-label="Open notes"
          >
            {/* dropdown button icon path */}
            <svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M13 16.6833L6.5 10.1833L8.01667 8.66667L13 13.65L17.9833 8.66667L19.5 10.1833L13 16.6833Z" />
            </svg>
          </button>

          {isNoteListOpen && (
            <div
              className="combo-dropdown"
              onMouseLeave={() => setHoveredNoteId(null)}
            >
              <div
                className="dropdown-item"
                onClick={() => {
                  onOpenNote(undefined);
                  setIsNoteListOpen(false);
                }}
              >
                New Note
              </div>

              {notes.map((note) => (
                <div
                  key={note.id}
                  className="dropdown-item note-row"
                  onClick={() => {
                    onOpenNote(note.id);
                    setIsNoteListOpen(false);
                  }}
                >
                  <span className="note-title">{note.title || "Untitled"}</span>

                  {noteNotifications[note.id!] && <NotificationIcon />}
                </div>
              ))}
            </div>
          )}

          <input
            type="text"
            value={title || ""}
            readOnly={isDeleted}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled..."
          />
        </div>

        {/* <button
          className="syncAzureButton"
          onClick={() => navToSyncAzurePage()}
        >
          SyncAzure
        </button> */}

        <div className="right-buttons">
          {!isDeleted && (
            <div className="save-group">
              <button className="save-button" onClick={() => onSave()}>
                {/* Save button icon path */}
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.6667 28V17.3333H9.33333V28M9.33333 4V10.6667H20M25.3333 28H6.66667C5.95942 28 5.28115 27.719 4.78105 27.219C4.28095 26.7189 4 26.0406 4 25.3333V6.66667C4 5.95942 4.28095 5.28115 4.78105 4.78105C5.28115 4.28095 5.95942 4 6.66667 4H21.3333L28 10.6667V25.3333C28 26.0406 27.719 26.7189 27.219 27.219C26.7189 27.719 26.0406 28 25.3333 28Z"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="last-saved">
                <span>LAST SAVED</span>
                <span className="last-saved-date">
                  {lastSavedAt ? lastSavedAt.toLocaleDateString() : "UNSAVED"}
                </span>
                <span className="last-saved-time">
                  {lastSavedAt ? lastSavedAt.toLocaleTimeString() : ""}
                </span>
              </div>
            </div>
          )}

          <div className="sync-group">
            <button
              className="sync-azure-notes-button"
              onClick={() => syncDevopsNotes()}
            >
              {/* Sync button icon path */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.9998 21.3333L21.3332 16M21.3332 16L15.9998 10.6667M21.3332 16L10.6665 16M29.3332 16C29.3332 23.3638 23.3636 29.3333 15.9998 29.3333C8.63604 29.3333 2.6665 23.3638 2.6665 16C2.6665 8.6362 8.63604 2.66667 15.9998 2.66667C23.3636 2.66667 29.3332 8.6362 29.3332 16Z"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <div className="delete-group">
            <div className="dropdown-button-combo" ref={trashComboRef}>
              <button className="delete-button" onClick={onSoftDelete}>
                {/* Trash bin icon path */}
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 8H6.66667M6.66667 8H28M6.66667 8L6.66667 26.6667C6.66667 27.3739 6.94762 28.0522 7.44772 28.5523C7.94781 29.0524 8.62609 29.3333 9.33333 29.3333H22.6667C23.3739 29.3333 24.0522 29.0524 24.5523 28.5523C25.0524 28.0522 25.3333 27.3739 25.3333 26.6667V8M10.6667 8V5.33333C10.6667 4.62609 10.9476 3.94781 11.4477 3.44771C11.9478 2.94762 12.6261 2.66667 13.3333 2.66667H18.6667C19.3739 2.66667 20.0522 2.94762 20.5523 3.44771C21.0524 3.94781 21.3333 4.62609 21.3333 5.33333V8M13.3333 14.6667V22.6667M18.6667 14.6667V22.6667"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="delete-dropdown-button">
                <button
                  className="dropdown-button"
                  onClick={() => setIsTrashListOpen((d) => !d)}
                  aria-label="Open notes"
                >
                  {/* dropdown button icon path */}
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 26 26"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M13 16.6833L6.5 10.1833L8.01667 8.66667L13 13.65L17.9833 8.66667L19.5 10.1833L13 16.6833Z" />
                  </svg>
                </button>
              </div>

              <div
                className={`trash-list-notification ${
                  trashHasNotifications ? "visible" : ""
                }`}
              >
                {/* notification icon path */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_13_201)">
                    <rect width="18" height="18" rx="9" fill="#8D9265" />
                    <path
                      d="M9 6V9M9 12H9.0075M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z"
                      stroke="#0A1E1D"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_13_201">
                      <rect width="18" height="18" rx="9" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
              </div>

              {isTrashListOpen && trashList.length != 0 && (
                <div
                  className="combo-dropdown"
                  onMouseLeave={() => setHoveredNoteId(null)}
                >
                  {trashList.map((note) => (
                    <div
                      key={note.id}
                      className="dropdown-item trash-row"
                      onClick={() => {
                        onOpenNote(note.id);
                        setIsTrashListOpen(false);
                      }}
                    >
                      <span className="note-title">
                        {note.title || "Untitled"}
                      </span>
                      <div className="dropdown-item-buttons">
                        {noteNotifications[note.id!] && (
                          <div
                            className="notification-wrapper"
                            onMouseEnter={() => {
                              setHoveredNoteId(note.id!);
                              loadNotificationsForNote(note.id!);
                            }}
                            onMouseLeave={() => setHoveredNoteId(null)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {hoveredNoteId === note.id &&
                              notificationMessages[note.id!] && (
                                <NotificationTooltip
                                  notifications={notificationMessages[note.id!]}
                                />
                              )}

                            <NotificationIcon />
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecoverNote(note.id);
                            setIsTrashListOpen(false);
                          }}
                        >
                          Recover
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onHardDelete(note.id);
                            setIsTrashListOpen(false);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavBar;
