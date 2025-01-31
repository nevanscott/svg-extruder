import { createCanvas } from "canvas";
import paper from "paper";

/**
 * Identifies boundary points in an SVG path:
 * - Detects **sharp corners** (angle-based)
 * - Finds **leftmost & rightmost extrema**
 * - Ensures **inner corners** are properly detected
 * - Avoids adding points on purely smooth curves
 */
export function identifyWallBoundaries(pathD) {
  const canvas = createCanvas(100, 100);
  paper.setup(canvas);

  const path = new paper.Path(pathD);
  let boundaryPoints = [];

  if (path.segments.length < 2) return boundaryPoints;

  // 🔍 Detect sharp corners & ensure **all** expected corners are included
  for (let i = 0; i < path.segments.length; i++) {
    const prev =
      path.segments[(i - 1 + path.segments.length) % path.segments.length]
        .point;
    const curr = path.segments[i].point;
    const next = path.segments[(i + 1) % path.segments.length].point;

    const angle = calculateAngle(prev, curr, next);
    const isSmooth =
      path.segments[i].handleIn.length > 0 ||
      path.segments[i].handleOut.length > 0;

    if (
      !isSmooth &&
      (angle < 125 ||
        (angle < 145 && isConcave(prev, curr, next)) ||
        isLikelyCorner(prev, curr, next))
    ) {
      boundaryPoints.push({ x: curr.x, y: curr.y });
    }
  }

  // 🎯 Find leftmost & rightmost extrema, ensuring smooth curves don't trigger false points
  const extrema = getPathExtrema(path);

  [extrema.left, extrema.right].forEach((extremum) => {
    if (
      !boundaryPoints.some(
        (p) =>
          Math.abs(p.x - extremum.x) < 0.01 && Math.abs(p.y - extremum.y) < 0.01
      )
    ) {
      if (!isSmoothPoint(path, extremum)) {
        boundaryPoints.push(extremum);
      }
    }
  });

  return boundaryPoints;
}

/**
 * Finds **leftmost & rightmost extrema** using Paper.js.
 */
function getPathExtrema(path) {
  const bounds = path.bounds;

  // Sample the path at high resolution to find the correct extrema y-coordinates
  const sampledPoints = samplePath(path, 200);

  const leftPoint = sampledPoints.reduce((closest, p) =>
    Math.abs(p.x - bounds.left) < Math.abs(closest.x - bounds.left)
      ? p
      : closest
  );

  const rightPoint = sampledPoints.reduce((closest, p) =>
    Math.abs(p.x - bounds.right) < Math.abs(closest.x - bounds.right)
      ? p
      : closest
  );

  return {
    left: { x: bounds.left, y: leftPoint.y },
    right: { x: bounds.right, y: rightPoint.y },
  };
}

/**
 * Samples `n` points along a path to get more accurate extrema detection.
 * @param {paper.Path} path - The Paper.js path object
 * @param {number} numSamples - Number of points to sample along the path
 * @returns {Array} - List of sampled points with `{x, y}`
 */
function samplePath(path, numSamples) {
  const sampledPoints = [];
  for (let i = 0; i <= numSamples; i++) {
    const point = path.getPointAt((i / numSamples) * path.length);
    sampledPoints.push({ x: point.x, y: point.y });
  }
  return sampledPoints;
}

/**
 * Calculates the angle between three points.
 */
function calculateAngle(prev, curr, next) {
  const v1 = prev.subtract(curr);
  const v2 = next.subtract(curr);
  return Math.abs(v1.angle - v2.angle); // Ensure the angle is positive
}

/**
 * Determines if a corner is concave by checking the cross product.
 */
function isConcave(prev, curr, next) {
  const cross =
    (prev.x - curr.x) * (next.y - curr.y) -
    (prev.y - curr.y) * (next.x - curr.x);
  return cross < 0; // Negative cross product = concave corner
}

/**
 * Detects if a point is **likely a sharp corner** even if the angle check is inconclusive.
 * This helps capture corners that are nearly 90 degrees but don't pass the threshold.
 */
function isLikelyCorner(prev, curr, next) {
  const dx1 = prev.x - curr.x;
  const dy1 = prev.y - curr.y;
  const dx2 = next.x - curr.x;
  const dy2 = next.y - curr.y;

  // Check for nearly perpendicular lines
  const dotProduct = dx1 * dx2 + dy1 * dy2;
  const crossProduct = dx1 * dy2 - dy1 * dx2;

  return Math.abs(dotProduct) < 5 && Math.abs(crossProduct) > 5;
}

/**
 * Checks if a point lies on a smooth curve.
 * Helps prevent false positives in rounded rectangles and circles.
 */
function isSmoothPoint(path, point) {
  for (const segment of path.segments) {
    if (
      Math.abs(segment.point.x - point.x) < 0.01 &&
      Math.abs(segment.point.y - point.y) < 0.01
    ) {
      return segment.handleIn.length > 0 || segment.handleOut.length > 0;
    }
  }
  return false;
}
