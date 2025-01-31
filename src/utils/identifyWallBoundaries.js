import { SVG, Path } from "@svgdotjs/svg.js";
import { parsePath } from "./parsePath.js";

/**
 * Identifies wall boundary points, including:
 * - Sharp turns (angle-based detection)
 * - Leftmost and rightmost extrema (accurately extracted from SVG.js)
 */
export function identifyWallBoundaries(pathD) {
  const points = parsePath(pathD);
  let boundaryPoints = [];

  if (points.length < 2) return boundaryPoints;

  const isClosedPath =
    points.length > 2 &&
    points[0].x === points[points.length - 1].x &&
    points[0].y === points[points.length - 1].y;

  // ✅ Always include the first point
  boundaryPoints.push(points[0]);

  // 🔍 Detect sharp turns
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

  // ✅ Check the last point
  if (!isClosedPath && points.length > 2) {
    const last = points[points.length - 1];
    const secondLast = points[points.length - 2];
    const first = points[0];

    const angle = calculateAngle(secondLast, last, first);
    if (angle < 135) {
      boundaryPoints.push(last);
    }
  }

  // 🎯 Use @svgdotjs/svg.js to find accurate extrema
  const extrema = getPathExtrema(pathD);

  // 🔥 Add extrema points (leftmost & rightmost)
  if (!boundaryPoints.some((p) => p.x === extrema.left.x)) {
    boundaryPoints.push(extrema.left);
  }
  if (!boundaryPoints.some((p) => p.x === extrema.right.x)) {
    boundaryPoints.push(extrema.right);
  }

  // 🔄 Remove duplicates
  boundaryPoints = Array.from(new Set(boundaryPoints.map(JSON.stringify))).map(
    JSON.parse
  );

  return boundaryPoints;
}

/**
 * Uses `@svgdotjs/svg.js` to find accurate extrema (leftmost & rightmost)
 */
function getPathExtrema(pathD) {
  const svg = SVG().size(0, 0); // Create a temporary SVG
  const path = svg.path(pathD); // Create an SVG path

  const bbox = path.bbox(); // Get the bounding box

  return {
    left: { x: bbox.x, y: bbox.cy },
    right: { x: bbox.x2, y: bbox.cy },
  };
}

/**
 * Calculate the angle between three points (prev, curr, next)
 * @param {Object} prev - Previous point {x, y}
 * @param {Object} curr - Current point {x, y}
 * @param {Object} next - Next point {x, y}
 * @returns {number} - Angle in degrees
 */
function calculateAngle(prev, curr, next) {
  const dx1 = curr.x - prev.x;
  const dy1 = curr.y - prev.y;
  const dx2 = next.x - curr.x;
  const dy2 = next.y - curr.y;

  const dot = dx1 * dx2 + dy1 * dy2;
  const mag1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
  const mag2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  if (mag1 === 0 || mag2 === 0) return 180;

  let angle = Math.acos(dot / (mag1 * mag2));

  return (angle * 180) / Math.PI;
}
