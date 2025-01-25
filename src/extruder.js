import { readFileSync, writeFileSync } from "fs";
import { JSDOM } from "jsdom";
import { extrudeRectangle } from "./extrudeRectangle.js";
import { extrudeCircle } from "./extrudeCircle.js";

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
 * Offsets a path element's coordinates
 */
function offsetPath(pathData, offsetX, offsetY) {
  return pathData.replace(
    /(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/g,
    (match, x, _, y) => `${parseFloat(x) - offsetX},${parseFloat(y) - offsetY}`
  );
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
    (match, x, _, y) => `${parseFloat(x) - offsetX},${parseFloat(y) - offsetY}`
  );
}

/**
 * Normalizes and offsets a single element
 */
function normalizeElement(element, offsetX, offsetY) {
  if (element.includes("<path")) {
    return element.replace(
      /d="([^"]+)"/,
      (_, pathData) => `d="${offsetPath(pathData, offsetX, offsetY)}"`
    );
  } else if (element.includes("<ellipse")) {
    const parser = new JSDOM(`<svg>${element}</svg>`).window.document;
    const ellipse = parser.querySelector("ellipse");
    return offsetEllipse(ellipse, offsetX, offsetY);
  } else if (element.includes("<polygon")) {
    return element.replace(
      /points="([^"]+)"/,
      (_, pointsData) =>
        `points="${offsetPolygon(pointsData, offsetX, offsetY)}"`
    );
  } else {
    if (DEBUG)
      console.warn(`Unsupported element type for normalization: ${element}`);
    return element;
  }
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
function transformSvgToIsometric(inputPath, outputPath, extrusionHeight = 20) {
  const inputSvg = readFileSync(inputPath, "utf-8");

  const dom = new JSDOM(inputSvg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;

  const elements = [
    ...doc.getElementsByTagName("rect"),
    ...doc.getElementsByTagName("circle"),
  ];
  if (DEBUG) console.log(`Found ${elements.length} elements to process.`);

  if (elements.length === 0) {
    console.warn("No elements found to process. Skipping file.");
    return;
  }

  const boundingBoxes = [];
  const wallsWithDistances = [];
  const roofs = [];
  const debugBoxes = [];

  elements.forEach((element, index) => {
    try {
      let extrusionData;

      if (element.tagName === "rect") {
        extrusionData = extrudeRectangle(element, extrusionHeight);
      } else if (element.tagName === "circle") {
        extrusionData = extrudeCircle(element, extrusionHeight);
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

      roofs.push(roof);

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
  const normalizedRoofs = normalizeElements(roofs, offsetX, offsetY);
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

  writeFileSync(outputPath, outputSvg.trim());
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
