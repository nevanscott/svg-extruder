import { calculateBoundingBox } from "./calculateBoundingBox.js";
import { transformToIsometric } from "./transformToIsometric.js";
import { createPolygonElement } from "./createPolygonElement.js";
import { darkenColor } from "./darkenColor.js";

// Extrude a rectangle
export function extrudeRectangle(rect, extrusionHeight = 20) {
  try {
    const x = parseFloat(rect.getAttribute("x")) || 0;
    const y = parseFloat(rect.getAttribute("y")) || 0;
    const width = parseFloat(rect.getAttribute("width")) || 0;
    const height = parseFloat(rect.getAttribute("height")) || 0;
    const fillColor = rect.getAttribute("fill") || "none";

    // Darken the wall colors with different factors
    const wallColor1 = darkenColor(fillColor, 0.8);
    const wallColor2 = darkenColor(fillColor, 0.9);

    const topLeft = [x, y];
    const topRight = [x + width, y];
    const bottomLeft = [x, y + height];
    const bottomRight = [x + width, y + height];

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

    // Create the roof with the original fill color
    const roof = createPolygonElement(
      [isoTopLeft, isoTopRight, isoBottomRight, isoBottomLeft],
      fillColor
    );

    // Create walls with different darkened colors
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

    // Calculate the bounding box for both the roof and walls
    const boundingBox = calculateBoundingBox([roof, ...walls]);

    return { roof, walls, boundingBox };
  } catch (error) {
    console.error("Error in extrudeRectangle:", error);
    return null;
  }
}
