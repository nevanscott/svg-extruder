import { calculateBoundingBox } from "./calculateBoundingBox.js";
import { transformToIsometric } from "./transformToIsometric.js";
import { darkenColor } from "./darkenColor.js";
import { createPathElement } from "./createPathElement.js"; // Assuming you have this function for paths

// Extrude a rounded rectangle
export function extrudeRoundrect(roundRect, extrusionHeight = 20) {
  try {
    const x = parseFloat(roundRect.getAttribute("x")) || 0;
    const y = parseFloat(roundRect.getAttribute("y")) || 0;
    const width = parseFloat(roundRect.getAttribute("width")) || 0;
    const height = parseFloat(roundRect.getAttribute("height")) || 0;
    const rx = parseFloat(roundRect.getAttribute("rx")) || 0;
    const fillColor = roundRect.getAttribute("fill") || "none";

    // Darken the wall colors
    const wallColor1 = darkenColor(fillColor, 0.8);
    const wallColor2 = darkenColor(fillColor, 0.9);

    // Define corner points
    const topLeft = [x + rx, y];
    const topRight = [x + width - rx, y];
    const bottomLeft = [x + rx, y + height];
    const bottomRight = [x + width - rx, y + height];

    // Transform corner points to isometric
    const isoTopLeft = transformToIsometric(...topLeft);
    const isoTopRight = transformToIsometric(...topRight);
    const isoBottomLeft = transformToIsometric(...bottomLeft);
    const isoBottomRight = transformToIsometric(...bottomRight);

    // Path for the roof
    const roofPath = `
      M ${isoTopLeft[0]} ${isoTopLeft[1]}
      L ${isoTopRight[0]} ${isoTopRight[1]}
      A ${rx} ${rx * 0.5} 0 0 1 ${isoBottomRight[0]} ${isoBottomRight[1]}
      L ${isoBottomLeft[0]} ${isoBottomLeft[1]}
      A ${rx} ${rx * 0.5} 0 0 1 ${isoTopLeft[0]} ${isoTopLeft[1]}
      Z
    `.trim();

    const roof = createPathElement(roofPath, fillColor);

    // Create walls (unchanged for now)
    const walls = [
      // Left wall
      createPathElement(
        `M ${isoTopLeft[0]} ${isoTopLeft[1]}
         L ${isoBottomLeft[0]} ${isoBottomLeft[1]}
         L ${isoBottomLeft[0]} ${isoBottomLeft[1] - extrusionHeight}
         L ${isoTopLeft[0]} ${isoTopLeft[1] - extrusionHeight}
         Z`,
        wallColor1
      ),
      // Front wall
      createPathElement(
        `M ${isoBottomLeft[0]} ${isoBottomLeft[1]}
         L ${isoBottomRight[0]} ${isoBottomRight[1]}
         L ${isoBottomRight[0]} ${isoBottomRight[1] - extrusionHeight}
         L ${isoBottomLeft[0]} ${isoBottomLeft[1] - extrusionHeight}
         Z`,
        wallColor2
      ),
      // Right wall
      createPathElement(
        `M ${isoTopRight[0]} ${isoTopRight[1]}
         L ${isoBottomRight[0]} ${isoBottomRight[1]}
         L ${isoBottomRight[0]} ${isoBottomRight[1] - extrusionHeight}
         L ${isoTopRight[0]} ${isoTopRight[1] - extrusionHeight}
         Z`,
        wallColor1
      ),
    ];

    // Calculate the bounding box
    const boundingBox = calculateBoundingBox([roof, ...walls]);

    return { roof, walls, boundingBox };
  } catch (error) {
    console.error("Error in extrudeRoundrect:", error);
    return null;
  }
}
