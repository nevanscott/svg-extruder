import getShapesFromSvg from "../transforms/getShapesFromSvg.js";

export default ({ svg, shapes = [] }) => {
  shapes = getShapesFromSvg(svg).map((shape) => ({
    type: shape.tagName,
    fillColor: shape.getAttribute("fill") || "gray", // Default to gray if no fill
    rawElement: shape, // Preserve original shape reference
    elevation: 0, // Default elevation (ground level)
    height: 20, // Default height (20 units tall)
  }));

  return { svg, shapes };
};
