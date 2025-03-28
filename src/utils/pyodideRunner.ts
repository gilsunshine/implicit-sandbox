import { loadPyodide } from "pyodide";

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

  try {
    pyodide.FS.writeFile("temp.py", code);

    const result = await pyodide.runPythonAsync(`
from pyflakes.api import checkPath
from pyflakes.reporter import Reporter
from io import StringIO

output = StringIO()
reporter = Reporter(output, output)
checkPath("temp.py", reporter)
output.getvalue()
    `);

    const diagnostics = result
      .trim()
      .split("\n")
      .map((line: string) => {
        const match = line.match(/temp\.py:(\d+):(\d+):?\s+(.*)/);
        if (!match) return null;

        const [, lineStr, columnStr, message] = match;
        return {
          line: parseInt(lineStr, 10) - 1,
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


export const executePythonCode = async (userCode: string): Promise<Uint8Array> => {
  const pyodide = await initPyodide();
  await loadExecutionPackages();

  const script = `
import numpy as np

${userCode}

resolution = 256
grid = np.linspace(0, 1, resolution)
X, Y, Z = np.meshgrid(grid, grid, grid, indexing="ij")
values = scalar_field(X, Y, Z).astype(np.float32)
values -= values.min()
values /= values.max()
values *= 255
values = np.clip(values, 0, 255).astype(np.uint8)
values.tobytes()
  `;

  try {
    const rawBytes = await pyodide.runPythonAsync(script);
    return new Uint8Array(rawBytes);
  } catch (error) {
    console.error("Error executing Python code:", error);
    throw error;
  }
};