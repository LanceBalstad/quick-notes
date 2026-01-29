import { useState, createContext } from "react";
import { ConfirmModal } from "./components/ConfirmModal/ConfirmModal";
import "./App.css";
import { RouterProvider } from "react-router-dom";
import { Router } from "./Routing/Router";
import TitleBar from "./components/TitleBar/TitleBar";

function App() {
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    open: false,
    title: "",
    message: "",
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setConfirmState({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmState({
      open: false,
      title: "",
      message: "",
    });
  };

  return (
    <>
      {confirmState.open && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={() => {
            confirmState.onConfirm?.();
            closeConfirm();
          }}
          onCancel={closeConfirm}
        />
      )}
      <div className="app-root">
        <div className="titleBarWrapper">
          <TitleBar />
        </div>
        <div className="contentWrapper">
          <ConfirmModalContext.Provider value={{ showConfirm }}>
            <RouterProvider router={Router} />
          </ConfirmModalContext.Provider>
        </div>
      </div>
    </>
  );
}

export default App;
export const ConfirmModalContext = createContext<{
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
} | null>(null);
