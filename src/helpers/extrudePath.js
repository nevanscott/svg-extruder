import { calculateBoundingBox } from "../utils/calculateBoundingBox.js";
import { transformToIsometric } from "../utils/transformToIsometric.js";
import { createPolygonElement } from "../utils/createPolygonElement.js";
import { darkenColor } from "../utils/darkenColor.js";

// Extrude a general path
export function extrudePath(pathElement, extrusionHeight = 20) {
  try {
    const d = pathElement.getAttribute("d");
    const fillColor = pathElement.getAttribute("fill") || "none";

    // Parse the path into individual segments (e.g., M, L, Q, C commands)
    const segments = parsePath(d);

    // Transform path into floor and ceiling in 3D
    const floorPoints = segments.map((segment) =>
      segment.points.map(([x, y]) => [x, y, 0])
    );
    const ceilingPoints = segments.map((segment) =>
      segment.points.map(([x, y]) => [x, y, extrusionHeight])
    );

    // Project points into isometric space
    const floorIsometric = floorPoints
      .flat()
      .map(([x, y, z]) => transformToIsometric(x, y, z));
    const ceilingIsometric = ceilingPoints
      .flat()
      .map(([x, y, z]) => transformToIsometric(x, y, z));

    // Find extreme points in isometric space
    const extremeLeft = Math.min(...floorIsometric.map(([x]) => x));
    const extremeRight = Math.max(...floorIsometric.map(([x]) => x));

    // Split wall segments at extreme points
    const wallSegments = splitWallsAtExtremes(
      floorIsometric,
      ceilingIsometric,
      extremeLeft,
      extremeRight
    );

    // Create wall polygons
    const wallColor1 = darkenColor(fillColor, 0.8);
    const wallPolygons = wallSegments.map((segment) =>
      createPolygonElement(segment, wallColor1)
    );

    // Create ceiling polygon
    const ceilingPolygon = createPolygonElement(ceilingIsometric, fillColor);

    // Calculate bounding box
    const boundingBox = calculateBoundingBox([ceilingPolygon, ...wallPolygons]);

    return { roof: ceilingPolygon, walls: wallPolygons, boundingBox };
  } catch (error) {
    console.error("Error in extrudePath:", error);
    return null;
  }
}

/**
 * Parses a path `d` attribute into individual segments.
 * Returns an array of { type: command, points: [[x1, y1], [x2, y2], ...] }.
 */
function parsePath(d) {
  // Implement a lightweight parser for path commands (M, L, Q, C, Z)
  const regex = /([MLQCZ])([^MLQCZ]*)/gi;
  const segments = [];
  let match;

  while ((match = regex.exec(d))) {
    const command = match[1];
    const points = match[2]
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .reduce((acc, val, i, arr) => {
        if (i % 2 === 0) acc.push([val, arr[i + 1]]);
        return acc;
      }, []);
    segments.push({ type: command, points });
  }
  return segments;
}

/**
 * Splits wall segments at extreme points.
 */
function splitWallsAtExtremes(floor, ceiling, extremeLeft, extremeRight) {
  const walls = [];
  for (let i = 0; i < floor.length; i++) {
    const start = floor[i];
    const end = floor[(i + 1) % floor.length];
    const ceilingStart = ceiling[i];
    const ceilingEnd = ceiling[(i + 1) % ceiling.length];

    if (
      (start[0] <= extremeLeft && end[0] >= extremeLeft) ||
      (start[0] <= extremeRight && end[0] >= extremeRight)
    ) {
      // Split wall at extreme points
      const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      walls.push([start, mid, [mid[0], mid[1], ceilingStart[2]], ceilingStart]);
      walls.push([mid, end, ceilingEnd, [mid[0], mid[1], ceilingEnd[2]]]);
    } else {
      // No split needed
      walls.push([start, end, ceilingEnd, ceilingStart]);
    }
  }
  return walls;
}
