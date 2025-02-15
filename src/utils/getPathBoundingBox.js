import boundingBox from "svg-path-bounding-box";

/**
 * Compute the bounding box of an SVG path using svg-path-bounding-box.
 */
export function getPathBoundingBox(d) {
  if (!d) {
    console.error("getPathBoundingBox: Path data is null or empty.");
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  try {
    // Calculate the bounding box using the library
    const bbox = boundingBox(d);

    return {
      minX: bbox.x1,
      minY: bbox.y1,
      maxX: bbox.x2,
      maxY: bbox.y2,
    };
  } catch (error) {
    console.error("Error in getPathBoundingBox:", {
      pathData: d,
      error: error.message,
    });
    throw error;
  }
}
