import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { RouterProvider } from "react-router-dom";
import { Router } from "./Routing/Router";
import TitleBar from "./components/TitleBar/TitleBar";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  // For learning purposes
  // communicates between my react frontend and tauri backend
  // invoke is a tauri api that calls a rust command from the fontend typescript
  // for example, this calls the "gree" command in src-tauri/src/lib.rs
  // To my knowledge, every function that calls a tauri command must be async. invoke returns a promise
  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <>
      <div className="app-root">
        <div className="titleBarWrapper">
          <TitleBar />
        </div>
        <div className="contentWrapper">
          <RouterProvider router={Router} />
        </div>
      </div>
    </>
  );
}

export default App;
