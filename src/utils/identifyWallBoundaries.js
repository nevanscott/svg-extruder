import { createCanvas } from "canvas";
import paper from "paper";

/**
 * Identifies boundary points in an SVG path:
 * - Detects **sharp corners** (angle-based)
 * - Finds **leftmost & rightmost extrema**
 * - Ignores false corners from smooth transitions
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

    if (angle < 135 && !isSmooth) {
      boundaryPoints.push({ x: curr.x, y: curr.y });
    }
  }

  // 🎯 Find leftmost & rightmost extrema
  const extrema = getPathExtrema(path);

  [extrema.left, extrema.right].forEach((extremum) => {
    if (!boundaryPoints.some((p) => Math.abs(p.x - extremum.x) < 0.01)) {
      boundaryPoints.push(extremum);
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
  const sampledPoints = samplePath(path, 100);

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
