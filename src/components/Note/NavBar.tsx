import "./NavBar.css";
import { Note } from "../../db/Services/NotesService";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  getNotificationsByNoteId,
  NoteNotification,
} from "../../db/Services/NotificationsService";
import {
  checkNotificationsForNotes,
  deleteNotificationsForNotes,
  formatNotification,
} from "../../Helpers/NotificationHelper";
import {
  DropdownIcon,
  FileIcon,
  DropdownNotificationIcon,
  SaveIcon,
  NoteNotificationIcon,
  SyncIcon,
  IsSyncingIcon,
  TrashIcon,
} from "../Icons/IconIndex";

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
  onSync: () => Promise<void>;
  lastSyncedAt?: Date;
  isSyncing: boolean;
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
  onSync,
  lastSyncedAt,
  isSyncing,
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

  const [trashNotifications, setTrashNotifications] = useState<
    Record<number, boolean>
  >({});

  const [notificationMessages, setNotificationMessages] = useState<
    Record<number, NoteNotification[]>
  >({});

  const [hoveredNoteId, setHoveredNoteId] = useState<number | null>(null);

  const titleComboRef = useRef<HTMLDivElement | null>(null);

  const trashComboRef = useRef<HTMLDivElement | null>(null);

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

  // fetch notifs for note list logic whenever note list updates
  useEffect(() => {
    (async () => {
      // fetch if note dropdown button needs a notif
      setNoteListHasNotifications(await checkNotificationsForNotes(notes));

      // fetch individual note notifs for trash list whenever trash list updates
      const noteNotifs = await individualNoteNotifs(notes);
      setNoteNotifications(noteNotifs);
    })();
  }, [notes]);

  // fetch notifs for trash list logic whenever trash list updates
  useEffect(() => {
    (async () => {
      // fetch if trash dropdown button needs a notif
      setTrashHasNotifications(await checkNotificationsForNotes(trashList));

      // fetch individual note notifs for trash list whenever trash list updates
      const trashNoteNotifs = await individualNoteNotifs(trashList);
      setTrashNotifications(trashNoteNotifs);
    })();
  }, [trashList]);

  useEffect(() => {
    if (!isNoteListOpen) {
      // dropdown just closed
      (async () => {
        //refetch(remove) note list notification on close
        await deleteNotificationsForNotes(notes);
        setNoteListHasNotifications(false);

        //We want to refetch individual notifs at this time as well (which will delete them)
        const noteNotifs = await individualNoteNotifs(notes);
        setNoteNotifications(noteNotifs);
      })();
    }
  }, [isNoteListOpen]);

  useEffect(() => {
    if (!isTrashListOpen) {
      // dropdown just closed
      (async () => {
        //refetch(remove) trash list notification on close
        await deleteNotificationsForNotes(trashList);
        setTrashHasNotifications(false);

        //We want to refetch individual notifs at this time as well (which will delete them)
        const trashNoteNotifs = await individualNoteNotifs(trashList);
        setTrashNotifications(trashNoteNotifs);
      })();
    }
  }, [isTrashListOpen]);

  // keeps the note notification messages from going stale
  useEffect(() => {
    setNotificationMessages({});
  }, [notes, trashList]);

  const individualNoteNotifs = async function loadNotificationsForNotes(
    notes: Note[],
  ) {
    const entries = await Promise.all(
      notes.map(async (note) => [
        note.id!,
        (await getNotificationsByNoteId(note.id!)).length > 0,
      ]),
    );

    return Object.fromEntries(entries);
  };

  //
  async function loadNotificationsForNote(noteId: number) {
    // Already loaded. Keeps the notif tool tip from getting stuck open
    if (notificationMessages[noteId]) return;

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
          <FileIcon />
        </button>

        <div
          className={`note-list-notification ${
            noteListHasNotifications ? "visible" : ""
          }`}
        >
          <DropdownNotificationIcon />
        </div>

        <div className="dropdown-button-combo" ref={titleComboRef}>
          <button
            className="dropdown-button"
            onClick={() => setIsNoteListOpen((d) => !d)}
            aria-label="Open notes"
          >
            <DropdownIcon />
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

                      <NoteNotificationIcon />
                    </div>
                  )}
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

        <button
          className="syncAzureButton"
          onClick={() => navToSyncAzurePage()}
        >
          SyncAzure
        </button>

        <div className="right-buttons">
          {!isDeleted && (
            <div className="save-group">
              <button className="save-button" onClick={() => onSave()}>
                {/* Save button icon path */}
                <SaveIcon />
              </button>

              <div className="last-happened">
                <span>LAST SAVED</span>
                <span className="last-happened-date">
                  {lastSavedAt ? lastSavedAt.toLocaleDateString() : "UNSAVED"}
                </span>
                <span className="last-happened-time">
                  {lastSavedAt ? lastSavedAt.toLocaleTimeString() : ""}
                </span>
              </div>
            </div>
          )}

          <div className="sync-group">
            {isSyncing ? (
              <button className="isSyncing-button">
                {/* IsSync button icon path */}
                <IsSyncingIcon />
              </button>
            ) : (
              <button
                className="sync-azure-notes-button"
                onClick={() => onSync()}
              >
                {/* Sync button icon path */}
                <SyncIcon />
              </button>
            )}
            <div className="last-happened">
              <span>LAST SYNCED</span>
              <span className="last-happened-date">
                {lastSyncedAt ? lastSyncedAt.toLocaleDateString() : "UNSYNCED"}
              </span>
              <span className="last-happened-time">
                {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : ""}
              </span>
            </div>
          </div>
          <div className="delete-group">
            <div className="dropdown-button-combo" ref={trashComboRef}>
              <button
                className="delete-button"
                onClick={onSoftDelete}
                disabled={isDeleted}
              >
                {/* Trash bin icon path */}
                <TrashIcon />
              </button>

              <div className="delete-dropdown-button">
                <button
                  className="dropdown-button"
                  onClick={() => setIsTrashListOpen((d) => !d)}
                  aria-label="Open notes"
                  disabled={trashList.length === 0}
                >
                  <DropdownIcon />
                </button>
              </div>

              <div
                className={`trash-list-notification ${
                  trashHasNotifications ? "visible" : ""
                }`}
              >
                <DropdownNotificationIcon />
              </div>

              {isTrashListOpen && trashList.length !== 0 && (
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
                        {trashNotifications[note.id!] && (
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

                            <NoteNotificationIcon />
                          </div>
                        )}

                        <button
                          className="recover-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRecoverNote(note.id);
                            setIsTrashListOpen(false);
                          }}
                        >
                          Recover
                        </button>
                        <button
                          className="hard-delete-button"
                          onClick={(e) => {
                            e.stopPropagation();

                            const isConfirmed = window.confirm(
                              "Are you sure you want to permanently delete this note?",
                            );

                            if (isConfirmed) {
                              onHardDelete(note.id);
                              setIsTrashListOpen(false);
                            }
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
