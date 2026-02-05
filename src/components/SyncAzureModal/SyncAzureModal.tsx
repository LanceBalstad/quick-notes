import { invoke } from "@tauri-apps/api/core";
import { useState, useContext, useEffect } from "react";
import { handleSetThirdPartyAccount } from "../../Helpers/ThirdPartyAccountHelper";
import { getThirdPartyAccount } from "../../db/Services/ThirdPartyAccountService";
import { ConfirmModalContext } from "../../App";
import "./SyncAzureModal.css";

interface SyncAzureModalProps {
  onClose: () => void;
}

export const SyncAzureModal = ({ onClose }: SyncAzureModalProps) => {
  const confirmModal = useContext(ConfirmModalContext);
  const [pat, setPat] = useState("");
  const [organization, setOrganization] = useState("");
  const [project, setProject] = useState("");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const account = await getThirdPartyAccount();

      if (!isMounted || !account) return;

      setOrganization(account.organizationName ?? "");
      setProject(account.projectName ?? "");
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // async function syncAzure() {
  //   onClose();
  //   // First try to set new third party account
  //   // if a new third party account is set, then connect to azure
  //   const currentThirdPartyAccount = await getThirdPartyAccount();

  //   const newThirdPartyAccountWasSet = await handleSetThirdPartyAccount(
  //     {
  //       accountType: "AZURE_DEVOPS",
  //       thirdPartyUserId: "TODO",
  //       authMethod: "OAUTH",
  //       createdAt: new Date(),
  //       lastSyncedAt: currentThirdPartyAccount?.lastSyncedAt ?? undefined,
  //     },
  //     confirmModal,
  //   );

  //   if (newThirdPartyAccountWasSet) {
  //     await invoke("login_to_azure");

  //     // if PAT exists, delete it
  //     // otherwise if user tries to switch back to PAT, the program will say that
  //     // they already have a PAT and ask if they want to replace it, causing confusion
  //     const hasPAT = await invoke("has_devops_pat");
  //     if (hasPAT) {
  //       await invoke("delete_devops_pat");
  //     }
  //   }
  // }

  async function syncDevopsPAT(pat: string) {
    onClose();
    // First try to set new third party account
    // if a new third party account is set, then set the devops PAT
    const currentThirdPartyAccount = await getThirdPartyAccount();

    let thirdPartyUserId: string | undefined;
    // try {
    //   const workItems = await getDevopsWorkItems();
    //   const extractedUserId = extractUserIdFromWorkItems(workItems);

    //   if (extractedUserId) {
    //     thirdPartyUserId = extractedUserId;
    //   }
    // } catch (err) {
    //   console.warn(
    //     "syncDevopsPAT: Failed to extract Azure user Id from work items:",
    //     err,
    //   );
    // }

    await invoke("save_devops_org_project", { organization, project });

    const newThirdPartyAccountWasSet = await handleSetThirdPartyAccount(
      {
        accountType: "AZURE_DEVOPS",
        thirdPartyUserId: thirdPartyUserId,
        authMethod: "PAT",
        organizationName: organization,
        projectName: project,
        createdAt: new Date(),
        lastSyncedAt: currentThirdPartyAccount?.lastSyncedAt ?? undefined,
      },
      confirmModal,
    );

    if (newThirdPartyAccountWasSet) {
      const hasPAT = await invoke("has_devops_pat");

      const storePAT = async () => {
        try {
          await invoke("store_devops_pat", { pat });
          setPat("");
        } catch (err) {
          confirmModal?.showConfirm(
            "Error Saving PAT",
            `Failed to store PAT: ${err instanceof Error ? err.message : String(err)}`,
            () => {},
          );
        }
      };

      // if PAT already exists, ensure that the user is ok overriding it before continuing
      if (hasPAT) {
        confirmModal?.showConfirm(
          "Override Personal Access Token",
          "This will override your current PAT. Are you sure your want to continue?",
          async () => await storePAT(),
        );
      } else {
        await storePAT();
      }
    }
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>Sync Azure Devops</h3>
          <div className="modal-buttons">
            <div className="patLogic">
              {/* <button className="syncAzureButton" onClick={() => syncAzure()}>
                Sync with Azure (OAUTH)
              </button> */}

              <input
                type="text"
                value={pat || ""}
                onChange={(e) => setPat(e.target.value)}
                placeholder="Personal Access Token..."
              />
              <button
                className="syncDevopsPATButton"
                onClick={() => syncDevopsPAT(pat)}
              >
                Sync with Azure (DevOps PAT)
              </button>
            </div>
            <div className="organizationLogic">
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Organization..."
              />
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Project..."
              />
            </div>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SyncAzureModal;
