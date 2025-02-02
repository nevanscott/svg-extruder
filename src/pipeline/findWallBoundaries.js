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

  // Apply visualization per shape so each has its own numbering
  let updatedSvg = svg;
  updatedShapes.forEach(({ wallBounds }, index) => {
    updatedSvg = visualizeWallBoundaries(updatedSvg, wallBounds, index);
  });

  return { svg: updatedSvg, shapes: updatedShapes };
};
