import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

const SyncAzure = () => {
  const [token, setToken] = useState("");
  const [pat, setPat] = useState("");
  const [storedPat, setStoredPat] = useState<string | null>(null);
  const navigate = useNavigate();

  const navToRecentNote = () => {
    navigate("/");
  };

  async function syncAzure() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setToken(await invoke("login_to_azure"));
  }

  async function syncDevopsPAT(pat: string) {
    await invoke("store_devops_pat", { pat });
  }

  async function getDevopsPAT() {
    setStoredPat(await invoke("get_devops_pat", { pat }));
  }

  async function getDevopsWorkItem() {
    const workItem = await invoke("devops_get_work_items_pat");
    console.log("DevOps Work Item:", workItem);
  }

  return (
    <>
      SyncAzure
      <button className="backButton" onClick={() => navToRecentNote()}>
        Back
      </button>
      <button className="syncAzureButton" onClick={() => syncAzure()}>
        Sync with Azure
      </button>
      <button
        className="syncDevopsPATButton"
        onClick={() => syncDevopsPAT(pat)}
      >
        Sync with DevOps PAT
      </button>
      <input
        type="text"
        value={pat || ""}
        onChange={(e) => setPat(e.target.value)}
        placeholder="..."
        // onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button className="testPATButton" onClick={() => getDevopsPAT()}>
        Get DevOps PAT
      </button>
      <button className="getWorkItemTest" onClick={() => getDevopsWorkItem()}>
        Get Devops Work Item
      </button>
      <div>PAT: {storedPat}</div>
      <div>Token: {token}</div>
      {/* <button className="syncAzureButton" onClick={() => console.log(token)}>
        Log Token
      </button> */}
    </>
  );
};

export default SyncAzure;
