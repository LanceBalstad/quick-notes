import React, { useEffect, useRef } from "react";
import "./Body.css";
import Quill from "quill";

if (typeof window !== "undefined") {
  (window as any).Quill = Quill;
}

/* --- 1. IMAGE BLOT & RESIZE SETUP --- */
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

/* --- 2. DEBOUNCE HELPER --- */
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
  onSave: () => Promise<void>;
  setHasUserEdited: (edited: boolean) => void;
  isDeleted?: boolean;
}

const Body = ({
  body,
  setBody,
  onSave,
  setHasUserEdited,
  isDeleted = false,
}: BodyProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const lastHtmlRef = useRef(body);

  useEffect(() => {
    if (!editorRef.current) return;

    // 3. INITIALIZE QUILL (No Bindings Here!)
    const quill = new Quill(editorRef.current, {
      readOnly: isDeleted,
      modules: {
        toolbar: false,
        imageResize: { modules: ["Resize", "DisplaySize"] },
        clipboard: true,
        // We leave the keyboard module empty here and add bindings below
        keyboard: { bindings: {} },
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
        "indent", // Must be in whitelist
      ],
    });

    quillRef.current = quill;

    // 4. REGISTER BINDINGS (This ensures they take priority)

    // TAB: Indent List
    quill.keyboard.addBinding(
      { key: 9 }, // TS Fix: Removed 'format' property here
      (_range: any, context: any) => {
        // TS Fix: Added underscore to unused 'range'
        // Logic Fix: Check if we are in a list using the context
        if (context.format.list) {
          quill.format("indent", "+1");
          return false; // Prevent default focus shift
        }
        return true;
      },
    );

    // SHIFT+TAB: Un-indent List
    quill.keyboard.addBinding(
      { key: 9, shiftKey: true }, // TS Fix: Removed 'format' property here
      (_range: any, context: any) => {
        if (context.format.list) {
          quill.format("indent", "-1");
          return false;
        }
        return true;
      },
    );

    // SPACE: Dash to Bullet
    quill.keyboard.addBinding({ key: " " }, (range, context) => {
      if (context.prefix === "-") {
        quill.deleteText(range.index - 1, 1);
        quill.formatLine(range.index - 1, 1, "list", "bullet");
        quill.formatLine(range.index - 1, 1, "indent", false); // Reset indent
        return false;
      }
      return true;
    });

    // 5. STANDARD SETUP (HTML Sync, Listeners)
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
    quill.root.addEventListener("mouseup", handleMouseUp);

    return () => {
      quill.off("text-change", debouncedUpdate);
      quill.root.removeEventListener("mouseup", handleMouseUp);
      debouncedUpdate.cancel();
    };
  }, []);

  /* ... Rest of your useEffects for syncing and cleanup ... */
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (body === lastHtmlRef.current) return;
    if (quill.root.innerHTML === body) return;
    lastHtmlRef.current = body || "";
    quill.clipboard.dangerouslyPasteHTML(body || "");
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
