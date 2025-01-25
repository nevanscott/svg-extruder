import { readFileSync, writeFileSync } from "fs";
import { JSDOM } from "jsdom";
import { extrudeRectangle } from "./extrudeRectangle.js";
import { extrudeCircle } from "./extrudeCircle.js";

// Updated helper to display "distance" in debug boxes
function createDebugBoundingBoxElement({ minX, minY, width, height, maxY }) {
  const distance = minY + height;
  return `
    <g>
      <!-- Pink bounding box with border -->
      <rect x="${minX}" y="${minY}" width="${width}" height="${height}" 
            fill="pink" fill-opacity="0.3" stroke="pink" stroke-width="1" />
      <!-- Text for distance -->
      <text x="${minX + 5}" y="${
    minY + height - 5
  }" font-family="Helvetica" font-weight="bold" font-size="10" fill="black">
        ${distance.toFixed(2)}
      </text>
    </g>
  `.trim();
}

// Offset bounding boxes
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

// Function to offset path elements
function offsetPath(pathData, offsetX, offsetY) {
  return pathData.replace(
    /(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/g,
    (match, x, _, y) => `${parseFloat(x) - offsetX},${parseFloat(y) - offsetY}`
  );
}

// Function to offset ellipse elements
function offsetEllipse(element, offsetX, offsetY) {
  const cx = parseFloat(element.getAttribute("cx")) - offsetX;
  const cy = parseFloat(element.getAttribute("cy")) - offsetY;
  element.setAttribute("cx", cx);
  element.setAttribute("cy", cy);
  return element.outerHTML;
}

// Function to offset polygon elements
function offsetPolygon(pointsData, offsetX, offsetY) {
  return pointsData.replace(
    /(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/g,
    (match, x, _, y) => `${parseFloat(x) - offsetX},${parseFloat(y) - offsetY}`
  );
}

// Normalize and offset elements
function normalizeElements(elements, offsetX, offsetY) {
  return elements.map((element) => normalizeElement(element, offsetX, offsetY));
}

function normalizeElement(element, offsetX, offsetY) {
  if (element.includes("<path")) {
    // Handle path elements
    return element.replace(
      /d="([^"]+)"/,
      (_, pathData) => `d="${offsetPath(pathData, offsetX, offsetY)}"`
    );
  } else if (element.includes("<ellipse")) {
    // Handle ellipse elements
    const parser = new JSDOM(`<svg>${element}</svg>`).window.document;
    const ellipse = parser.querySelector("ellipse");
    return offsetEllipse(ellipse, offsetX, offsetY);
  } else if (element.includes("<polygon")) {
    // Handle polygon elements
    return element.replace(
      /points="([^"]+)"/,
      (_, pointsData) =>
        `points="${offsetPolygon(pointsData, offsetX, offsetY)}"`
    );
  } else {
    console.warn(`Unsupported element type for normalization: ${element}`);
    return element;
  }
}

// Transform SVG
function transformSvgToIsometric(inputPath, outputPath, extrusionHeight = 20) {
  const inputSvg = readFileSync(inputPath, "utf-8");

  const dom = new JSDOM(inputSvg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;

  const elements = [
    ...doc.getElementsByTagName("rect"),
    ...doc.getElementsByTagName("circle"),
  ];
  console.log(`Found ${elements.length} elements to process.`);

  if (elements.length === 0) {
    console.warn("No elements found to process. Skipping file.");
    return;
  }

  const boundingBoxes = [];
  const wallsWithDistances = [];
  const roofs = [];
  const debugBoxes = [];
  const padding = 10;

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

      // Use the bounding box of the object the wall is part of
      const distance = boundingBox.minY + boundingBox.height;
      console.log(`Element at index ${index} has distance: ${distance}`);

      // Add walls with their distance and bounding box
      walls.forEach((wall) => {
        wallsWithDistances.push({ wall, distance, boundingBox });
      });

      // Add roofs in original order
      roofs.push(roof);

      // Add debug bounding box
      if (boundingBox) {
        debugBoxes.push(createDebugBoundingBoxElement(boundingBox));
        boundingBoxes.push(boundingBox);
      } else {
        console.warn(`Bounding box missing for element at index ${index}.`);
      }
    } catch (error) {
      console.error(`Error processing element at index ${index}:`, error);
    }
  });

  // Calculate offsets
  const minX = Math.min(...boundingBoxes.map((box) => box.minX)) - padding;
  const minY = Math.min(...boundingBoxes.map((box) => box.minY)) - padding;
  const maxX =
    Math.max(...boundingBoxes.map((box) => box.minX + box.width)) + padding;
  const maxY =
    Math.max(...boundingBoxes.map((box) => box.minY + box.height)) + padding;

  const offsetX = minX;
  const offsetY = minY;

  // Normalize all elements
  const normalizedWallsWithDistances = wallsWithDistances.map(
    ({ wall, distance, boundingBox }) => ({
      wall: normalizeElement(wall, offsetX, offsetY),
      distance: distance, // Adjust distance for normalized coordinates
      boundingBox: offsetBoundingBox(boundingBox, offsetX, offsetY),
    })
  );
  const normalizedRoofs = normalizeElements(roofs, offsetX, offsetY);
  const normalizedDebugBoxes = boundingBoxes.map((box) =>
    createDebugBoundingBoxElement(offsetBoundingBox(box, offsetX, offsetY))
  );

  // Sort walls by distance (descending order)
  normalizedWallsWithDistances.sort((a, b) => a.distance - b.distance);

  // Extract sorted walls
  const sortedWalls = normalizedWallsWithDistances.map(({ wall }) => wall);

  // Calculate the final normalized viewBox
  const normalizedViewBox = `0 0 ${maxX - minX} ${maxY - minY}`;

  // Build the final SVG content
  const outputSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${normalizedViewBox}">
      ${sortedWalls.join("\n")}
      ${normalizedRoofs.join("\n")}
      ${normalizedDebugBoxes.join("\n")}
    </svg>
  `;

  writeFileSync(outputPath, outputSvg.trim());
  console.log(`Isometric transformed SVG written to: ${outputPath}`);
}

export { transformSvgToIsometric };
