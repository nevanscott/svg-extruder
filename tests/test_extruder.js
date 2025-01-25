import {
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
  readFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { transformSvgToIsometric } from "../src/extruder.js"; // Adjust this path to point to your JavaScript module

// Resolve __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths to test files
const sourceDir = join(__dirname, "sources");
const outputDir = join(__dirname, "generated");
const demoFile = join(outputDir, "demo.html");

// Ensure the output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// HTML template parts
const htmlHeader = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SVG Transformation Demo</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; margin: 2rem; background-color: #fafafa; }
    .container { display: flex; flex-wrap: wrap; gap: 2rem; justify-content: center; }
    .item { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .svg-container { display: flex; gap: 2rem; justify-content: center; }
    svg { width: 300px; height: auto; border: 1px solid #eee; background-color: white; }
    h1 { text-align: center; }
  </style>
</head>
<body>
  <h1>SVG Transformation Demo</h1>
  <div class="container">
`;

let htmlBody = "";

// Process all SVG files in the source directory
readdirSync(sourceDir).forEach((filename) => {
  if (filename.endsWith(".svg")) {
    const inputFile = join(sourceDir, filename);
    const outputFile = join(outputDir, filename);

    console.log(`Processing ${inputFile} -> ${outputFile}`);
    try {
      transformSvgToIsometric(inputFile, outputFile); // Transform the SVG

      // Read the original and transformed SVGs
      const originalSvg = readFileSync(inputFile, "utf-8");
      const transformedSvg = readFileSync(outputFile, "utf-8");

      // Add the before and after views to the HTML body
      htmlBody += `
        <div class="item">
          <h2>${filename}</h2>
          <div class="svg-container">
            <div>
              <h3>Before</h3>
              ${originalSvg}
            </div>
            <div>
              <h3>After</h3>
              ${transformedSvg}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error(`Error processing ${filename}:`, error);
    }
  }
});

// Complete the HTML file
const htmlFooter = `
  </div>
</body>
</html>
`;

// Write the demo HTML file
const fullHtml = htmlHeader + htmlBody + htmlFooter;
writeFileSync(demoFile, fullHtml);

console.log(`Demo file written to: ${demoFile}`);
