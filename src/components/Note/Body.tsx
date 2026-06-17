import { useEffect, useRef } from "react";
import "./Body.css";
import Quill from "quill";

if (typeof window !== "undefined") {
  (window as any).Quill = Quill;
}

// Image and resize
const BaseImage = Quill.import("formats/image");

class ImageBlot extends BaseImage {
  static create(value: any) {
    const node = super.create(value);
    if (typeof value === "string") {
      node.setAttribute("src", value);
    }
    return node;
  }

  static formats(domNode: Element) {
    const formats: any = {};
    if (domNode.hasAttribute("width")) {
      formats.width = domNode.getAttribute("width");
    }
    if (domNode.hasAttribute("height")) {
      formats.height = domNode.getAttribute("height");
    }
    return formats;
  }

  format(name: string, value: any) {
    if (name === "width" || name === "height") {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}
Quill.register(ImageBlot, true);

import ImageResize from "quill-image-resize-module-react";
if (!(Quill as any).imports["modules/imageResize"]) {
  Quill.register("modules/imageResize", ImageResize);
}

// debounce used to limit how often we update the body state while resizing an image especially, as this is rapid and causes issues
function debounce(func: Function, wait: number) {
  let timeout: any;
  const debounced = (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}

interface BodyProps {
  body: string;
  setBody: (body: string) => void;
  setHasUserEdited: (edited: boolean) => void;
  isDeleted?: boolean;
}

const Body = ({
  body,
  setBody,
  setHasUserEdited,
  isDeleted = false,
}: BodyProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const lastHtmlRef = useRef(body);
  const pendingHeaderRef = {
    start: 0,
    end: 0,
    triggered: true,
  };

  useEffect(() => {
    if (!editorRef.current) return;

    editorRef.current.innerHTML = "";

    // initialize quill
    const quill = new Quill(editorRef.current, {
      readOnly: isDeleted,
      modules: {
        toolbar: false,
        imageResize: { modules: ["Resize", "DisplaySize"] },
        clipboard: true,
        // Leaving keyboard empty so quill can do its own thing
        // keyboard: { bindings: {} },
      },
      formats: [
        "bold",
        "italic",
        "underline",
        "list",
        "bullet",
        "link",
        "image",
        "width",
        "height",
        "indent",
      ],
    });

    const keyboard = quill.keyboard as any;

    keyboard.bindings[9] = keyboard.bindings[9].filter(
      (binding: any) =>
        binding.format &&
        (binding.format.includes?.("list") ||
          binding.format.includes?.("indent")),
    );

    quill.keyboard.addBinding({ key: 9 }, (range: any) => {
      // If tab is clicked and its not the start of a list line (Quill wont override anything), insert 2 spaces at cursor
      quill.insertText(range.index, "\u00A0\u00A0", "user");
      quill.setSelection(range.index + 2, 0, "silent");
      return false;
    });

    quill.keyboard.addBinding(
      {
        key: 9,
        shiftKey: true,
      },
      (range: any) => {
        const index = range.index;

        const text = quill.getText(Math.max(0, index - 2), 2);

        const textIsSpaces = text
          .split("")
          .every((char) => char === "\u00A0" || char === " ");

        // only remove if it's actually two spaces
        if (textIsSpaces) {
          quill.deleteText(index - 2, 2, "user");
          quill.setSelection(index - 2, 0, "silent");
        }

        return false;
      },
    );

    quill.keyboard.addBinding(
      {
        key: "H",
        shortKey: true, // Ctrl on Windows/Linux, Cmd on Mac
      },
      (range: any) => {
        const headerText = "New Header";

        const line = `=========================${headerText}=========================`;

        quill.insertText(
          range.index,
          line,
          {
            bold: true,
            underline: true,
          },
          "user",
        );

        // Position cursor on header text
        const headerStart = range.index + 25; // after first separator
        const headerEnd = headerStart + headerText.length;
        pendingHeaderRef.start = headerStart;
        pendingHeaderRef.end = headerEnd;
        pendingHeaderRef.triggered = false;
        quill.setSelection(headerStart, headerText.length);

        return false;
      },
    );

    quill.root.setAttribute("spellcheck", "false");

    quillRef.current = quill;

    if (body) {
      quill.clipboard.dangerouslyPasteHTML(body);
      lastHtmlRef.current = body;
    }

    const performUpdate = () => {
      const html = quill.root.innerHTML;
      if (html === lastHtmlRef.current) return;

      lastHtmlRef.current = html === "<p><br></p>" ? "" : html;
      setBody(lastHtmlRef.current);
      setHasUserEdited(true);
    };

    const debouncedUpdate = debounce(performUpdate, 300);
    quill.on("text-change", debouncedUpdate);

    const handleMouseUp = () => {
      debouncedUpdate();
    };

    let wasInsideHeader = false;

    quill.on("selection-change", (range) => {
      const pending = pendingHeaderRef;

      if (pending.triggered || !range) return;

      const currentPos = range.index;

      const insideHeader =
        currentPos >= pending.start && currentPos <= pending.end;

      if (wasInsideHeader && !insideHeader) {
        pending.triggered = true;

        const [line] = quill.getLine(pending.start);

        if (line) {
          const lineIndex = quill.getIndex(line);
          const lineLength = line.length();

          const text = quill.getText(lineIndex, lineLength);

          quill.insertText(
            lineIndex + lineLength,
            text,
            {
              bold: true,
              underline: true,
            },
            "user",
          );
          setTimeout(() => {
            const range = quill.getSelection();
            if (!range) return;

            quill.format("bold", false);
            quill.format("underline", false);
          }, 0);
        }
      }

      wasInsideHeader = insideHeader;
    });

    quill.root.addEventListener("copy", (e: ClipboardEvent) => {
      e.preventDefault();

      const selection = quill.getSelection();
      if (!selection) return;

      const text = quill.getText(selection.index, selection.length);

      // Get the selected contents as a Delta
      const delta = quill.getContents(selection.index, selection.length);

      // Convert Delta to HTML
      const temp = document.createElement("div");
      const tempQuill = new Quill(temp);
      tempQuill.setContents(delta);

      e.clipboardData?.setData("text/plain", text);
      e.clipboardData?.setData("text/html", tempQuill.root.innerHTML);
    });
    quill.root.addEventListener("mouseup", handleMouseUp);

    return () => {
      quill.off("text-change", debouncedUpdate);
      quill.root.removeEventListener("mouseup", handleMouseUp);
      debouncedUpdate.cancel();

      quillRef.current = null;

      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (body === lastHtmlRef.current) return;
    if (quill.root.innerHTML === body) return;
    lastHtmlRef.current = body || "";
    quill.clipboard.dangerouslyPasteHTML(body || "");
    console.log("Rendered HTML:", quill.root.innerHTML);
    quill.history.clear();
  }, [body]);

  useEffect(() => {
    if (!quillRef.current) return;
    quillRef.current.enable(!isDeleted);
  }, [isDeleted]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.clipboard.addMatcher("IMG", (node, delta) => {
      const imageUrl = node.getAttribute("src") || "";
      const width = node.getAttribute("width");
      const height = node.getAttribute("height");
      if (imageUrl) {
        if (width)
          delta.ops[0].attributes = { ...delta.ops[0].attributes, width };
        if (height)
          delta.ops[0].attributes = { ...delta.ops[0].attributes, height };
        if (!width && !node.getAttribute("width")) {
          node.setAttribute("width", node.naturalWidth.toString());
        }
      }
      return delta;
    });
  }, []);

  return (
    <div className="note-body">
      <div ref={editorRef} />
    </div>
  );
};

export default Body;
