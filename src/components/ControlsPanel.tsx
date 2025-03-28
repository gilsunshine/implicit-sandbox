import React from 'react';
import "../styling/ControlsPanel.css";


type Props = {
  u_dt: number;
  setUDt: (value: number) => void;

  u_color: number;
  setUColor: (value: number) => void;

  u_alphaVal: number;
  setUAlphaVal: (value: number) => void;

  u_isoValue: number;
  setUIsoValue: (value: number) => void;

  u_crossSectionSize: { x: number; y: number; z: number };
  setUCrossSectionSize: (size: { x: number; y: number; z: number }) => void;

  renderMode: 'volume' | 'surface';
  setRenderMode: (mode: 'volume' | 'surface') => void;

  handleSaveMesh: () => void;
  onClose: () => void;
};

const ControlsPanel: React.FC<Props> = ({
    u_dt,
    setUDt,
    u_color,
    setUColor,
    u_alphaVal,
    setUAlphaVal,
    u_isoValue,
    setUIsoValue,
    u_crossSectionSize,
    setUCrossSectionSize,
    renderMode,
    setRenderMode,
    handleSaveMesh,
    onClose,
  }) => {
  return (
    <div className="control-panel">
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "6px",
          right: "6px",
          background: "transparent",
          border: "none",
          fontSize: "18px",
          color: "#fff",
          cursor: "pointer",
        }}
        title="Close"
      >
        ✕
      </button>

      <div style={{ marginBottom: "12px" }}>
        <button
          onClick={() => setUColor(0)}
          style={{ marginRight: "8px", padding: "6px 12px", cursor: "pointer" }}
        >
          Normal
        </button>
        <button
          onClick={() => setUColor(1)}
          style={{ padding: "6px 12px", cursor: "pointer" }}
        >
          Phong
        </button>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label>
          <input
            type="radio"
            name="renderMode"
            value="volume"
            checked={renderMode === "volume"}
            onChange={() => setRenderMode("volume")}
          />
          Volume
        </label>
        <label style={{ marginLeft: "10px" }}>
          <input
            type="radio"
            name="renderMode"
            value="surface"
            checked={renderMode === "surface"}
            onChange={() => setRenderMode("surface")}
          />
          Surface
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Slider label="Step Size" value={u_dt} setValue={setUDt} min={0.001} max={0.016} step={0.001} />
        <Slider label="Alpha" value={u_alphaVal} setValue={setUAlphaVal} min={0.00} max={2.0} step={0.01} />
        <Slider label="Iso Value" value={u_isoValue} setValue={setUIsoValue} min={-1} max={1} step={0.01} />
        <Slider label="X Section" value={u_crossSectionSize.x} setValue={(x) => setUCrossSectionSize({ ...u_crossSectionSize, x })} min={0.02} max={0.5} step={0.01} />
        <Slider label="Y Section" value={u_crossSectionSize.y} setValue={(y) => setUCrossSectionSize({ ...u_crossSectionSize, y })} min={0.02} max={0.5} step={0.01} />
        <Slider label="Z Section" value={u_crossSectionSize.z} setValue={(z) => setUCrossSectionSize({ ...u_crossSectionSize, z })} min={0.02} max={0.5} step={0.01} />
      </div>

      <button
        onClick={handleSaveMesh}
        style={{
          padding: "8px 12px",
          cursor: "pointer",
          background: "rgb(217, 255, 0)",
          color: "#000",
          borderRadius: "6px",
          fontSize: "16px",
          marginTop: "16px"
        }}
      >
        Save STL
      </button>
    </div>
  );
};

type SliderProps = {
    label: string;
    value: number;
    setValue: (value: number) => void;
    min: number;
    max: number;
    step: number;
  };
  
  const Slider: React.FC<SliderProps> = ({ label, value, setValue, min, max, step }) => {
    return (
      <label style={{ display: "flex", flexDirection: "column", fontSize: "14px" }}>
        {label}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="range"
            className="custom-slider"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) {
                setValue(num);
              }
            }}
            style={{
              width: "60px",
              padding: "4px",
              fontSize: "13px",
              background: "rgb(255, 77, 246)",
              color: "#000",
              fontFamily: "Fragment Mono",
              border: "1px solid #444",
              borderRadius: "4px",
            }}
          />
        </div>
      </label>
    );
  };
  

export default ControlsPanel;
