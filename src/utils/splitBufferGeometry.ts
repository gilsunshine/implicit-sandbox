import * as THREE from 'three';

/**
 * Splits an indexed THREE.BufferGeometry into smaller chunks.
 * Each chunk will contain at most maxTriangles triangles.
 *
 * @param geometry - The BufferGeometry to split.
 * @param maxTriangles - Maximum number of triangles per chunk.
 * @returns An array of BufferGeometry chunks.
 */
export function splitBufferGeometry(
  geometry: THREE.BufferGeometry,
  maxTriangles: number
): THREE.BufferGeometry[] {
  if (!geometry.index) {
    throw new Error("Geometry must be indexed.");
  }
  const indices = geometry.index.array as Uint32Array | Uint16Array | number[];
  const positions = geometry.attributes.position.array as Float32Array;
  const totalTriangles = indices.length / 3;
  const chunks: THREE.BufferGeometry[] = [];

  for (let triStart = 0; triStart < totalTriangles; triStart += maxTriangles) {
    const triEnd = Math.min(triStart + maxTriangles, totalTriangles);
    // Slice the indices for this chunk.
    const indicesChunk = indices.slice(triStart * 3, triEnd * 3);
    const vertexMap = new Map<number, number>();
    const newIndices: number[] = [];
    const newPositions: number[] = [];
    let newIndex = 0;
    
    for (let i = 0; i < indicesChunk.length; i++) {
      const origIndex = indicesChunk[i];
      if (!vertexMap.has(origIndex)) {
        vertexMap.set(origIndex, newIndex);
        newPositions.push(
          positions[origIndex * 3],
          positions[origIndex * 3 + 1],
          positions[origIndex * 3 + 2]
        );
        newIndices.push(newIndex);
        newIndex++;
      } else {
        newIndices.push(vertexMap.get(origIndex)!);
      }
    }
    
    const chunkGeometry = new THREE.BufferGeometry();
    chunkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    chunkGeometry.setIndex(newIndices);
    chunkGeometry.computeVertexNormals();
    chunks.push(chunkGeometry);
  }
  return chunks;
}
