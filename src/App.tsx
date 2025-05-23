import { useState, useRef, useCallback, useEffect } from "react";
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

const DEFAULT_PYTHON_CODE = `# Welcome to Fields!
# Use the control panel to update display settings and export meshes!

# You can find a list of built-in functions here: https://github.com/gilsunshine/fields_documentation/blob/main/fields_documentation.py
# And their definitions here: https://github.com/gilsunshine/implicit-sandbox/blob/main/src/python/scalar_field_lib.py

# Define your own generic scalar field functions below. The built-in functions are mostly signed distance fields but yours don't have to be! 

import numpy as np

# Define shapes using preloaded functions
box = sdf_box()

# Chain transformations
box = box.scale(0.25, 0.25, 0.5).rotate_y(np.pi / 3, origin=(0.5, 0.5, 0.5)).rotate_x(np.pi / 4).translate(ty=-0.25)

# Alternatively, change parameters on function call
box2 = sdf_box(bounds=(0.1, 0.2, 0.3), center=(0.5, 0.5, 0.4))

# Try different shapes
sphere = sdf_sphere(radius=0.4)

# Some fun stuff like tpms built in, more to come
tpms = gyroid(4.0)

# Composite shapes
shape = smooth_intersection(sphere, tpms, 0.2)

# Play with built in operations like twisting
shape = op_twist(shape, k=4)

# Write your own functions
def my_sphere(size, x, y, z, xOff, yOff, zOff):
  return np.exp(-size * ((x-xOff)**2 + (y-yOff)**2 + (z-zOff)**2))

# Must have final scalar field returned from scalar_field function.
def scalar_field(x, y, z):
    # Try return shape(x, y, z) instead
    return tpms(x, y, z)
  
  

`;

const App = () => {
  const [rawData, setRawData] = useState<Float32Array | null>(null);
  const [loading, setLoading] = useState(true);
  const [pythonError, setPythonError] = useState<string[]>([]);
  const [renderMode, setRenderMode] = useState<"surface" | "volume">("volume");
  // const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [editorWidth, setEditorWidth] = useState(0);
  const [u_dim, setUDim] = useState(128); // default low


  // Create a ref for the CodeEditor
  const editorRef = useRef<CodeEditorHandle>(null);
  const canvasRef = useRef<{ resize: () => void } | null>(null);
  const aboutButtonRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);


  // Slider controls state
  const [u_dt, setUDt] = useState(0.004);
  const [u_color, setUColor] = useState(1.0);
  const [u_alphaVal, setUAlphaVal] = useState(5);
  const [u_isoValue, setUIsoValue] = useState(0);
  const [u_crossSectionSize, setUCrossSectionSize] = useState({ x: 0.0, y: 0.0, z: 0.0 });
  const [showControls, setShowControls] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [u_minValue, setUMinVal] = useState(-0.5);
  const [u_maxValue, setUMaxVal] = useState(0.5);

   // Run the default code once on mount

   useEffect(() => {
    async function runDefault() {
      if (editorRef.current) {
        const code = editorRef.current.getCode();
        try {
          const result = await executePythonCode(code, u_dim);
          console.log("Generated data:", result.length);

          setRawData(result);

          let min = Infinity;
          let max = -Infinity;
      
          for (let i = 0; i < result.length; i++) {
            const v = result[i];
            if (v < min) min = v;
            if (v > max) max = v;
          }
          setUMinVal(min)
          setUMaxVal(max)

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

  useEffect(() => {
    if (u_dim > 0) {
      const timeout = setTimeout(() => {
        handleRunCode(); 
      }, 150); 
  
      return () => clearTimeout(timeout);
    }
  }, [u_dim]);


  // When "Run Code" is pressed, get the current code from the editor and evaluate it
  const handleRunCode = useCallback(async () => {
    if (editorRef.current) {
      const code = editorRef.current.getCode();
      console.log("Linting and evaluating code...");
      setLoading(true);
      setPythonError([]);
      // setConsoleLogs([]);
  
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
        const result = await executePythonCode(code, u_dim);
        console.log("Generated data:", result.length);
        setRawData(result);

        let min = Infinity;
        let max = -Infinity;
    
        for (let i = 0; i < result.length; i++) {
          const v = result[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }
        setUMinVal(min)
        setUMaxVal(max)

      } catch (err: any) {
        const rawMessages = err.message.split("\n\n");
        const formattedErrors = rawMessages.map(extractRelevantPythonError);
        setPythonError(formattedErrors);
      }
  
      setLoading(false);
    }
  }, [u_dim]);

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
    const fullGeometry: THREE.BufferGeometry = generateMeshFromScalarField(rawData, u_dim, 1, u_isoValue * 255);
  
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
    u_dt, 
    u_color, 
    u_alphaVal, 
    u_isoValue, 
    u_crossSectionSize, 
    u_renderMode: renderMode === "volume" ? 1.0 : 0.0,
    u_minValue,
    u_maxValue,
    u_dim
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
              u_dim={u_dim}
              setUDim={setUDim}
              handleRunCode={handleRunCode}
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