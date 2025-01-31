import { identifyWallBoundaries } from "../utils/identifyWallBoundaries.js";
import { visualizeWallBoundaries } from "../utils/visualizeWallBoundaries.js";

export default (state) => {
  const floorPaths = state.shapes.map(({ floor }) =>
    floor.shape.getAttribute("d")
  );
  let boundaryPoints = [];

  floorPaths.forEach((d) => {
    boundaryPoints = boundaryPoints.concat(identifyWallBoundaries(d));
  });

  const updatedSvg = visualizeWallBoundaries(state.svg, boundaryPoints);
  return { ...state, svg: updatedSvg };
};
