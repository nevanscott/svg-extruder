import { calculateBoundingBox } from "./calculateBoundingBox.js";
import { transformToIsometric } from "./transformToIsometric.js";
import { createPolygonElement } from "./createPolygonElement.js";
import { darkenColor } from "./darkenColor.js";

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

    const isoTopLeft = transformToIsometric(...topLeft);
    const isoTopRight = transformToIsometric(...topRight);
    const isoBottomLeft = transformToIsometric(...bottomLeft);
    const isoBottomRight = transformToIsometric(...bottomRight);

    const isoTopLeftExtruded = transformToIsometric(
      ...topLeft,
      -extrusionHeight
    );
    const isoTopRightExtruded = transformToIsometric(
      ...topRight,
      -extrusionHeight
    );
    const isoBottomLeftExtruded = transformToIsometric(
      ...bottomLeft,
      -extrusionHeight
    );
    const isoBottomRightExtruded = transformToIsometric(
      ...bottomRight,
      -extrusionHeight
    );

    // Create roof
    const roof = createPolygonElement(
      [isoTopLeft, isoTopRight, isoBottomRight, isoBottomLeft],
      fillColor
    );

    // Create walls
    const walls = [
      // Left wall
      createPolygonElement(
        [isoTopLeft, isoBottomLeft, isoBottomLeftExtruded, isoTopLeftExtruded],
        wallColor1
      ),
      // Front wall
      createPolygonElement(
        [
          isoBottomLeft,
          isoBottomRight,
          isoBottomRightExtruded,
          isoBottomLeftExtruded,
        ],
        wallColor2
      ),
      // Right wall
      createPolygonElement(
        [
          isoTopRight,
          isoBottomRight,
          isoBottomRightExtruded,
          isoTopRightExtruded,
        ],
        wallColor1
      ),
    ];

    // Calculate bounding box
    const boundingBox = calculateBoundingBox([roof, ...walls]);

    return { roof, walls, boundingBox };
  } catch (error) {
    console.error("Error in extrudeRoundrect:", error);
    return null;
  }
}
