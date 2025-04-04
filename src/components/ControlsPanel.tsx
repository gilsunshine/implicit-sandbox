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

  u_dim: number;
  setUDim: (res: number) => void;

  handleRunCode: () => void;
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
    u_dim,
    setUDim,
    handleSaveMesh,
  }) => {
  return (
    <div className="control-panel">
      {/* <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "6px",
          right: "0px",
          background: "transparent",
          border: "none",
          fontSize: "24px",
          color: "#000",
          cursor: "pointer",
        }}
        title="Close"
      >
        ✕
      </button> */}


      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginLeft: "8px", marginRight: "8px", paddingTop: "10px"}}>

        <Slider label="X Section" value={u_crossSectionSize.x} setValue={(x) => setUCrossSectionSize({ ...u_crossSectionSize, x })} min={-1.0} max={1.0} step={0.02} />
        <Slider label="Y Section" value={u_crossSectionSize.y} setValue={(y) => setUCrossSectionSize({ ...u_crossSectionSize, y })} min={-1.0} max={1.0} step={0.02} />
        <Slider label="Z Section" value={u_crossSectionSize.z} setValue={(z) => setUCrossSectionSize({ ...u_crossSectionSize, z })} min={-1.0} max={1.0} step={0.02} />

        <div style={{ marginTop: "22px" }}>
        <label  style={{ fontSize:"20px" }}>
          <input
            style={{ marginLeft:"0px", marginRight: "10px" }}
            type="radio"
            name="renderMode"
            value="volume"
            checked={renderMode === "volume"}
            onChange={() => setRenderMode("volume")}
          />
          Volume
        </label>
        </div>
        <Slider label="Alpha" value={u_alphaVal} setValue={setUAlphaVal} min={0.00} max={10.00} step={0.01} />
        <div style={{ marginTop: "22px" }}>
            <label style={{ fontSize:"20px"}}>
            <input
                style={{ marginLeft:"0px", marginRight: "10px" }}
                type="radio"
                name="renderMode"
                value="surface"
                checked={renderMode === "surface"}
                onChange={() => setRenderMode("surface")}
            />
            Surface
            </label>
            </div>
            <Slider label="Step Size" value={u_dt} setValue={setUDt} min={0.001} max={0.016} step={0.001} />
            <Slider label="Iso Value" value={u_isoValue} setValue={setUIsoValue} min={-1} max={1} step={0.01} />


            <div style={{ marginBottom: "0px", marginTop: "10px" }}>
              <strong>Material:</strong>
                <div>
                <label>
                    <input
                        style={{ marginLeft:"0px", marginRight: "10px" }}
                        type="radio"
                        name="materialMode"
                        value="normal"
                        checked={u_color === 0}
                        onChange={() => setUColor(0)}
                    />
                      Normal
                </label>
                <label style={{ marginLeft: "20px" }}>
                    <input
                        style={{ marginRight: "10px" }}
                        type="radio"
                        name="materialMode"
                        value="phong"
                        checked={u_color === 1}
                        onChange={() => setUColor(1)}
                    />
                      Phong
                </label>
                </div>
           </div>

           <div style={{ marginBottom: "20px", marginTop: "10px" }}>
          <strong>Resolution:</strong>
              <div>
                <label style={{marginTop: "20px"}}>
                      <input
                          style={{ marginLeft:"0px", marginRight: "10px" }}
                          type="radio"
                          name="resolution"
                          value="low"
                          checked={u_dim === 128}
                          onChange={() => setUDim(128)}
                      />
                        Low
                  </label>
                  <label style={{ marginLeft: "20px" }}>
                      <input
                          style={{ marginRight: "10px" }}
                          type="radio"
                          name="resolution"
                          value="high"
                          checked={u_dim === 256}
                          onChange={() => setUDim(256)}
                      />
                        High
                  </label>
              </div>

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
        }}
      >
        Save STL
      </button>
      </div>
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
