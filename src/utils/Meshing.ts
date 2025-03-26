import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';

export function generateMeshFromVolume(
  rawData: Uint8Array,
  resolution: number,
  isovalue: number
): THREE.BufferGeometry {
  // Convert rawData (Uint8Array with values 0-255) to normalized floats (0.0 to 1.0)
  const field = new Float32Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    field[i] = rawData[i] / 255;
  }

  // Create a dummy material since we only need the geometry.
  const dummyMaterial = new THREE.MeshBasicMaterial();
  
  // Provide an empty render callback as the fifth parameter to the constructor.
  const mc = new MarchingCubes(resolution, dummyMaterial, false, false);

  // Set the field (expected length: resolution^3)
  mc.field = field;

  // Set the isovalue (MarchingCubes uses the 'isolation' property)
  mc.isolation = isovalue;

  // Reset and update the geometry.
  mc.reset();
  mc.update(); 

  // Return a cloned geometry to avoid linking to internal state.
  return mc.geometry.clone();
}
