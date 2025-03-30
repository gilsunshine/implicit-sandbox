import React from "react";
import "../styling/PythonConsole.css";

const PythonConsole = ({
    errors,
    editorWidth,
  }: {
    errors: string[];
    editorWidth: number;
  }) => {
    return (
      <div
        className="python-console"
        style={{ left: `${editorWidth + 20}px` }}
      >
        {errors.map((e, i) => (
          <pre key={i}>{e}</pre>
        ))}
      </div>
    );
  };
  
  export default PythonConsole;