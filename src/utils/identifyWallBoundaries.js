import { getPathBoundingBox } from "./getPathBoundingBox.js";
import { parsePath } from "./parsePath.js";

// Utility: Identify wall boundary points
export function identifyWallBoundaries(pathD) {
  const points = parsePath(pathD); // Extract (x, y) points from path

  let boundaryPoints = [];

  // Find sharp turns (not part of curves)
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // If this segment is not part of a curve, consider it a sharp turn
    if (!curr.isCurve) {
      boundaryPoints.push(curr);
    }
  }

  // Detect horizontal extrema
  const { minX, maxX, minY, maxY } = getPathBoundingBox(pathD);
  boundaryPoints.push({ x: minX, y: (minY + maxY) / 2 });
  boundaryPoints.push({ x: maxX, y: (minY + maxY) / 2 });

  return boundaryPoints;
}
