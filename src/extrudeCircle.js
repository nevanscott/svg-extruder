import { createEllipseElement } from "./createEllipseElement.js";
import { createPathElement } from "./createPathElement.js";
import { transformToIsometric } from "./transformToIsometric.js";

export function extrudeCircle(circle, extrusionHeight = 20) {
  const cx = parseFloat(circle.getAttribute("cx")) || 0;
  const cy = parseFloat(circle.getAttribute("cy")) || 0;
  const r = parseFloat(circle.getAttribute("r")) || 0;
  const fillColor = circle.getAttribute("fill") || "none";

  // Transform the center of the top and bottom circles to isometric
  const centerTop = transformToIsometric(cx, cy);
  const centerBottom = transformToIsometric(cx, cy, -extrusionHeight);

  // Calculate the isometric radii for squashing
  const radiusX = r;
  const radiusY = r * 0.5;

  // Define the top and bottom arcs
  const wallPath = `
    M ${centerTop[0] - radiusX},${centerTop[1]}
    A ${radiusX} ${radiusY} 0 0 0 ${centerTop[0] + radiusX},${centerTop[1]}
    L ${centerBottom[0] + radiusX},${centerBottom[1]}
    A ${radiusX} ${radiusY} 0 0 1 ${centerBottom[0] - radiusX},${
    centerBottom[1]
  }
    Z
  `.trim();

  // Create roof element
  const roofElement = createEllipseElement(
    centerTop,
    radiusX,
    radiusY,
    fillColor
  );

  // Create wall element
  const wallElement = createPathElement(wallPath, fillColor);

  // Calculate bounding box internally
  const boundingBox = {
    minX: centerBottom[0] - radiusX, // Leftmost point
    minY: Math.min(centerTop[1] - radiusY, centerBottom[1] - radiusY), // Topmost point
    maxX: centerBottom[0] + radiusX, // Rightmost point
    maxY: centerBottom[1] + radiusY, // Bottommost point
    width: 2 * radiusX, // Total width
    height:
      centerBottom[1] +
      radiusY -
      Math.min(centerTop[1] - radiusY, centerBottom[1] - radiusY), // Total height
  };

  // Return the extrusion data
  return {
    roof: roofElement,
    walls: [wallElement],
    fillColor,
    boundingBox,
  };
}
