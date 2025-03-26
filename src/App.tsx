import React, { useState, useRef, useCallback, useEffect } from "react";
import CodeEditor, { CodeEditorHandle } from "./components/CodeEditor";
import ThreeCanvas from './components/ThreeCanvas';
import { executePythonCode } from "./utils/pyodideRunner";
import { generateMeshFromVolume } from "./utils/Meshing";
import { generateMeshFromScalarField } from "./utils/MarchingCubes";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import * as THREE from "three";
import './App.css';

const DEFAULT_PYTHON_CODE = `# Define your scalar_field function below!
import numpy as np

def sphere(size, x, y, z, dX, dY, dZ):
  return np.exp(size * ((x-dX)**2 + (y-dY)**2 + (z-dZ)**2))

def scalar_field(x, y, z):
    return sphere(-10, x, y, z, 0.5, 0.5, 0.5)`;

const App = () => {
  const [pythonCode, setPythonCode] = useState(DEFAULT_PYTHON_CODE);
  const [rawData, setRawData] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a ref for the CodeEditor
  const editorRef = useRef<CodeEditorHandle>(null);

  // Slider controls state
  const [u_dt, setUDt] = useState(0.01);
  const u_color = 3;
  const [u_alphaVal, setUAlphaVal] = useState(1.0);
  const [u_isoValue, setUIsoValue] = useState(1);
  const [u_crossSectionSize, setUCrossSectionSize] = useState({ x: 0.5, y: 0.5, z: 0.5 });

   // Run the default code once on mount
   useEffect(() => {
    async function runDefault() {
      if (editorRef.current) {
        const code = editorRef.current.getCode();
        try {
          const result = await executePythonCode(code);
          setRawData(result);
        } catch (error) {
          console.error("Error executing default Python code:", error);
        }
      }
      setLoading(false);
    }
    runDefault();
  }, []);

  // When "Run Code" is pressed, get the current code from the editor and evaluate it
  const handleRunCode = useCallback(async () => {
    if (editorRef.current) {
      const code = editorRef.current.getCode();
      console.log("Evaluating code:", code);
      try {
        const result = await executePythonCode(code);
        console.log(result);
        setRawData(result);
      } catch (error) {
        console.error("Error executing Python code:", error);
      }
    }
  }, []);

  // When "Save Mesh" is pressed, generate a mesh using MarchingCubes and export it as STL
  const handleSaveMesh = useCallback(() => {
    if (!rawData) {
      console.error("No volume data available to generate mesh.");
      return;
    }
    // Generate a mesh geometry using your MarchingCubes utility
    // const geometry: THREE.BufferGeometry = generateMeshFromVolume(rawData, 256, u_isoValue);
    const geometry: THREE.BufferGeometry = generateMeshFromScalarField(rawData, 32);

    // Create a temporary mesh (material is not important for export)
    console.log(rawData)
    const tempMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
    const exporter = new STLExporter();
    const stlString = exporter.parse(tempMesh);
    const blob = new Blob([stlString], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "mesh.stl";
    link.click();
  }, [rawData, u_isoValue]);

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
          background: "#fff",
          color: "#000",
        }}
      >
        <h1>Setting Up Volumetric Sandbox</h1>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div>
        <h2>
          Implicit Sandbox
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        <div className="custom-scroll">
          <CodeEditor initialCode={DEFAULT_PYTHON_CODE} ref={editorRef} />
        </div>
        <div className="canvas-container" style={{ position: "relative", display: "inline-block" }}>
          <ThreeCanvas 
            rawData={rawData}
            uniformsOverrides={uniformsOverrides} />
          <div
            className="controls-panel"
            style={{
              position: "absolute",
              left: 0,
              bottom: -75, // Adjust as needed
              width: "100%",
              background: "rgba(255,255,255,0.8)",
              padding: "10px",
              boxSizing: "border-box",
            }}
          >
            <button
              onClick={handleRunCode}
              style={{ marginBottom: "10px", padding: "8px", cursor: "pointer" }}
            >
              Evaluate Python
            </button>
            <button
              onClick={handleSaveMesh}
              style={{ marginBottom: "10px", marginLeft: "10px", padding: "8px", cursor: "pointer" }}
            >
              Save Mesh
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
                    max="2.0" 
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
      {/* <div style={{width: "40%", gap: "20px" }}>
          <h4>
            Welcome to Volumetric Sandbox!
          </h4>
          <p>
            You can find a tutorial here.
          </p>
          <p>
            Made by gilsunshine.
          </p>
        </div> */}
    </div>
  );
};

export default App;
