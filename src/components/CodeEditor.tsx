import { useState, useImperativeHandle, forwardRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
import { linter, Diagnostic } from "@codemirror/lint";
import {keymap} from "@codemirror/view"
import {indentWithTab} from "@codemirror/commands"
import { lintPythonCode } from "../utils/pyodideRunner";
import fieldsTheme from './fieldstheme';
import { sdfCompletions } from "../utils/sdf_completions";

function sdfCompletionSource(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (!word || word.from === word.to) return null;
  return {
    from: word.from,
    options: sdfCompletions,
    validFor: /^\w*$/,
  };
}

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
            autocompletion({ override: [sdfCompletionSource] }),
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
      />
    );
  }
);

export default CodeEditor;
