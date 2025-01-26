import { promises as fs } from "fs";
import { JSDOM } from "jsdom";
import { extrudeRectangle } from "./helpers/extrudeRectangle.js";
import { extrudeCircle } from "./helpers/extrudeCircle.js";
import { extrudeRoundrect } from "./helpers/extrudeRoundrect.js";
import { extrudePath } from "./helpers/extrudePath.js";

// Debug Mode
const DEBUG = process.argv.includes("--debug"); // Pass --debug flag to enable debugging

// Constants for Configuration
const PADDING = 10;
const DEBUG_BOX_FILL = "pink";
const DEBUG_BOX_OPACITY = 0.3;
const DEBUG_BOX_STROKE = "pink";
const DEBUG_TEXT_FONT = "Helvetica";
const DEBUG_TEXT_SIZE = 10;

/**
 * Helper to create a debug bounding box with distance text
 */
function createDebugBoundingBoxElement({ minX, minY, width, height, maxY }) {
  const distance = minY + height; // Distance calculation
  return `
    <g>
      <rect x="${minX}" y="${minY}" width="${width}" height="${height}" 
            fill="${DEBUG_BOX_FILL}" fill-opacity="${DEBUG_BOX_OPACITY}" stroke="${DEBUG_BOX_STROKE}" stroke-width="1" />
      <text x="${minX + 5}" y="${
    minY + height - 5
  }" font-family="${DEBUG_TEXT_FONT}" font-weight="bold" font-size="${DEBUG_TEXT_SIZE}" fill="black">
        ${distance.toFixed(2)}
      </text>
    </g>
  `.trim();
}

/**
 * Offsets a bounding box by a given amount
 */
function offsetBoundingBox(boundingBox, offsetX, offsetY) {
  if (!boundingBox || !("minX" in boundingBox && "minY" in boundingBox)) {
    console.error("Invalid bounding box for offset:", boundingBox);
    return null;
  }
  return {
    minX: boundingBox.minX - offsetX,
    minY: boundingBox.minY - offsetY,
    width: boundingBox.width,
    height: boundingBox.height,
  };
}

/**
 * Offsets the coordinates in a path's `d` attribute string or full path element.
 */
function offsetPath(pathElement, offsetX, offsetY) {
  try {
    // Check if the input is just the `d` attribute value (not a full path element)
    if (!pathElement.includes("<path")) {
      // Assume it's just the `d` attribute's value
      return pathElement
        .replace(
          /([MmLlTt])\s*(-?\d+(\.\d+)?)[ ,](-?\d+(\.\d+)?)/g, // Handle M, L, T commands
          (fullMatch, command, x, _, y) => {
            const newX = parseFloat(x) - offsetX;
            const newY = parseFloat(y) - offsetY;
            return `${command}${newX},${newY}`;
          }
        )
        .replace(
          /([Aa])\s*(-?\d+(\.\d+)?)[ ,](-?\d+(\.\d+)?)[ ,](\d+)[ ,](\d+)[ ,](\d+)[ ,](-?\d+(\.\d+)?)[ ,](-?\d+(\.\d+)?)/g, // Handle A commands
          (
            fullMatch,
            command,
            rx,
            _,
            ry,
            __,
            xRot,
            largeArc,
            sweep,
            x,
            ___,
            y
          ) => {
            const newX = parseFloat(x) - offsetX;
            const newY = parseFloat(y) - offsetY;
            return `${command}${rx},${ry} ${xRot} ${largeArc},${sweep} ${newX},${newY}`;
          }
        );
    }

    // If it's a full `<path>` element, extract the `d` attribute
    const match = pathElement.match(/d="([^"]+)"/);
    if (!match) {
      console.warn("No `d` attribute found in path element:", pathElement);
      return pathElement; // Return the original element unchanged
    }

    const pathData = match[1]; // The content of the `d` attribute
    const updatedPathData = offsetPath(pathData, offsetX, offsetY);

    // Replace the `d` attribute in the original path element
    return pathElement.replace(`d="${pathData}"`, `d="${updatedPathData}"`);
  } catch (error) {
    console.error("Error in offsetPath:", {
      pathElement,
      offsetX,
      offsetY,
      error,
    });
    return pathElement; // Return the original element if an error occurs
  }
}

/**
 * Offsets an ellipse element
 */
function offsetEllipse(element, offsetX, offsetY) {
  const cx = parseFloat(element.getAttribute("cx")) - offsetX;
  const cy = parseFloat(element.getAttribute("cy")) - offsetY;
  element.setAttribute("cx", cx);
  element.setAttribute("cy", cy);
  return element.outerHTML;
}

/**
 * Offsets a polygon element's points
 */
function offsetPolygon(pointsData, offsetX, offsetY) {
  return pointsData.replace(
    /(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/g,
    (match, x, _, y) => {
      const newX = parseFloat(x) - offsetX;
      const newY = parseFloat(y) - offsetY;
      return `${newX},${newY}`;
    }
  );
}

/**
 * Offsets a gradient's coordinates (linear or radial)
 */
function offsetGradient(gradientElement, offsetX, offsetY) {
  try {
    // Extract x1, y1, x2, y2 for linear gradients
    if (gradientElement.includes("linearGradient")) {
      return gradientElement
        .replace(
          /x1="(-?\d+(\.\d+)?)"/,
          (_, x1) => `x1="${parseFloat(x1) - offsetX}"`
        )
        .replace(
          /y1="(-?\d+(\.\d+)?)"/,
          (_, y1) => `y1="${parseFloat(y1) - offsetY}"`
        )
        .replace(
          /x2="(-?\d+(\.\d+)?)"/,
          (_, x2) => `x2="${parseFloat(x2) - offsetX}"`
        )
        .replace(
          /y2="(-?\d+(\.\d+)?)"/,
          (_, y2) => `y2="${parseFloat(y2) - offsetY}"`
        );
    }
    // Handle radial gradients (cx, cy, fx, fy)
    if (gradientElement.includes("radialGradient")) {
      return gradientElement
        .replace(
          /cx="(-?\d+(\.\d+)?)"/,
          (_, cx) => `cx="${parseFloat(cx) - offsetX}"`
        )
        .replace(
          /cy="(-?\d+(\.\d+)?)"/,
          (_, cy) => `cy="${parseFloat(cy) - offsetY}"`
        )
        .replace(
          /fx="(-?\d+(\.\d+)?)"/,
          (_, fx) => `fx="${parseFloat(fx) - offsetX}"`
        )
        .replace(
          /fy="(-?\d+(\.\d+)?)"/,
          (_, fy) => `fy="${parseFloat(fy) - offsetY}"`
        );
    }
    return gradientElement;
  } catch (error) {
    console.error("Error in offsetGradient:", {
      gradientElement,
      offsetX,
      offsetY,
      error,
    });
    return gradientElement; // Return original element if an error occurs
  }
}

/**
 * Normalizes and offsets a single element string that might contain multiple tags.
 */
function normalizeElement(elementString, offsetX, offsetY) {
  let updatedString = elementString;

  // Handle <path> elements
  updatedString = updatedString.replace(
    /<path[^>]*d="([^"]+)"[^>]*>/g,
    (match, pathData) => {
      const updatedPathData = offsetPath(pathData, offsetX, offsetY);
      return match.replace(pathData, updatedPathData);
    }
  );

  // Handle <ellipse> elements
  updatedString = updatedString.replace(
    /<ellipse[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*>/g,
    (match, cx, cy) => {
      const newCx = parseFloat(cx) - offsetX;
      const newCy = parseFloat(cy) - offsetY;
      return match
        .replace(`cx="${cx}"`, `cx="${newCx}"`)
        .replace(`cy="${cy}"`, `cy="${newCy}"`);
    }
  );

  // Handle <polygon> elements
  updatedString = updatedString.replace(
    /<polygon[^>]*points="([^"]+)"[^>]*>/g,
    (match, pointsData) => {
      const updatedPoints = offsetPolygon(pointsData, offsetX, offsetY);
      return match.replace(pointsData, updatedPoints);
    }
  );

  // Handle <linearGradient> elements
  updatedString = updatedString.replace(
    /<linearGradient[^>]*>/g,
    (gradientMatch) => offsetGradient(gradientMatch, offsetX, offsetY)
  );

  // Handle <radialGradient> elements
  updatedString = updatedString.replace(
    /<radialGradient[^>]*>/g,
    (gradientMatch) => offsetGradient(gradientMatch, offsetX, offsetY)
  );

  // Return the fully updated string
  return updatedString;
}

/**
 * Normalizes and offsets multiple elements
 */
function normalizeElements(elements, offsetX, offsetY) {
  return elements.map((element) => normalizeElement(element, offsetX, offsetY));
}

/**
 * Transforms SVG elements to isometric view
 */
async function transformSvgToIsometric(
  inputPath,
  outputPath,
  extrusionHeight = 20
) {
  const inputSvg = await fs.readFile(inputPath, "utf-8");

  const dom = new JSDOM(inputSvg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;

  const elements = [
    ...doc.getElementsByTagName("rect"),
    ...doc.getElementsByTagName("circle"),
    ...doc.getElementsByTagName("path"),
  ];
  if (DEBUG) console.log(`Found ${elements.length} elements to process.`);

  if (elements.length === 0) {
    console.warn("No elements found to process. Skipping file.");
    return;
  }

  const boundingBoxes = [];
  const wallsWithDistances = [];
  const roofsInOrder = []; // Keep roofs in original appearance order
  const debugBoxes = [];

  elements.forEach((element, index) => {
    try {
      let extrusionData;

      if (element.tagName === "rect" && element.hasAttribute("rx")) {
        // Rounded rectangle
        extrusionData = extrudeRoundrect(element, extrusionHeight);
      } else if (element.tagName === "rect") {
        // Regular rectangle
        extrusionData = extrudeRectangle(element, extrusionHeight);
      } else if (element.tagName === "circle") {
        // Circle
        extrusionData = extrudeCircle(element, extrusionHeight);
      } else if (element.tagName === "path") {
        // Path
        extrusionData = extrudePath(element, extrusionHeight);
      } else {
        console.warn(`Unsupported element type: ${element.tagName}`);
        return;
      }

      const { roof, walls, boundingBox } = extrusionData;

      if (!roof || !walls) {
        console.error(`Invalid extrusion data for element at index ${index}.`);
        return;
      }

      const distance = boundingBox.minY + boundingBox.height;
      if (DEBUG)
        console.log(`Element at index ${index} has distance: ${distance}`);

      walls.forEach((wall) => {
        wallsWithDistances.push({ wall, distance, boundingBox });
      });

      roofsInOrder.push(roof);

      if (boundingBox) {
        if (DEBUG) debugBoxes.push(createDebugBoundingBoxElement(boundingBox));
        boundingBoxes.push(boundingBox);
      } else {
        console.warn(`Bounding box missing for element at index ${index}.`);
      }
    } catch (error) {
      console.error(`Error processing element at index ${index}:`, error);
    }
  });

  const minX = Math.min(...boundingBoxes.map((box) => box.minX)) - PADDING;
  const minY = Math.min(...boundingBoxes.map((box) => box.minY)) - PADDING;
  const maxX =
    Math.max(...boundingBoxes.map((box) => box.minX + box.width)) + PADDING;
  const maxY =
    Math.max(...boundingBoxes.map((box) => box.minY + box.height)) + PADDING;

  const offsetX = minX;
  const offsetY = minY;

  const normalizedWallsWithDistances = wallsWithDistances.map(
    ({ wall, distance, boundingBox }) => ({
      wall: normalizeElement(wall, offsetX, offsetY),
      distance,
      boundingBox: offsetBoundingBox(boundingBox, offsetX, offsetY),
    })
  );

  const normalizedRoofs = normalizeElements(roofsInOrder, offsetX, offsetY);
  const normalizedDebugBoxes = boundingBoxes.map((box) =>
    createDebugBoundingBoxElement(offsetBoundingBox(box, offsetX, offsetY))
  );

  normalizedWallsWithDistances.sort((a, b) => a.distance - b.distance);
  const sortedWalls = normalizedWallsWithDistances.map(({ wall }) => wall);

  const normalizedViewBox = `0 0 ${maxX - minX} ${maxY - minY}`;

  const outputSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${normalizedViewBox}">
      ${sortedWalls.join("\n")}
      ${normalizedRoofs.join("\n")}
      ${DEBUG ? normalizedDebugBoxes.join("\n") : ""}
    </svg>
  `;

  await fs.writeFile(outputPath, outputSvg.trim());
  console.log(`Isometric transformed SVG written to: ${outputPath}`);
}

export { transformSvgToIsometric };
/**
 * Documentation:
 * Run this script with the `--debug` flag to enable debugging mode.
 * Example: `node transformSvgToIsometric.js --debug`
 * Debug mode includes:
 * 1. Debug bounding boxes in the output SVG.
 * 2. Console logs for distances, elements, and bounding boxes.
 */
