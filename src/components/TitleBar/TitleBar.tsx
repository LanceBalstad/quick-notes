import { Window } from "@tauri-apps/api/window";
import "./TitleBar.css";

// const appWindow = Window.getCurrent();
const appWindow = Window.getCurrent();

const TitleBar = () => {
  return (
    <>
      <div
        className="titlebar"
        data-tauri-drag-region
        onDoubleClick={() => appWindow.toggleMaximize()}
      >
        <span data-tauri-drag-region>QUICK NOTES</span>

        <div className="window-controls">
          <div className="minimize-button">
            <button onClick={() => appWindow.minimize()}>—</button>
          </div>
          <div className="maximize-button">
            <button onClick={() => appWindow.toggleMaximize()}>▢</button>
          </div>
          <div className="close-button">
            <button onClick={() => appWindow.close()}>✕</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TitleBar;
