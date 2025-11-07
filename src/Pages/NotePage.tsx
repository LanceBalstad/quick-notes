import React from "react";
import NavBar from "../components/Note/NavBar";
import Body from "../components/Note/Body";
import OpenNoteList from "../components/Note/OpenNoteList";

function NotePage() {
  return (
    <>
      <OpenNoteList />
      <NavBar />
      <Body />
    </>
  );
}

export default NotePage;
