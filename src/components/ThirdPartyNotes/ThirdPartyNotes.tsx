import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

const ThirdPartyNotes = () => {
  const navigate = useNavigate();

  const navToRecentNote = () => {
    navigate("/");
  };

  async function getDevopsWorkItems() {
    const workItem = await invoke("devops_get_users_work_items_pat");
    console.log("DevOps Work ids item:", workItem);
  }

  return (
    <>
      <div>Third Party Notes</div>
      <button className="backButton" onClick={() => navToRecentNote()}>
        Back
      </button>
      <button
        className="getuserWorkItemsTest"
        onClick={() => getDevopsWorkItems()}
      >
        Get Devops Users Work Items
      </button>
    </>
  );
};

export default ThirdPartyNotes;
