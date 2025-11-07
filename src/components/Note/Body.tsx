import React from "react";
import "./Body.css";

const Body = () => {
  const [body, setBody] = React.useState("");

  return (
    <>
      <div className="note-body">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
    </>
  );
};

export default Body;
