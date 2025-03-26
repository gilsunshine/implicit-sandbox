import { loadPyodide } from "pyodide";

let pyodideInstance: any = null;

const initPyodide = async () => {
  if (!pyodideInstance) {
    pyodideInstance = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.4/full/"
    });
    await pyodideInstance.loadPackage(["numpy"]);
  }
  return pyodideInstance;
};

export const executePythonCode = async (userCode: string): Promise<Uint8Array> => {
  const pyodide = await initPyodide();
  // Python script template to execute user-defined scalar_field function
  const script = `
import numpy as np

# User-defined function
${userCode}

# Step 2: Generate the grid
resolution = 256
grid = np.linspace(0, 1, resolution)
X, Y, Z = np.meshgrid(grid, grid, grid, indexing="ij")

# Step 3: Compute scalar field values
values = scalar_field(X, Y, Z)

# Step 4: Normalize to uint8
values -= values.min()
values /= values.max()
values *= 255
values = values.astype(np.uint8)

# Convert to bytes for JavaScript
values.tobytes()
`;

  try {
    // Run the Python script in Pyodide
    const rawBytes = await pyodide.runPythonAsync(script);
    // Convert the returned bytes to a Uint8Array
    return new Uint8Array(rawBytes);
  } catch (error) {
    console.error("Error executing Python code:", error);
    throw error;
  }
};
