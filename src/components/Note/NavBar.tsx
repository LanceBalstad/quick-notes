import React from "react";
import "./NavBar.css";

interface NavBarProps {
  // Save logic is in the NotePage component to grab body value
  onSave: () => void;
}

const NavBar = ({ onSave }: NavBarProps) => {
  return (
    <>
      <div className="navbar">
        <button className="fileButton">File</button>
        <button className="editButton">edit</button>
        <button className="saveButton" onClick={onSave}>
          Save
        </button>
      </div>
    </>
  );
};

export default NavBar;
