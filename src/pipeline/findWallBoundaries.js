import { identifyWallBoundaries } from "../utils/identifyWallBoundaries.js";
import { visualizeWallBoundaries } from "../utils/visualizeWallBoundaries.js";

export default ({ svg, shapes }) => {
  const updatedShapes = shapes.map(({ floor }) => {
    const pathD = floor.shape.getAttribute("d");
    const wallBounds = identifyWallBoundaries(pathD); // Get ordered boundary points

    return {
      floor,
      wallBounds, // Store boundary points in order
    };
  });

  // Optional: Visualize boundaries for debugging
  const boundaryPoints = updatedShapes.flatMap(({ wallBounds }) => wallBounds);
  const updatedSvg = visualizeWallBoundaries(svg, boundaryPoints);

  return { svg: updatedSvg, shapes: updatedShapes };
};
