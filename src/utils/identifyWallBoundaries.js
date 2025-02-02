import { createCanvas } from "canvas";
import paper from "paper";

/**
 * Identifies boundary points in an SVG path:
 * - Detects **sharp corners** (angle-based)
 * - Finds **local extrema** along curved segments (only vertical extrema)
 * - Ensures **inner concave intersections** are included
 */
export function identifyWallBoundaries(pathD) {
  const canvas = createCanvas(100, 100);
  paper.setup(canvas);

  const path = new paper.Path(pathD);
  if (path.segments.length < 2) return [];

  let boundaryPoints = [];

  // 🔍 Step 1: Detect sharp and concave corners
  path.segments.forEach((segment, i) => {
    const prev =
      path.segments[(i - 1 + path.segments.length) % path.segments.length]
        .point;
    const curr = segment.point;
    const next = path.segments[(i + 1) % path.segments.length].point;

    if (isBoundaryCorner(prev, curr, next, path)) {
      boundaryPoints.push({ x: curr.x, y: curr.y });
    }
  });

  // 🎯 Step 2: Find **vertical extrema** along curved segments
  const extremaPoints = findVerticalExtrema(path);
  extremaPoints.forEach((extremum) => {
    if (!boundaryPoints.some((p) => isDuplicatePoint(p, extremum, 0.1))) {
      boundaryPoints.push(extremum);
    }
  });

  // 🎯 Step 3: Detect **concave intersections**
  const concaveIntersections = detectConcaveIntersections(path);
  concaveIntersections.forEach((point) => {
    if (!boundaryPoints.some((p) => isDuplicatePoint(p, point, 0.1))) {
      boundaryPoints.push(point);
    }
  });

  // ✅ Step 4: Remove duplicates
  return deduplicatePoints(boundaryPoints);
}

/**
 * Finds **vertical extrema** along curved path segments.
 */
function findVerticalExtrema(path) {
  const numSamples = 300;
  const sampledPoints = Array.from({ length: numSamples + 1 }, (_, j) => {
    const offset = (j / numSamples) * path.length;
    return path.getPointAt(offset);
  });

  return sampledPoints
    .map((point, i, arr) => {
      if (i === 0 || i === arr.length - 1) return null;
      const prevX = arr[i - 1].x,
        currX = point.x,
        nextX = arr[i + 1].x;
      return (currX > prevX && currX > nextX) ||
        (currX < prevX && currX < nextX)
        ? { x: currX, y: point.y }
        : null;
    })
    .filter(Boolean);
}

/**
 * Determines if a point should be a boundary corner.
 */
function isBoundaryCorner(prev, curr, next, path) {
  return (
    !isSmoothPoint(path, curr) &&
    (calculateAngle(prev, curr, next) < 125 ||
      isConcave(prev, curr, next) ||
      isLikelyCorner(prev, curr, next))
  );
}

/**
 * Detects **concave intersections** that might not be caught by angle-based detection.
 */
function detectConcaveIntersections(path) {
  return path.segments
    .map(({ point }, i, segments) => {
      const prev = segments[(i - 1 + segments.length) % segments.length].point;
      const next = segments[(i + 1) % segments.length].point;
      return isConcave(prev, point, next) && !isSmoothPoint(path, point)
        ? { x: point.x, y: point.y }
        : null;
    })
    .filter(Boolean);
}

/**
 * Deduplicates points within a tolerance.
 */
function deduplicatePoints(points, tolerance = 0.1) {
  return points.filter(
    (point, i, self) =>
      i === self.findIndex((p) => isDuplicatePoint(p, point, tolerance))
  );
}

/**
 * Checks if two points are nearly identical within a tolerance.
 */
function isDuplicatePoint(p1, p2, tolerance = 0.1) {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

/**
 * Calculates the angle between three points.
 */
function calculateAngle(prev, curr, next) {
  return Math.abs(prev.subtract(curr).angle - next.subtract(curr).angle);
}

/**
 * Determines if a corner is concave.
 */
function isConcave(prev, curr, next) {
  return (
    (prev.x - curr.x) * (next.y - curr.y) -
      (prev.y - curr.y) * (next.x - curr.x) <
    0
  );
}

/**
 * Detects if a point is **likely a sharp corner**.
 */
function isLikelyCorner(prev, curr, next) {
  const dx1 = prev.x - curr.x,
    dy1 = prev.y - curr.y;
  const dx2 = next.x - curr.x,
    dy2 = next.y - curr.y;
  return (
    Math.abs(dx1 * dx2 + dy1 * dy2) < 5 && Math.abs(dx1 * dy2 - dy1 * dx2) > 5
  );
}

/**
 * Checks if a point lies on a smooth curve.
 */
function isSmoothPoint(path, point) {
  return path.segments.some(
    (segment) =>
      Math.abs(segment.point.x - point.x) < 0.01 &&
      Math.abs(segment.point.y - point.y) < 0.01 &&
      (segment.handleIn.length > 0 || segment.handleOut.length > 0)
  );
}
