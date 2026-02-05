import React from "react";
import "./Body.css";

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
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Get info about the current line (leading whitespace, first char, dash position)
  const getCurrentLineInfo = (before: string) => {
    const currentLine = before.split("\n").pop() || "";
    const trimmedLine = currentLine.replace(/^\s*/, "");
    const firstCharInLineMinusWhiteSpace = trimmedLine.charAt(0);
    const lineStart = before.lastIndexOf("\n") + 1;
    const firstNonWhitespaceIndex =
      lineStart + (currentLine.length - trimmedLine.length);
    const dashIndex = before.lastIndexOf("-");
    const previousChar = before.slice(-1);
    const leadingWhitespace = currentLine.match(/^\s*/)?.[0] || "";

    return {
      currentLine,
      trimmedLine,
      firstCharInLineMinusWhiteSpace,
      lineStart,
      firstNonWhitespaceIndex,
      dashIndex,
      previousChar,
      leadingWhitespace,
    };
  };

  // Helper: Update textarea state and restore caret position
  const updateTextAreaState = (newValue: string, caretPos: number) => {
    setBody(newValue);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          caretPos;
      }
    });
  };

  // Check if current line starts with a dash
  const isListLine = (lineInfo: ReturnType<typeof getCurrentLineInfo>) => {
    return lineInfo.firstCharInLineMinusWhiteSpace === "-";
  };

  const handleDashList = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textAreaEl =
      textareaRef.current ?? (e.currentTarget as HTMLTextAreaElement);
    if (!textAreaEl) return;

    const { selectionStart = 0, selectionEnd = 0, value } = textAreaEl;
    let before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    const lineInfo = getCurrentLineInfo(before);

    if (!isListLine(lineInfo)) return; // only continue if it is a list line

    e.preventDefault();

    // Line contains only a dash
    if (lineInfo.trimmedLine === "-") {
      const newBefore =
        lineInfo.leadingWhitespace.length > 0
          ? before.slice(0, lineInfo.lineStart) +
            lineInfo.leadingWhitespace.slice(0, -1) +
            "-"
          : before.slice(0, lineInfo.lineStart);
      updateTextAreaState(newBefore + after, newBefore.length);
      return;
    }

    // Line contains content after dash -> insert new dash line
    const newValue = before + "\n" + lineInfo.leadingWhitespace + "-" + after;
    updateTextAreaState(
      newValue,
      before.length + lineInfo.leadingWhitespace.length + 2,
    ); // cursor after dash
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textAreaEl =
      textareaRef.current ?? (e.currentTarget as HTMLTextAreaElement);
    if (!textAreaEl) return;

    // we always want to prevent default for tab. Otherwise, it moves focus to navbar buttons
    e.preventDefault();

    const { selectionStart = 0, selectionEnd = 0, value } = textAreaEl;
    let before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    const lineInfo = getCurrentLineInfo(before);
    let insert = "\t";

    // If on a list line starting with "-", shift the dash right by including it in insert
    if (isListLine(lineInfo)) {
      // If the shift key is also being held and there is white space being the dash in the line, we want to unindent instead
      if (e.shiftKey) {
        if (
          lineInfo.leadingWhitespace.length > 0 &&
          lineInfo.previousChar === "-"
        ) {
          // Must be a seperate if statement to catch the case where the user unindents and there are no leading whitespaces (do nothing)
          before =
            before.slice(0, lineInfo.lineStart) +
            lineInfo.leadingWhitespace.slice(0, -1) +
            lineInfo.trimmedLine;

          insert = "";
        }
      }

      // logic for if tab key is pressed without shift
      else if (lineInfo.previousChar === "-") {
        const dashIndex = lineInfo.dashIndex;
        before = before.slice(0, dashIndex) + before.slice(dashIndex + 1);
        insert += "-";
      }
    }

    const newValue = before + insert + after;
    updateTextAreaState(newValue, before.length + insert.length);
  };

  const handleDeleteDash = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textAreaEl =
      textareaRef.current ?? (e.currentTarget as HTMLTextAreaElement);
    if (!textAreaEl) return;

    const { selectionStart = 0, selectionEnd = 0, value } = textAreaEl;
    let before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    const lineInfo = getCurrentLineInfo(before);

    // If backspace is pressed and we're right after the dash at line start, remove the dash
    if (
      isListLine(lineInfo) &&
      lineInfo.previousChar === "-" &&
      selectionStart === lineInfo.firstNonWhitespaceIndex + 1
    ) {
      e.preventDefault();
      // if we are in the if statement we already know that this is the first dash of the line
      const dashIndex = lineInfo.dashIndex;
      before =
        before.slice(0, lineInfo.lineStart) + before.slice(dashIndex + 1);

      const newValue = before + after;
      updateTextAreaState(newValue, before.length);
    }
  };

  const handleSave = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    await onSave();
  };

  // We only want to handle certain keys
  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      handleTab(e);
    }

    if (e.key === "Enter") {
      handleDashList(e);
    }

    if (e.key === "Backspace") {
      handleDeleteDash(e);
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      handleSave(e);
    }
  };

  return (
    <>
      <div className="note-body">
        <textarea
          ref={textareaRef}
          spellCheck={false}
          value={body}
          readOnly={isDeleted}
          onChange={(e) => {
            (setBody(e.target.value), setHasUserEdited(true));
          }}
          onKeyDown={handleCustomKeyDown}
          aria-label="Note body"
        />
      </div>
    </>
  );
};

export default Body;
