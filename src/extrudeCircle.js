import { createEllipseElement } from "./createEllipseElement.js";
import { createPathElement } from "./createPathElement.js";
import { transformToIsometric } from "./transformToIsometric.js";
import { darkenColor } from "./darkenColor.js";

export function extrudeCircle(circle, extrusionHeight = 20) {
  const cx = parseFloat(circle.getAttribute("cx")) || 0;
  const cy = parseFloat(circle.getAttribute("cy")) || 0;
  const r = parseFloat(circle.getAttribute("r")) || 0;
  const fillColor = circle.getAttribute("fill") || "none";

  // Darken the wall colors
  const wallColorLeft = darkenColor(fillColor, 0.9);
  const wallColorRight = darkenColor(fillColor, 0.8);

  // Transform the center of the top and bottom circles to isometric
  const centerTop = transformToIsometric(cx, cy);
  const centerBottom = transformToIsometric(cx, cy, -extrusionHeight);

  // Calculate the isometric radii
  const radiusX = r * 1.395; // Stretch horizontally
  const radiusY = r * 0.693; // Compress vertically

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

  // Create gradient for wall
  const gradientId = `gradient-${cx}-${cy}`;
  const gradientElement = `
    <defs>
      <linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse"
        x1="${centerBottom[0] - radiusX}" y1="${centerBottom[1]}"
        x2="${centerBottom[0] + radiusX}" y2="${centerBottom[1]}">
        <stop offset="0%" style="stop-color:${wallColorLeft};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${wallColorRight};stop-opacity:1" />
      </linearGradient>
    </defs>
  `.trim();

  // Create roof element
  const roofElement = createEllipseElement(
    centerTop,
    radiusX,
    radiusY,
    fillColor
  );

  // Create wall element with gradient fill
  const wallElement = createPathElement(wallPath, `url(#${gradientId})`);

  // Calculate bounding box
  const boundingBox = {
    minX: centerBottom[0] - radiusX,
    minY: Math.min(centerTop[1] - radiusY, centerBottom[1] - radiusY),
    maxX: centerBottom[0] + radiusX,
    maxY: centerBottom[1] + radiusY,
    width: 2 * radiusX,
    height:
      centerBottom[1] +
      radiusY -
      Math.min(centerTop[1] - radiusY, centerBottom[1] - radiusY),
  };

  // Return extrusion data
  return {
    roof: roofElement,
    walls: [gradientElement + wallElement],
    fillColor,
    boundingBox,
  };
}
