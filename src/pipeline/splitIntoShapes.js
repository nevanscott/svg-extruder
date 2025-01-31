import getShapesFromSvg from "../transforms/getShapesFromSvg.js";

export default ({ svg, shapes = [] }) => {
  shapes = getShapesFromSvg(svg).map((shape) => ({
    type: shape.tagName,
    shape,
    fillColor: shape.getAttribute("fill"),
  }));
  return { svg, shapes };
};
