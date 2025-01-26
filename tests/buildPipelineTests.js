import { join } from "path";
import { readdir, readFile } from "fs/promises";

// Define paths
const SOURCE_DIR = join(__dirname, "tests/sources");

// Sample pipeline steps (placeholder functions for now)
const pipeline = [
  {
    name: "Convert Shapes to Paths",
    step: (state) => {
      // Placeholder: Parse SVG and convert shapes to paths
      state.svg += `<!-- Step: Convert Shapes to Paths -->`;
      return state;
    },
  },
  {
    name: "Construct Floor and Ceiling",
    step: (state) => {
      // Placeholder: Add floor and ceiling logic
      state.svg += `<!-- Step: Construct Floor and Ceiling -->`;
      return state;
    },
  },
  {
    name: "Identify Sharp Turn Points",
    step: (state) => {
      // Placeholder: Add sharp turn point detection
      state.svg += `<!-- Step: Identify Sharp Turn Points -->`;
      return state;
    },
  },
  // Additional steps here...
];

async function buildPipelineTests() {
  const files = (await readdir(SOURCE_DIR)).filter((file) =>
    file.endsWith(".svg")
  );
  const tests = [];

  for (const file of files) {
    const inputPath = join(SOURCE_DIR, file);
    const inputSvg = await readFile(inputPath, "utf-8");

    // Initialize pipeline state
    let state = { svg: inputSvg, shapes: {} };

    // Run through each pipeline step
    const steps = await Promise.all(
      pipeline.map(async ({ name, step }) => {
        state = await step(state); // Process step
        return { name, svg: state.svg }; // Add step output
      })
    );

    tests.push({ file, steps });
  }

  return tests;
}

export { buildPipelineTests };
