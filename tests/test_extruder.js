import { existsSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { transformSvgToIsometric } from "../src/extruder.js"; // Adjust this path to point to your JavaScript module

// Resolve __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths to test files
const sourceDir = join(__dirname, "sources");
const outputDir = join(__dirname, "generated");

// Ensure the output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Loop over all SVG files in the source directory
readdirSync(sourceDir).forEach((filename) => {
  if (filename.endsWith(".svg")) {
    const inputFile = join(sourceDir, filename);
    const outputFile = join(outputDir, filename);

    console.log(`Processing ${inputFile} -> ${outputFile}`);
    try {
      transformSvgToIsometric(inputFile, outputFile); // No extrusionHeight argument
    } catch (error) {
      console.error(`Error processing ${filename}:`, error);
    }
  }
});
