import { calculateBoundingBox } from "./calculateBoundingBox.js";
import { transformToIsometric } from "./transformToIsometric.js";
import { createPolygonElement } from "./createPolygonElement.js";

// Extrude a rectangle
export function extrudeRectangle(rect, extrusionHeight = 20) {
  try {
    const x = parseFloat(rect.getAttribute("x")) || 0;
    const y = parseFloat(rect.getAttribute("y")) || 0;
    const width = parseFloat(rect.getAttribute("width")) || 0;
    const height = parseFloat(rect.getAttribute("height")) || 0;
    const fillColor = rect.getAttribute("fill") || "none";

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

    const roof = createPolygonElement(
      [isoTopLeft, isoTopRight, isoBottomRight, isoBottomLeft],
      fillColor
    );
    const walls = [
      createPolygonElement(
        [isoTopLeft, isoBottomLeft, isoBottomLeftExtruded, isoTopLeftExtruded],
        fillColor
      ),
      createPolygonElement(
        [
          isoBottomLeft,
          isoBottomRight,
          isoBottomRightExtruded,
          isoBottomLeftExtruded,
        ],
        fillColor
      ),
      createPolygonElement(
        [
          isoTopRight,
          isoBottomRight,
          isoBottomRightExtruded,
          isoTopRightExtruded,
        ],
        fillColor
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
