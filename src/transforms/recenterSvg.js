import { JSDOM } from "jsdom";
import translateIsometricPath from "./translateIsometricPath.js";

/**
 * Compute the bounding box from a path's `d` attribute.
 */
function getPathBoundingBox(d) {
  if (!d) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }; // Fallback for empty paths

  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
  if (!commands) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let currentX = 0,
    currentY = 0;

  commands.forEach((command) => {
    const type = command[0];
    const args = command.slice(1).trim().split(/[ ,]+/).map(parseFloat);

    if (args.some(isNaN)) return; // Skip if any args are invalid

    let x = currentX,
      y = currentY;
    switch (type) {
      case "M":
      case "L":
        [x, y] = args;
        break;
      case "C":
        [x, y] = args.slice(-2); // Last control point
        break;
      case "Q":
        [x, y] = args.slice(-2);
        break;
      case "A":
        [x, y] = args.slice(-2);
        break;
      case "H":
        x = args[0];
        break;
      case "V":
        y = args[0];
        break;
      default:
        return; // Ignore unhandled commands
    }

    // Update bounding box
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    // Update current position
    currentX = x;
    currentY = y;
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Recenter the SVG around the floor's bounding box.
 */
export default function recenterSvg(svg, shapes, padding = 20) {
  if (!shapes || !Array.isArray(shapes) || shapes.length === 0) {
    console.warn("recenterSvg: No valid shapes found");
    return { svg, shapes };
  }

  // Compute bounding box of all floor paths
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  shapes.forEach((shapeObj) => {
    if (!shapeObj || !shapeObj.floor || !shapeObj.floor.shape) return; // Skip invalid entries
    const d = shapeObj.floor.shape.getAttribute("d");
    if (!d) return;
    const bbox = getPathBoundingBox(d);

    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
  });

  if (
    minX === Infinity ||
    minY === Infinity ||
    maxX === -Infinity ||
    maxY === -Infinity
  ) {
    console.warn("recenterSvg: Could not compute bounding box.");
    return { svg, shapes };
  }

  // Calculate the new dimensions and offsets
  const width = maxX - minX + 2 * padding;
  const height = maxY - minY + 2 * padding;
  const offsetX = minX - padding;
  const offsetY = minY - padding;

  // Adjust all floor and ceiling shapes
  shapes = shapes
    .map((shapeObj) => {
      if (!shapeObj || !shapeObj.floor || !shapeObj.floor.shape)
        return shapeObj; // Skip invalid entries

      return {
        floor: {
          shape: translateIsometricPath(
            shapeObj.floor.shape,
            -offsetX,
            -offsetY
          ),
          z: shapeObj.floor.z,
        },
        ceiling: shapeObj.ceiling
          ? {
              shape: translateIsometricPath(
                shapeObj.ceiling.shape,
                -offsetX,
                -offsetY
              ),
              z: shapeObj.ceiling.z,
            }
          : undefined,
      };
    })
    .filter(Boolean); // Remove any undefined results

  // Modify the SVG document
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  if (!svgElement) {
    console.warn("recenterSvg: No valid SVG element found.");
    return { svg, shapes };
  }

  // Update the viewBox and size
  svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svgElement.setAttribute("width", width);
  svgElement.setAttribute("height", height);

  // Remove existing paths and append updated floor and ceiling shapes
  svgElement.querySelectorAll("path").forEach((path) => path.remove());
  shapes.forEach(({ floor, ceiling }) => {
    svgElement.appendChild(floor.shape.cloneNode(true));
    if (ceiling) {
      svgElement.appendChild(ceiling.shape.cloneNode(true));
    }
  });

  return { svg: dom.serialize(), shapes };
}
