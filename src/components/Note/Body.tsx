import React from "react";
import "./Body.css";

interface BodyProps {
  body: string;
  setBody: (body: string) => void;
}

const Body = ({ body, setBody }: BodyProps) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Get info about the current line (leading whitespace, first char, dash position)
  const getCurrentLineInfo = (before: string, after: string) => {
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
  const updateTextAreaState = (
    newValue: string,
    caretPos: number,
    shouldPreventDefault?: boolean
  ) => {
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
    return (
      lineInfo.firstCharInLineMinusWhiteSpace === "-" &&
      lineInfo.dashIndex === lineInfo.firstNonWhitespaceIndex
    );
  };

  const handledDashList = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textAreaEl =
      textareaRef.current ?? (e.currentTarget as HTMLTextAreaElement);
    if (!textAreaEl) return;

    const { selectionStart = 0, selectionEnd = 0, value } = textAreaEl;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);

    const lineInfo = getCurrentLineInfo(before, after);

    // If the current line started with "-", then start the new line with "-"
    if (lineInfo.firstCharInLineMinusWhiteSpace === "-") {
      e.preventDefault();
      const insert = "\n" + lineInfo.leadingWhitespace + "-";
      const newValue = before + insert + after;
      updateTextAreaState(newValue, before.length + insert.length);
      return;
    }
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

    const lineInfo = getCurrentLineInfo(before, after);
    let insert = "\t";

    // If on a list line starting with "-", shift the dash right by including it in insert
    if (isListLine(lineInfo)) {
      const dashIndex = lineInfo.dashIndex;

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

    const lineInfo = getCurrentLineInfo(before, after);

    // If backspace is pressed and we're right after the dash at line start, remove the dash
    if (isListLine(lineInfo) && lineInfo.previousChar === "-") {
      e.preventDefault();
      const dashIndex = lineInfo.dashIndex;
      before =
        before.slice(0, lineInfo.lineStart) + before.slice(dashIndex + 1);

      const newValue = before + after;
      updateTextAreaState(newValue, before.length);
    }
  };

  // We only want to handle certain keys
  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      handleTab(e);
    }

    if (e.key === "Enter") {
      handledDashList(e);
    }

    if (e.key === "Backspace") {
      handleDeleteDash(e);
    }
  };

  return (
    <>
      <div className="note-body">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleCustomKeyDown}
          title="Note body"
        />
      </div>
    </>
  );
};

export default Body;
