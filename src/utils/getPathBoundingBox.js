import { Path } from "@svgdotjs/svg.js";

/**
 * Compute the bounding box of an SVG path.
 */
export function getPathBoundingBox(d) {
  if (!d) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  // Create an SVG path in-memory
  const path = new Path({ d });

  // Get the bounding box
  const bbox = path.bbox();

  return {
    minX: bbox.x,
    minY: bbox.y,
    maxX: bbox.x + bbox.width,
    maxY: bbox.y + bbox.height,
  };
}
