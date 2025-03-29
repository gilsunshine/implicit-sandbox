import { useState, useImperativeHandle, forwardRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
// import { coolGlow } from "thememirror";
import { linter, Diagnostic } from "@codemirror/lint";
import {keymap} from "@codemirror/view"
import {indentWithTab} from "@codemirror/commands"
import { lintPythonCode } from "../utils/pyodideRunner"; // 🔥 Your async flake8 function
import fieldsTheme from './fieldstheme'; // ← Import your theme

export interface CodeEditorHandle {
  getCode: () => string;
}

interface CodeEditorProps {
  initialCode: string;
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ initialCode }, ref) => {
    const [editor, setEditor] = useState<EditorView | null>(null);

    useImperativeHandle(ref, () => ({
      getCode: () => (editor ? editor.state.doc.toString() : initialCode),
    }));

    const pythonLinter = linter(async (view) => {
      const code = view.state.doc.toString();
      const issues = await lintPythonCode(code);

      return issues.map((issue) => {
        const line = view.state.doc.line(issue.line);
        return {
          from: line.from + issue.column,
          to: line.from + issue.column + 1,
          severity: "error",
          message: issue.message,
        } as Diagnostic;
      });
    });

    const editorParentRef = (parent: HTMLDivElement | null) => {
      if (parent && !editor) {
        const state = EditorState.create({
          doc: initialCode,
          extensions: [
            basicSetup,
            python(),
            autocompletion(),
            fieldsTheme,
            EditorView.lineWrapping,
            pythonLinter,
            keymap.of([indentWithTab]),
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
          overflow: "auto",
          // border: "1px solid #555",
        }}
      />
    );
  }
);

export default CodeEditor;
