import { loadPyodide } from "pyodide";
import { sdfLibrary } from "./sdf_library";

let pyodideInstance: any = null;

export const initPyodide = async () => {
  if (!pyodideInstance) {
    pyodideInstance = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.4/full/",
    });
  }
  return pyodideInstance;
};

let executionPackagesLoaded = false;

export const loadExecutionPackages = async () => {
  const pyodide = await initPyodide();

  if (!executionPackagesLoaded) {
    await pyodide.loadPackage(["numpy"]);
    executionPackagesLoaded = true;
  }
};

let sdfLibraryLoaded = false;

export const initSDFLibrary = async () => {
  if (sdfLibraryLoaded) return;

  const pyodide = await initPyodide();
  await pyodide.loadPackage(["numpy"]);
  await loadExecutionPackages();

  await pyodide.runPythonAsync(dedent(sdfLibrary));
  sdfLibraryLoaded = true;
};


let lintingPackagesLoaded = false;

export const loadLintingPackages = async () => {
  const pyodide = await initPyodide();

  if (!lintingPackagesLoaded) {
    await pyodide.loadPackage("micropip");
    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install("pyflakes")
    `);
    lintingPackagesLoaded = true;
  }
};

export const lintPythonCode = async (
  code: string
): Promise<{ line: number; column: number; message: string }[]> => {
  const pyodide = await initPyodide();
  await loadLintingPackages();

  const fullCode = `${sdfLibrary.trim()}\n\n${code}`;

  try {
    pyodide.FS.writeFile("temp.py", fullCode);

    const result = await pyodide.runPythonAsync(`
from pyflakes.api import checkPath
from pyflakes.reporter import Reporter
from io import StringIO

output = StringIO()
reporter = Reporter(output, output)
checkPath("temp.py", reporter)
output.getvalue()
    `);

    const sdfLineOffset = sdfLibrary.trim().split("\n").length;

    const diagnostics = result
      .trim()
      .split("\n")
      .map((line: string) => {
        const match = line.match(/temp\.py:(\d+):(\d+):?\s+(.*)/);
        if (!match) return null;
    
        const [, lineStr, columnStr, message] = match;
        const rawLine = parseInt(lineStr, 10);
    
        const userLine = rawLine - sdfLineOffset;
        if (userLine < 0) return null;
    
        return {
          line: userLine - 2, // Need to find where the offset is coming from
          column: parseInt(columnStr, 10) - 1,
          message,
        };
      })
      .filter(Boolean) as { line: number; column: number; message: string }[];

    return diagnostics;
  } catch (error) {
    console.error("Pyodide Lint Error:", error);
    return [];
  }
};


// Dedent utility
function dedent(str: string): string {
  const lines = str.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const indent = Math.min(...nonEmptyLines.map((line) => line.match(/^ */)![0].length));
  return lines.map((line) => line.slice(indent)).join("\n");
}

export const executePythonCode = async (userCode: string, resolution: number): Promise<Float32Array> => {
  const pyodide = await initPyodide();
  await loadExecutionPackages();
  await initSDFLibrary(); // Ensure this happens once

  try {
    // Evaluate user code (which defines scalar_field)
    await pyodide.runPythonAsync(userCode);
    // Evaluate scalar_field over the grid
    const evalScript = dedent(`def evaluate_in_chunks(resolution, chunk_size):
    grid = np.linspace(0, 1, resolution)
    full_values = np.zeros((resolution, resolution, resolution), dtype=np.float32)

    for x0 in range(0, resolution, chunk_size):
        for y0 in range(0, resolution, chunk_size):
            for z0 in range(0, resolution, chunk_size):
                x1 = min(x0 + chunk_size, resolution)
                y1 = min(y0 + chunk_size, resolution)
                z1 = min(z0 + chunk_size, resolution)

                X, Y, Z = np.meshgrid(
                    grid[x0:x1],
                    grid[y0:y1],
                    grid[z0:z1],
                    indexing="ij"
                )

                full_values[x0:x1, y0:y1, z0:z1] = scalar_field(X, Y, Z).astype(np.float32)

    return full_values
resolution = ${resolution}
raw_data = evaluate_in_chunks(resolution, int(resolution / 4))
clipped = np.clip(raw_data, -1.0, 1.0).astype(np.float32)
clipped = clipped.flatten()
clipped
`);
const result = await pyodide.runPythonAsync(evalScript);
return result.toJs({ create_proxies: false }) as Float32Array;
} catch (error) {
console.error("Error executing Python code:", error);
throw error;
}
};
