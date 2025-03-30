import React, { useState, useRef, useCallback, useEffect } from "react";
import CodeEditor, { CodeEditorHandle } from "./components/CodeEditor";
import ThreeCanvas from './components/ThreeCanvas';
import { lintPythonCode, executePythonCode } from "./utils/pyodideRunner";
import { generateMeshFromScalarField } from "./utils/MarchingCubes";
import { splitBufferGeometry } from "./utils/splitBufferGeometry";
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import * as THREE from "three";
import { BounceLoader } from "react-spinners";
import Split from 'react-split';
import AboutPopup from "./components/AboutPopup";
import ControlsPanel from "./components/ControlsPanel";
import PythonConsole from "./components/PythonConsole";



import './App.css';
import Draggable from "react-draggable";

const DEFAULT_PYTHON_CODE = `# Define your scalar_field function below.
# You can find example functions here: https://github.com/gilsunshine/implicit-sandbox/blob/main/src/python/scalar_field_lib.py
# Project in development! Updates and improvements forthcoming.

import numpy as np

# SDF: Sphere
def sdf_sphere(x, y, z, center=(0.5, 0.5, 0.5), radius=0.35):
    dx = x - center[0]
    dy = y - center[1]
    dz = z - center[2]
    return np.sqrt(dx**2 + dy**2 + dz**2) - radius

# Generic Scalar Field: Wave pattern
def wave_pattern(x, y, z, freq=5.0):
    return (np.sin(freq * x) + np.sin(freq * y) + np.sin(freq * z)) / 3.0

# Smooth step function for blending
def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)

# Final scalar field
def scalar_field(x, y, z):
    sdf = sdf_sphere(x, y, z)
    wave = wave_pattern(x, y, z, freq=20.0)

    # Blend wave pattern inside the sphere using a soft mask
    mask = smoothstep(0.0, 0.1, -sdf)  # 1 inside, 0 outside
    blended = wave * mask + sdf * (1.0 - mask)

    # Normalize to [-1, 1]
    blended = np.clip(blended, -1.0, 1.0)
    return blended
`;

const App = () => {
  const [pythonCode, setPythonCode] = useState(DEFAULT_PYTHON_CODE);
  const [rawData, setRawData] = useState<Float32Array | null>(null);
  const [loading, setLoading] = useState(true);
  const [pythonError, setPythonError] = useState<string[]>([]);
  const [renderMode, setRenderMode] = useState<"surface" | "volume">("volume");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [consolePos, setConsolePos] = useState({ top: 0, left: 0 });
  const [editorWidth, setEditorWidth] = useState(0);

  // Create a ref for the CodeEditor
  const editorRef = useRef<CodeEditorHandle>(null);
  const canvasRef = useRef<{ resize: () => void } | null>(null);
  const aboutButtonRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);




  // Slider controls state
  const [u_dt, setUDt] = useState(0.01);
  const [u_color, setUColor] = useState(1.0);
  const [u_alphaVal, setUAlphaVal] = useState(10.0);
  const [u_isoValue, setUIsoValue] = useState(0);
  const [u_crossSectionSize, setUCrossSectionSize] = useState({ x: 0.0, y: 0.0, z: 0.0 });
  const [showControls, setShowControls] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [aboutPosition, setAboutPosition] = useState({ x: 100, y: 100 });

   // Run the default code once on mount
   useEffect(() => {
    async function runDefault() {
      if (editorRef.current) {
        const code = editorRef.current.getCode();
        try {
          const result = await executePythonCode(code);
          console.log("✅ Generated data:", result.length);

          setRawData(result);
        } catch (error) {
          console.error("Error executing default Python code:", error);
        }
      }
      setLoading(false);
    }
    runDefault();
  }, []);

  useEffect(() => {
    if (!editorContainerRef.current) return;
  
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setEditorWidth(entry.contentRect.width);
      }
    });
  
    observer.observe(editorContainerRef.current);
  
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log("Render mode changed:", renderMode);
  }, [renderMode]);

  useEffect(() => {
    const onWindowResize = () => canvasRef.current?.resize();
    window.addEventListener("resize", onWindowResize);
    return () => window.removeEventListener("resize", onWindowResize);
  }, []);


  // When "Run Code" is pressed, get the current code from the editor and evaluate it
  const handleRunCode = useCallback(async () => {
    if (editorRef.current) {
      const code = editorRef.current.getCode();
      console.log("Linting and evaluating code...");
      setLoading(true);
      setPythonError([]);
      setConsoleLogs([]);
  
      // First, lint the code
      const lintResults = await lintPythonCode(code);
      if (lintResults.length > 0) {
        const formatted = lintResults.map(e => 
          `Line ${e.line + 1}, Col ${e.column + 1}: ${e.message}`
        );
        setPythonError(formatted);
        setLoading(false); // prevent spinner hanging
        return; // stop execution on lint errors
      }
  
      const extractRelevantPythonError = (fullError: string): string => {
        const lines = fullError.split("\n");
        const startIndex = lines.findIndex(line =>
          line.includes('File "<exec>"') || line.includes('File "<stdin>"')
        );
        if (startIndex === -1) return fullError;
        return lines.slice(startIndex, startIndex + 4).join("\n");
      };
  
      try {
        const result = await executePythonCode(code);
        console.log("✅ Generated data:", result.length);

        setRawData(result);
      } catch (err: any) {
        const rawMessages = err.message.split("\n\n");
        const formattedErrors = rawMessages.map(extractRelevantPythonError);
        setPythonError(formattedErrors);
      }
  
      setLoading(false);
    }
  }, []);

  const dim = 256; // Resolution

  const handleSaveMesh = useCallback(() => {
    if (!rawData) {
      console.error("No volume data available to generate mesh.");
      return;
    }
    const remappedValues = new Float32Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      const val = (rawData[i] + 1) * 0.5 * 255; // [-1,1] → [0,255]
      remappedValues[i] = Math.max(0, Math.min(255, val)); // Clamp
    }
    
    // Then pass it in:
    const fullGeometry: THREE.BufferGeometry = generateMeshFromScalarField(rawData, dim, 1, u_isoValue);
  
    const triangleCount = fullGeometry.index
      ? fullGeometry.index.count / 3
      : fullGeometry.attributes.position.count / 3;
  
    const maxTriangles = 80000;
  
    const exporter = new STLExporter();
  
    if (triangleCount > maxTriangles) {
      // If too large, split then recombine:
      const chunks = splitBufferGeometry(fullGeometry, maxTriangles);
  
      const mergedGeometry = BufferGeometryUtils.mergeGeometries(chunks, true);
  
      const stlString = exporter.parse(
        new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial()),
        { binary: true }
      );
  
      const blob = new Blob([stlString], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "mesh_" + Date.now() + ".stl";
      link.click();
    } else {
      // Small enough: export directly
      const stlString = exporter.parse(
        new THREE.Mesh(fullGeometry, new THREE.MeshBasicMaterial()),
        { binary: true }
      );
  
      const blob = new Blob([stlString], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "mesh_" + Date.now() + ".stl";
      link.click()
    }
  }, [rawData, u_isoValue]);
  
  // Combine uniform overrides in an object that is memoized if needed
  const uniformsOverrides = { 
    u_dt, u_color, 
    u_alphaVal, 
    u_isoValue, 
    u_crossSectionSize, 
    u_renderMode: renderMode === "volume" ? 1.0 : 0.0,
  };

  return (
    <div className="app-container">
    {showAbout && <AboutPopup onClose={() => setShowAbout(false)} aboutButtonRef={aboutButtonRef} />}

      <div className="header">
        <div className="header-left">
          <h2 className="title">Fields</h2>
          <span 
            style={{ color: "#aaa", cursor: "pointer", fontSize: "14px" }} 
            ref={aboutButtonRef}
            onClick={() => setShowAbout((prev) => !prev)}
             >
            About
          </span>    
        </div>
        <div className="header-right">
          <button 
            style={{ background: "rgb(255, 77, 246)", color: "#000", cursor: "pointer", fontSize: "14px" }} 
            onClick={() => showControls ? setShowControls(false) : setShowControls(true)}
          >
            Controls
          </button>    
        </div>      
      </div>
      <Split className="split-container" sizes={[45, 55]} minSize={200} gutterSize={8}>
        {/* LEFT: Editor */}
        <div className="editor-panel" ref={editorContainerRef}>
        <CodeEditor initialCode={DEFAULT_PYTHON_CODE} ref={editorRef} />
        <div className="console-button-wrapper">
          <button className="evaluate-btn" ref={buttonRef} onClick={handleRunCode}>
            Evaluate
          </button>
        </div>
      </div>

      {/* RIGHT: Canvas + controls */}
      <div className="canvas-panel">
        <ThreeCanvas rawData={rawData} uniformsOverrides={uniformsOverrides} />

        {loading && (
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgb(225, 255, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}>
            <BounceLoader size={200} color={"rgb(225, 255, 0)"} />
          </div>
        )}

          {!loading && showControls && (
            <ControlsPanel
              u_dt={u_dt}
              setUDt={setUDt}
              u_color={u_color}
              setUColor={setUColor}
              u_alphaVal={u_alphaVal}
              setUAlphaVal={setUAlphaVal}
              u_isoValue={u_isoValue}
              setUIsoValue={setUIsoValue}
              u_crossSectionSize={u_crossSectionSize}
              setUCrossSectionSize={setUCrossSectionSize}
              renderMode={renderMode}
              setRenderMode={setRenderMode}
              handleSaveMesh={handleSaveMesh}
              onClose={() => setShowControls(false)}
            />
          )}

        </div>
        </Split>
        {pythonError.length > 0 && <PythonConsole errors={pythonError} editorWidth={editorWidth} />}
      </div>

  );
};

export default App;