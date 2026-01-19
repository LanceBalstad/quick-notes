import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { handleSetThirdPartyAccount } from "../../Helpers/ThirdPartyAccountHelper";
import { getThirdPartyAccount } from "../../db/Services/ThirdPartyAccountService";

const SyncAzure = () => {
  // const [token, setToken] = useState("");
  const [pat, setPat] = useState("");
  // const [storedPat, setStoredPat] = useState<string | null>(null);
  const navigate = useNavigate();

  const navToRecentNote = () => {
    navigate("/");
  };

  async function syncAzure() {
    // First try to set new third party account
    // if a new third party account is set, then connect to azure
    const currentThirdPartyAccount = await getThirdPartyAccount();

    const newThirdPartyAccountWasSet = await handleSetThirdPartyAccount({
      accountType: "AZURE_DEVOPS",
      thirdPartyUserId: "TODO",
      authMethod: "OAUTH",
      createdAt: new Date(),
      lastSyncedAt: currentThirdPartyAccount?.lastSyncedAt ?? undefined,
    });

    if (newThirdPartyAccountWasSet) {
      await invoke("login_to_azure");

      // if PAT exists, delete it
      // otherwise if user tries to switch back to PAT, the program will say that
      // they already have a PAT and ask if they want to replace it, causing confusion
      const hasPAT = await invoke("has_devops_pat");
      if (hasPAT) {
        await invoke("delete_devops_pat");
      }
    }
  }

  async function syncDevopsPAT(pat: string) {
    // First try to set new third party account
    // if a new third party account is set, then set the devops PAT
    const currentThirdPartyAccount = await getThirdPartyAccount();

    let thirdPartyUserId: string | undefined;
    try {
      const workItems = await getDevopsWorkItems();
      const extractedUserId = extractUserIdFromWorkItems(workItems);

      if (extractedUserId) {
        thirdPartyUserId = extractedUserId;
      }
    } catch (err) {
      console.warn(
        "syncDevopsPAT: Failed to extract Azure user Id from work items:",
        err,
      );
    }

    const newThirdPartyAccountWasSet = await handleSetThirdPartyAccount({
      accountType: "AZURE_DEVOPS",
      thirdPartyUserId: thirdPartyUserId,
      authMethod: "PAT",
      createdAt: new Date(),
      lastSyncedAt: currentThirdPartyAccount?.lastSyncedAt ?? undefined,
    });

    if (newThirdPartyAccountWasSet) {
      const hasPAT = await invoke("has_devops_pat");

      // if PAT already exists, ensure that the user is ok overriding it before continuing
      let isConfirmed = true;
      if (hasPAT) {
        isConfirmed = window.confirm(
          "This will override your current PAT. Are you sure your want to continue?",
        );
      }

      if (isConfirmed) {
        await invoke("store_devops_pat", { pat });
        setPat("");
      }
    }
  }

  // async function getDevopsPAT() {
  //   setStoredPat(await invoke("get_devops_pat"));
  // }

  async function getDevopsWorkItems() {
    const workItemsJson = await invoke<string>(
      "devops_get_users_work_items_pat",
    );
    return JSON.parse(workItemsJson);
  }

  function extractUserIdFromWorkItems(workItems: any): string | null {
    if (!workItems?.value?.length) return null;

    const firstItem = workItems.value[0];
    return firstItem?.fields?.["System.assignedTo"]?.id ?? null;
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
      {/* <button className="testPATButton" onClick={() => getDevopsPAT()}>
        Get DevOps PAT
      </button>
      <button className="getWorkItemTest" onClick={() => getDevopsWorkItems()}>
        Get Devops Work Item
      </button>
      <div>PAT: {storedPat}</div>
      <div>Token: {token}</div> */}
      {/* <button className="syncAzureButton" onClick={() => console.log(token)}>
        Log Token
      </button> */}
    </>
  );
};

export default SyncAzure;
