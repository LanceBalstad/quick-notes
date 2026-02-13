import React, { useEffect, useRef } from "react";
import "./Body.css";
import Quill from "quill";
import ImageResize from "quill-image-resize-module-react";

Quill.register("modules/imageResize", ImageResize);

interface BodyProps {
  body: string;
  setBody: (body: string) => void;
  onSave: () => Promise<void>;
  setHasUserEdited: (edited: boolean) => void;
  isDeleted?: boolean;
}

const Body = ({
  body,
  setBody,
  onSave,
  setHasUserEdited,
  isDeleted,
}: BodyProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const quill = new Quill(editorRef.current, {
      readOnly: isDeleted,
      modules: {
        toolbar: false,
        imageResize: {
          modules: ["Resize", "DisplaySize"],
        },
        formats: ["bold", "italiz", "underline", "list", "bullet", "link"],
        keyboard: {
          bindings: {
            save: {
              key: "s",
              shortKey: true,
              handler: async () => {
                await onSave();
                return false;
              },
            },
            dashToBullet: {
              key: " ",
              handler: function (range: any, context: any) {
                const quillInstance = quillRef.current;
                if (!quillInstance) return true;

                const textBefore = context.prefix;

                if (textBefore === "-") {
                  quillInstance.deleteText(range.index - 1, 1);

                  quillInstance.formatLine(
                    range.index - 1,
                    1,
                    "list",
                    "bullet",
                  );

                  return false;
                }

                return true;
              },
            },
          },
        },
      },
    });

    quillRef.current = quill;

    // set Body
    quill.root.innerHTML = body || "";

    // Listener
    quill.on("text-change", () => {
      setBody(quill.root.innerHTML);
      setHasUserEdited(true);
    });
  }, []);

  return (
    <div className="note-body">
      <div ref={editorRef} />
    </div>
  );
};

export default Body;
