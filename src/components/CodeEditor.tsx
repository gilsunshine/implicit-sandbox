import { useState, useEffect } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";
import { coolGlow } from "thememirror";
import { autocompletion } from "@codemirror/autocomplete";
import { executePythonCode } from "../utils/pyodideRunner";

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  setRawData: (data: Uint8Array) => void; // Callback to send data to ThreeCanvas
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode, setRawData }) => {
  const [editor, setEditor] = useState<EditorView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editorParentRef = (parent: HTMLDivElement | null) => {
    if (parent && !editor) {
      const state = EditorState.create({
        doc: code,
        extensions: [
          basicSetup,
          python(),
          autocompletion(),
          coolGlow,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setCode(update.state.doc.toString());
            }
          }),
        ],
      });

      const view = new EditorView({ state, parent });
      setEditor(view);
    }
  };

  // const runPythonCode = async () => {
  //   try {
  //     const rawData = await executePythonCode(code);
  //     setRawData(rawData); // Send data to ThreeCanvas
  //     setError(null); // Clear errors on success
  //   } catch (err) {
  //     setError("Error executing Python code. Check console for details.");
  //     console.error(err);
  //   }
  // };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "50vh" }}>
      <div
        ref={editorParentRef}
        className="editor-container"
        style={{
          height: "100%",
          overflow: "auto",
          border: "1px solid #ccc",
        }}
      />
      {/* <button onClick={runPythonCode} style={{ marginTop: "10px", padding: "8px", cursor: "pointer" }}>
        Run Code
      </button> */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default CodeEditor;
