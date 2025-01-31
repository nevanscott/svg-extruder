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

  // 🔍 Detect sharp corners
  path.segments.forEach((seg, i, arr) => {
    if (i === 0 || i === arr.length - 1) return; // Skip first & last points

    const prev = arr[i - 1].point;
    const curr = seg.point;
    const next = arr[i + 1].point;

    const angle = calculateAngle(prev, curr, next);
    const isSmooth = seg.handleIn.length > 0 || seg.handleOut.length > 0;

    if (angle < 135 && !isSmooth) {
      boundaryPoints.push({ x: curr.x, y: curr.y });
    }
  });

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
  return {
    left: path.getNearestPoint(new paper.Point(bounds.left, bounds.centerY)),
    right: path.getNearestPoint(new paper.Point(bounds.right, bounds.centerY)),
  };
}

/**
 * Calculates the angle between three points.
 */
function calculateAngle(prev, curr, next) {
  const v1 = prev.subtract(curr);
  const v2 = next.subtract(curr);
  return v1.angle - v2.angle;
}
