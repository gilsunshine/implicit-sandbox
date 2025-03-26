import { useEffect, useRef } from 'react';
import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import vertexV2 from '../shaders/vertex.glsl?raw';
import fragmentV2 from '../shaders/fragment.glsl?raw';

interface ThreeCanvasProps {
  rawData: Uint8Array | null;
  uniformsOverrides: {
    u_dt: number;
    u_color: number;
    u_alphaVal: number;
    u_isoValue: number;
    u_crossSectionSize: { x: number; y: number; z: number };
  };
}

const dim = 256;

const ThreeCanvas = ({ rawData, uniformsOverrides }: ThreeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Refs to hold scene objects so they aren't reinitialized on every update
  const sceneRef = useRef<Three.Scene | null>(null);
  const cameraRef = useRef<Three.PerspectiveCamera | null>(null);
  const rendererRef = useRef<Three.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<Three.Mesh | null>(null);
  const clockRef = useRef<Three.Clock>(new Three.Clock());
  const uniformsRef = useRef<any>(null);
  const volumeTextureRef = useRef<Three.Data3DTexture | null>(null);

  // Initialize the scene only once
  useEffect(() => {
    if (!canvasRef.current) {
      console.log("Canvas not ready");
      return;
    }
    
    // Use either the provided rawData or fallback dummy data (so scene initializes)
    const initialData = rawData ? rawData : new Uint8Array(dim * dim * dim).fill(128);
    
    const width = window.innerHeight / 2;
    const height = window.innerHeight / 2;
    
    // Renderer
    const renderer = new Three.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    
    // Camera (we set it once so it won't reset on slider changes)
    const camera = new Three.PerspectiveCamera(5, width / height, 0.01, 1000);
    camera.position.set(6, 6, 10);
    camera.lookAt(new Three.Vector3(0, 0, 0));
    cameraRef.current = camera;
    
    // Scene
    const scene = new Three.Scene();
    sceneRef.current = scene;
    
    // Controls (OrbitControls preserve camera state between updates)
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    
    // Volume texture (store in a ref so it can be updated later)
    const volumeDataTexture = new Three.Data3DTexture(initialData, dim, dim, dim);
    volumeDataTexture.format = Three.RedFormat;
    volumeDataTexture.minFilter = Three.LinearFilter;
    volumeDataTexture.magFilter = Three.LinearFilter;
    volumeDataTexture.wrapS = Three.RepeatWrapping;
    volumeDataTexture.wrapT = Three.RepeatWrapping;
    volumeDataTexture.needsUpdate = true;
    volumeTextureRef.current = volumeDataTexture;
    
    // Create uniforms object (store in ref)
    const uniforms = {
      u_camera: { value: camera.position },
      u_resolution: { value: new Three.Vector3(width, height, 1) },
      u_dt: { value: uniformsOverrides.u_dt },
      u_time: { value: 0.0 },
      u_crossSectionSize: {
        value: new Three.Vector3(
          uniformsOverrides.u_crossSectionSize.x,
          uniformsOverrides.u_crossSectionSize.y,
          uniformsOverrides.u_crossSectionSize.z
        )
      },
      u_color: { value: uniformsOverrides.u_color },
      u_volume: { value: volumeDataTexture },
      u_isoValue: { value: uniformsOverrides.u_isoValue },
      u_alphaVal: { value: uniformsOverrides.u_alphaVal },
    };
    uniformsRef.current = uniforms;
    
    // Create a box mesh with shader material
    const geo1 = new Three.BoxGeometry(2);
    const mat1 = new Three.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      // Remove unsupported "format" property from ShaderMaterial
      vertexShader: vertexV2,
      fragmentShader: fragmentV2,
    });
    const mesh1 = new Three.Mesh(geo1, mat1);
    // Apply initial rotation
    mesh1.rotation.y = Math.PI / 2;
    meshRef.current = mesh1;
    scene.add(mesh1);
    
    // Start animation loop (only updates uniforms and renders, does not reinitialize scene)
    const clock = new Three.Clock();
    clockRef.current = clock;
    const animate = () => {
      controls.update();
      // (Optional) Mesh can spin continuously:
      // mesh1.rotation.y += 0.01;
      uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  }, []); // Run once
  
  // Update shader uniforms when slider values change (without reinitializing the scene)
  useEffect(() => {
    if (!uniformsRef.current) return;
    uniformsRef.current.u_dt.value = uniformsOverrides.u_dt;
    uniformsRef.current.u_color.value = uniformsOverrides.u_color;
    uniformsRef.current.u_alphaVal.value = uniformsOverrides.u_alphaVal;
    uniformsRef.current.u_isoValue.value = uniformsOverrides.u_isoValue;
    uniformsRef.current.u_crossSectionSize.value.set(
      uniformsOverrides.u_crossSectionSize.x,
      uniformsOverrides.u_crossSectionSize.y,
      uniformsOverrides.u_crossSectionSize.z
    );
  }, [uniformsOverrides]);
  
  // Update the volume texture if rawData changes (without reinitializing the scene)
  useEffect(() => {
    if (volumeTextureRef.current && rawData) {
      volumeTextureRef.current.image.data = rawData;
      volumeTextureRef.current.needsUpdate = true;
    }
  }, [rawData]);
  
  return <canvas ref={canvasRef}></canvas>;
};

export default ThreeCanvas;
