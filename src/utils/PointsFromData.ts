import * as THREE from 'three';

/**
 * Creates a BufferGeometry containing all points in a 3D grid, along with their scalar values.
 *
 * @param rawData - A Uint8Array with length = resolution³. Each element represents a scalar (0–255).
 * @param resolution - The number of voxels along one axis.
 * @param scale - A scale factor for the point positions (default is 1).
 * @returns A THREE.BufferGeometry with two attributes: "position" (vec3) and "value" (float).
 */
export function createVolumePointsGeometry(
  rawData: Uint8Array,
  resolution: number,
  scale: number = 1
): THREE.BufferGeometry {
  const numPoints = resolution * resolution * resolution;
  // Each point has 3 position components
  const positions = new Float32Array(numPoints * 3);
  // One scalar value per point (normalized to 0-1)
  const values = new Float32Array(numPoints);

  let idx = 0;
  for (let z = 0; z < resolution; z++) {
    for (let y = 0; y < resolution; y++) {
      for (let x = 0; x < resolution; x++) {
        // Compute a normalized position between 0 and scale.
        // (This places the grid in [0, scale]^3. Adjust as needed.)
        const posX = (x / (resolution - 1)) * scale;
        const posY = (y / (resolution - 1)) * scale;
        const posZ = (z / (resolution - 1)) * scale;

        positions[idx * 3 + 0] = posX;
        positions[idx * 3 + 1] = posY;
        positions[idx * 3 + 2] = posZ;
        
        // Normalize the raw value (assumed to be 0–255) to [0, 1]
        values[idx] = rawData[idx] / 255;
        idx++;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('value', new THREE.BufferAttribute(values, 1));
  
  return geometry;
}
