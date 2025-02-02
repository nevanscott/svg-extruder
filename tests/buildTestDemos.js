import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { transformSvgToIsometric } from "../src/extruder.js"; // Adjust this path to point to your JavaScript module

// Resolve __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths to test files
const sourceDir = join(__dirname, "sources");
const outputDir = join(__dirname, "generated");

export async function buildTestDemos() {
  // Ensure the output directory exists
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.error(`Error creating output directory:`, error.message);
    return;
  }

  // Object to store the results
  const results = {
    processedFiles: [],
  };

  try {
    // Process all SVG files in the source directory
    const files = await fs.readdir(sourceDir);
    for (const filename of files) {
      if (filename.endsWith(".svg")) {
        const inputFile = join(sourceDir, filename);
        const outputFile = join(outputDir, filename);

        // console.log(`Processing ${inputFile} -> ${outputFile}`);
        try {
          await transformSvgToIsometric(inputFile, outputFile); // Transform the SVG

          // Ensure the transformed file exists before proceeding
          try {
            await fs.access(outputFile);
          } catch {
            throw new Error(`Transformed file not found: ${outputFile}`);
          }

          // Read the original and transformed SVGs
          const originalSvg = await fs.readFile(inputFile, "utf-8");
          const transformedSvg = await fs.readFile(outputFile, "utf-8");

          // Add the result to the results object
          results.processedFiles.push({
            filename,
            originalSvg,
            transformedSvg,
          });
        } catch (error) {
          console.error(`Error processing ${filename}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading source directory:`, error.message);
  }

  // Return the results object
  return results;
}
