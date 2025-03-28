import React, { useEffect, useRef } from 'react';
import "../styling/AboutPopup.css"; // Optional: for styles

type Props = {
    onClose: () => void;
    aboutButtonRef: React.RefObject<HTMLElement | null>;
  };

const AboutPopup: React.FC<Props> = ({ onClose, aboutButtonRef }) => {
    const popupRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          const target = event.target as Node;
    
          if (
            popupRef.current &&
            !popupRef.current.contains(target) &&
            aboutButtonRef.current &&
            !aboutButtonRef.current.contains(target)
          ) {
            onClose();
          }
        };
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, [onClose, aboutButtonRef]);
  
  return (
    <div ref={popupRef} className="about-overlay">
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
