import React from "react";
import NavBar from "../components/Note/NavBar";
import Body from "../components/Note/Body";
import { addNote } from "../db/Services/NotesService";
import OpenNoteList from "../components/Note/OpenNoteList";

function NotePage() {
  const [body, setBody] = React.useState("");

  const handleSave = () => {
    addNote({
      title: "Untitled",
      content: body,
      createdAt: new Date(),
      softDeleted: false,
    });
    console.log("Save button clicked");
  };

  return (
    <>
      <NavBar onSave={handleSave} />
      <Body body={body} setBody={setBody} />
    </>
  );
}

export default NotePage;
