import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { transformSvgToIsometric } from "../src/transformSvgToIsometric.js";

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

        try {
          const originalSvg = await fs.readFile(inputFile, "utf-8");

          // Run the new pipeline-based transform
          const { svg: transformedSvg } = await transformSvgToIsometric(
            originalSvg
          );

          // Extract just the <svg> element
          const svgContentMatch = transformedSvg.match(
            /<svg[^>]*>[\s\S]*<\/svg>/
          );
          if (!svgContentMatch) {
            throw new Error(
              `No valid <svg> content found in output for file: ${filename}`
            );
          }
          const svgContent = svgContentMatch[0];

          // Save the transformed SVG content to the output directory
          await fs.writeFile(outputFile, svgContent);

          // Add the result to the results object
          results.processedFiles.push({
            filename,
            originalSvg,
            transformedSvg: svgContent,
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
