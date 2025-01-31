import convertShapesToPaths from "../transforms/convertShapesToPaths.js";
import createPathFromShape from "../utils/createPathFromShape.js";

export default async ({ svg, shapes }) => {
  svg = await convertShapesToPaths(svg);
  shapes = shapes.map(({ shape }) => createPathFromShape(shape));
  return { svg, shapes };
};
