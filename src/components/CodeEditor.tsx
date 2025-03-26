import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { coolGlow } from "thememirror";

export interface CodeEditorHandle {
  getCode: () => string;
}

interface CodeEditorProps {
  initialCode: string;
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ initialCode }, ref) => {
    const [editor, setEditor] = useState<EditorView | null>(null);

    // Expose a method to get the current code in the editor
    useImperativeHandle(ref, () => ({
      getCode: () => (editor ? editor.state.doc.toString() : initialCode),
    }));

    const editorParentRef = (parent: HTMLDivElement | null) => {
      if (parent && !editor) {
        const state = EditorState.create({
          doc: initialCode,
          extensions: [
            basicSetup,
            python(),
            autocompletion(),
            coolGlow,
            EditorView.lineWrapping,
            // Remove updateListener if you don't want state updates on every keystroke.
          ],
        });
        const view = new EditorView({ state, parent });
        setEditor(view);
      }
    };

    return (
      <div
        ref={editorParentRef}
        className="editor-container"
        style={{
          height: "50vh",
          overflow: "auto",
          border: "1px solid #ccc",
        }}
      />
    );
  }
);

export default CodeEditor;
