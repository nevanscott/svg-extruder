import { identifyWallBoundaries } from "../utils/identifyWallBoundaries.js";
import { visualizeWallBoundaries } from "../utils/visualizeWallBoundaries.js";
import {
  parseSvg,
  serializeSvg,
  createSvgElement,
  removeElements,
} from "../utils/environment.js";

export default ({ svg, shapes }) => {
  // ✅ Process walls and extract wall boundaries
  shapes = shapes.map((shape) => {
    const updatedWalls = shape.walls.map((wall) => {
      const basePath = wall.base;
      const pathD = basePath.getAttribute("d");

      // ✅ Use identifyWallBoundaries on the base path
      const bounds = identifyWallBoundaries(pathD);

      return {
        ...wall,
        bounds, // ✅ Store the identified boundaries for the wall
      };
    });

    return {
      ...shape,
      walls: updatedWalls, // ✅ Update walls with boundaries
    };
  });

  // ✅ Generate debug SVG that includes wall boundaries
  const { doc: debugDoc, svgElement: debugSvgElement } = parseSvg(svg);

  // ✅ Remove all non-floor paths
  removeElements(debugDoc, "path");

  // ✅ Add only floor paths
  shapes.forEach(({ floor }) => {
    if (!floor?.path) return;
    debugSvgElement.appendChild(floor.path.cloneNode(true));
  });

  // ✅ Visualize wall boundaries in the debug SVG
  let debugSvg = serializeSvg(debugDoc);
  shapes.forEach(({ walls }, shapeIndex) => {
    walls.forEach((wall, wallIndex) => {
      // Visualize boundaries for each wall
      debugSvg = visualizeWallBoundaries(
        debugSvg,
        wall.bounds,
        `${shapeIndex}-${wallIndex}`
      );
    });
  });

  return {
    svg, // ✅ Keep original SVG unchanged
    svgDebug: debugSvg, // ✅ Debug version: walls + boundaries visualized
    shapes, // ✅ Pass updated shape model
  };
};
