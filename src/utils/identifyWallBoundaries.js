import { getPathBoundingBox } from "./getPathBoundingBox.js";
import { parsePath } from "./parsePath.js";

/**
 * Identify key wall boundary points along a path.
 */
export function identifyWallBoundaries(pathD) {
  const points = parsePath(pathD); // Extract (x, y) points from path
  let boundaryPoints = [];

  if (points.length < 2) return boundaryPoints; // Skip if not enough points

  const isClosedPath =
    points.length > 2 &&
    points[0].x === points[points.length - 1].x &&
    points[0].y === points[points.length - 1].y;

  // ✅ **Always include the first point**
  boundaryPoints.push(points[0]);

  // 🔍 **Detect sharp turns**
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    if (!curr.isCurve) {
      const angle = calculateAngle(prev, curr, next);
      if (angle < 135) {
        boundaryPoints.push(curr);
      }
    }
  }

  // ✅ **Explicitly check the last point**
  if (!isClosedPath && points.length > 2) {
    const last = points[points.length - 1];
    const secondLast = points[points.length - 2];
    const first = points[0];

    const angle = calculateAngle(secondLast, last, first);
    if (angle < 135) {
      boundaryPoints.push(last);
    }
  }

  // 🔍 **Detect extrema points (leftmost and rightmost)**
  const { minX, maxX } = getPathBoundingBox(pathD);
  let leftmost = points[0];
  let rightmost = points[0];

  for (let point of points) {
    if (point.x < leftmost.x) leftmost = point;
    if (point.x > rightmost.x) rightmost = point;
  }

  // ✅ **Ensure extrema points are unique**
  if (!boundaryPoints.some((p) => p.x === leftmost.x && p.y === leftmost.y)) {
    boundaryPoints.push(leftmost);
  }
  if (!boundaryPoints.some((p) => p.x === rightmost.x && p.y === rightmost.y)) {
    boundaryPoints.push(rightmost);
  }

  return boundaryPoints;
}

/**
 * Calculate the angle between three points (prev → curr → next)
 * @returns Angle in degrees
 */
function calculateAngle(p1, p2, p3) {
  const dx1 = p1.x - p2.x;
  const dy1 = p1.y - p2.y;
  const dx2 = p3.x - p2.x;
  const dy2 = p3.y - p2.y;

  const dot = dx1 * dx2 + dy1 * dy2; // Dot product
  const mag1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
  const mag2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  if (mag1 === 0 || mag2 === 0) return 180; // Avoid division by zero

  const cosine = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * (180 / Math.PI); // Convert to degrees
}
