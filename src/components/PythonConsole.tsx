import React from "react";
import "../styling/PythonConsole.css"; // optional CSS file

interface PythonConsoleProps {
  logs: string[];
}

const PythonConsole: React.FC<PythonConsoleProps> = ({ logs }) => {
  return (
    <div className="python-console">
      <strong>Console</strong>
      <div className="python-console-logs">
        {logs.length === 0 ? (
          <div className="python-console-empty">No output</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="python-console-line">{log}</div>
          ))
        )}
      </div>
    </div>
  );
};

export default PythonConsole;
