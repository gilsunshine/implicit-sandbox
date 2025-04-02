import { useEffect, useRef } from 'react';
import * as Three from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import vertexV2 from '../shaders/vertex.glsl?raw';
import fragmentV2 from '../shaders/fragment.glsl?raw';

interface ThreeCanvasProps {
  rawData: Float32Array | null;
  uniformsOverrides: {
    u_dt: number;
    u_color: number;
    u_alphaVal: number;
    u_isoValue: number;
    u_crossSectionSize: { x: number; y: number; z: number };
    u_renderMode: number;
    u_minValue: number;
    u_maxValue: number;
  };
}

const dim = 256;

const ThreeCanvas = ({
  rawData,
  uniformsOverrides,
}: ThreeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Refs to hold scene objects so they aren't reinitialized on every update
  const sceneRef = useRef<Three.Scene | null>(null);
  const cameraRef = useRef<Three.OrthographicCamera | null>(null);
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
    if (rawData && rawData.length !== dim * dim * dim) {
      console.warn("⚠️ rawData length mismatch", rawData.length);
    }

    const initialData = rawData ? rawData : new Float32Array(dim * dim * dim).fill(128);
    
    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;
      
    // Renderer
    const renderer = new Three.WebGLRenderer({ canvas: canvasRef.current, antialias: true, preserveDrawingBuffer: true, });
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    
    // Camera (we set it once so it won't reset on slider changes)
    const camera = new Three.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 0, 1000 );
    camera.position.set(10, 10, 10);
    camera.zoom = 350;
    // camera.lookAt(new Three.Vector3(0, 0, 0));
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
    volumeDataTexture.type = Three.FloatType; 
    volumeDataTexture.internalFormat = 'R32F';
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
      u_renderMode: { value: uniformsOverrides.u_renderMode },
      u_alphaVal: { value: uniformsOverrides.u_alphaVal },
      u_minValue: { value: uniformsOverrides.u_minValue },
      u_maxValue: { value: uniformsOverrides.u_maxValue },
    };
    uniformsRef.current = uniforms;
    
    // Create a box mesh with shader material
    const geo1 = new Three.BoxGeometry(2);
    const mat1 = new Three.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
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
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  }, []); 
  
  // Update shader uniforms when slider values change (without reinitializing the scene)
  useEffect(() => {
    if (!uniformsRef.current) return;
    uniformsRef.current.u_dt.value = uniformsOverrides.u_dt;
    uniformsRef.current.u_color.value = uniformsOverrides.u_color;
    uniformsRef.current.u_alphaVal.value = uniformsOverrides.u_alphaVal;
    uniformsRef.current.u_isoValue.value = uniformsOverrides.u_isoValue;
    uniformsRef.current.u_renderMode.value = uniformsOverrides.u_renderMode;
    uniformsRef.current.u_crossSectionSize.value.set(
      uniformsOverrides.u_crossSectionSize.x,
      uniformsOverrides.u_crossSectionSize.y,
      uniformsOverrides.u_crossSectionSize.z
    );
  }, [uniformsOverrides]);
  
  // Update the volume texture if rawData changes (without reinitializing the scene)
  useEffect(() => {
    if (!rawData || !volumeTextureRef.current || !uniformsRef.current) return;
  
    const expectedLength = dim * dim * dim;
    if (rawData.length !== expectedLength) {
      console.warn("rawData length mismatch", rawData.length, "expected", expectedLength);
      return;
    }

    const newTexture = new Three.Data3DTexture(rawData, dim, dim, dim);
    newTexture.format = Three.RedFormat;
    newTexture.type = Three.FloatType;
    newTexture.internalFormat = 'R32F';
    newTexture.minFilter = Three.LinearFilter;
    newTexture.magFilter = Three.LinearFilter;
    newTexture.unpackAlignment = 1;
    newTexture.needsUpdate = true;
  
    volumeTextureRef.current = newTexture;
    uniformsRef.current.u_volume.value = newTexture;

    uniformsRef.current.u_minValue.value = uniformsOverrides.u_minValue;
    uniformsRef.current.u_maxValue.value = uniformsOverrides.u_maxValue;

  }, [rawData]);
  
  
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
  
    if (!container || !renderer || !camera || !scene) return;
  
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
  
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
  
      // camera.aspect = width / height;
      camera.updateProjectionMatrix();
  
      if (uniformsRef.current) {
        uniformsRef.current.u_resolution.value.set(width, height, 1);
      }
  
      renderer.render(scene, camera);
    });
  
    observer.observe(container);
  
    return () => observer.disconnect();
  }, []);
  
  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );

};

export default ThreeCanvas;