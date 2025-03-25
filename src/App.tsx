import { useState, useCallback, useEffect } from 'react';
import CodeEditor from './components/CodeEditor';
import ThreeCanvas from './components/ThreeCanvas';
import { executePythonCode } from "./utils/pyodideRunner";
import './App.css';

const DEFAULT_PYTHON_CODE = `# Define your scalar_field function below!
import numpy as np

def scalar_field(x, y, z):
    return np.exp(-10 * ((x-0.5)**2 + (y-0.5)**2 + (z-0.5)**2))
`;

const App = () => {
  const [pythonCode, setPythonCode] = useState(DEFAULT_PYTHON_CODE);
  const [rawData, setRawData] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(true);

  // Slider controls state
  const [u_dt, setUDt] = useState(0.01);
  const [u_color, setUColor] = useState(3);
  const [u_alphaVal, setUAlphaVal] = useState(1.0);
  const [u_isoValue, setUIsoValue] = useState(1);
  const [u_crossSectionSize, setUCrossSectionSize] = useState({ x: 0.5, y: 0.5, z: 0.5 });

  // Memoize the code update callback
  const handleSetCode = useCallback((newCode: string) => {
    setPythonCode(newCode);
  }, []);

  // Separately, a callback to run the code (not triggered on every slider update)
  const handleRunCode = useCallback(async () => {
    try {
      const result = await executePythonCode(pythonCode);
      setRawData(result);
    } catch (error) {
      console.error("Error executing Python code:", error);
    }
  }, [pythonCode]);

    // Run default Python code on mount
    useEffect(() => {
      async function runDefault() {
        try {
          const result = await executePythonCode(pythonCode);
          setRawData(result);
        } catch (error) {
          console.error("Error executing default Python code:", error);
        }
        setLoading(false);
      }
      runDefault();
    }, [pythonCode]);

  // Combine uniform overrides in an object that is memoized if needed
  const uniformsOverrides = { u_dt, u_color, u_alphaVal, u_isoValue, u_crossSectionSize };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#121212",
          color: "#fff",
        }}
      >
        <h1>Setting Up Volumetric Sandbox</h1>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div>
        <h1>Volumetric Sandbox!</h1>
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        <div className="custom-scroll">
          <CodeEditor 
            code={pythonCode} 
            setCode={handleSetCode} 
            setRawData={setRawData}
          />
        </div>
        <div className="canvas-container" style={{ position: "relative", display: "inline-block" }}>
          <ThreeCanvas 
            rawData={rawData}
            uniformsOverrides={uniformsOverrides}
          />
            <div 
              className="controls-panel" 
              style={{
                position: "absolute",
                left: 0,
                bottom: -75,
                width: "100%",
                background: "rgba(255,255,255,0.8)",
                padding: "10px",
                boxSizing: "border-box",
              }}
            >
              <button onClick={handleRunCode} style={{ marginBottom: "10px", padding: "8px", cursor: "pointer" }}>
                Evaluate Python
              </button>
              <div 
              className="controls-panel" 
              style={{
                position: "absolute",
                left: 0,
                bottom: -150, // Adjust this value to place the panel below the canvas
                width: "100%",
                background: "rgba(255,255,255,0.8)",
                padding: "10px",
                boxSizing: "border-box",
              }}
            >

              <div>
                <label>
                  Step Size: 
                  <input 
                    type="range" 
                    min="0.004" 
                    max="0.016" 
                    step="0.002" 
                    value={u_dt} 
                    onChange={(e) => setUDt(parseFloat(e.target.value))}
                  />
                  {u_dt}
                </label>
              </div>
              <div>
                <label>
                  Alpha Value: 
                  <input 
                    type="range" 
                    min="0.01" 
                    max="0.4" 
                    step="0.01" 
                    value={u_alphaVal} 
                    onChange={(e) => setUAlphaVal(parseFloat(e.target.value))}
                  />
                  {u_alphaVal}
                </label>
              </div>
              <div>
                <label>
                  Iso Value: 
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.04" 
                    value={u_isoValue} 
                    onChange={(e) => setUIsoValue(parseFloat(e.target.value))}
                  />
                  {u_isoValue}
                </label>
              </div>
              <div>
                <label>
                  Cross Section X: 
                  <input 
                    type="range" 
                    min="0.02" 
                    max="0.5" 
                    step="0.02" 
                    value={u_crossSectionSize.x} 
                    onChange={(e) => 
                      setUCrossSectionSize({
                        ...u_crossSectionSize,
                        x: parseFloat(e.target.value)
                      })
                    }
                  />
                  {u_crossSectionSize.x}
                </label>
              </div>
              <div>
                <label>
                  Cross Section Y: 
                  <input 
                    type="range" 
                    min="0.02" 
                    max="0.5" 
                    step="0.02" 
                    value={u_crossSectionSize.y} 
                    onChange={(e) => 
                      setUCrossSectionSize({
                        ...u_crossSectionSize,
                        y: parseFloat(e.target.value)
                      })
                    }
                  />
                  {u_crossSectionSize.y}
                </label>
              </div>
              <div>
                <label>
                  Cross Section Z: 
                  <input 
                    type="range" 
                    min="0.02" 
                    max="0.5" 
                    step="0.02" 
                    value={u_crossSectionSize.z} 
                    onChange={(e) => 
                      setUCrossSectionSize({
                        ...u_crossSectionSize,
                        z: parseFloat(e.target.value)
                      })
                    }
                  />
                  {u_crossSectionSize.z}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
