import { join, dirname } from "path";
import { readdir, readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { transformSvgToIsometric } from "../src/transformSvgToIsometric.js";

// Define paths
const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = join(__dirname, "sources");

async function buildPipelineTests() {
  const files = (await readdir(SOURCE_DIR)).filter((file) =>
    file.endsWith(".svg")
  );
  const tests = [];

  for (const file of files) {
    const inputPath = join(SOURCE_DIR, file);
    const inputSvg = await readFile(inputPath, "utf-8");

    const { svg, steps } = await transformSvgToIsometric(inputSvg);

    tests.push({ file, steps });
  }

  return tests;
}

export { buildPipelineTests };
