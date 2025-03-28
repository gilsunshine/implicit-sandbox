import React from "react";
import "../styling/AboutPopup.css"; // Optional: for styles

interface AboutProps {
  onClose: () => void;
}

const AboutPopup: React.FC<AboutProps> = ({ onClose }) => {
  return (
    <div className="about-overlay">
      <div className="about-popup">
        {/* <button className="about-close" onClick={onClose}>✕</button> */}
        <p>
          Fields is a volumetric modeling sandbox that uses Python-defined scalar fields and GPU-powered raymarching for real-time rendering.
        </p>
        <p>
          Switch between volume and surface view, tune parameters, and export meshes with marching cubes!
        </p>
        <p>
            Created by Gil Sunshine with help from the collective efforts of people on the internet.
        </p>
      </div>
    </div>
  );
};

export default AboutPopup;
