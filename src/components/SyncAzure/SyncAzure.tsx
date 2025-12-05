import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

const SyncAzure = () => {
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const navToRecentNote = () => {
    navigate("/");
  };

  async function syncAzure() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setToken(await invoke("login_to_azure"));
  }

  //   const token = await window.__TAURI__.invoke<string>("loginToAzure");

  return (
    <>
      SyncAzure
      <button className="backButton" onClick={() => navToRecentNote()}>
        Back
      </button>
      <button className="syncAzureButton" onClick={() => syncAzure()}>
        Sync with Azure
      </button>
      <button className="syncDevopsPATButton" onClick={() => syncAzure()}>
        Sync with DevOps PAT
      </button>
      <div>Token: {token}</div>
      {/* <button className="syncAzureButton" onClick={() => console.log(token)}>
        Log Token
      </button> */}
    </>
  );
};

export default SyncAzure;
