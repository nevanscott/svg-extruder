import getShapesFromSvg from "../transforms/getShapesFromSvg.js";

export default ({ svg, shapes = [] }) => {
  const shapeElements = getShapesFromSvg(svg);

  shapes = shapeElements.map((shape) => {
    // Check if the shape itself has data-elevation and data-height attributes
    let elevation = shape.hasAttribute("data-elevation")
      ? parseFloat(shape.getAttribute("data-elevation")) || 0
      : 0; // Default to 0

    let height = shape.hasAttribute("data-height")
      ? parseFloat(shape.getAttribute("data-height")) || 20
      : 20; // Default to 20

    // If the shape itself doesn't have elevation or height, check its parent <g>
    let parent = shape.parentElement;
    while (parent) {
      if (parent.tagName === "g") {
        if (elevation === 0 && parent.hasAttribute("data-elevation")) {
          elevation = parseFloat(parent.getAttribute("data-elevation")) || 0;
        }
        if (height === 20 && parent.hasAttribute("data-height")) {
          height = parseFloat(parent.getAttribute("data-height")) || 20;
        }
      }
      parent = parent.parentElement;
    }

    return {
      type: shape.tagName,
      fillColor: shape.getAttribute("fill") || "gray", // Default to gray if no fill
      rawElement: shape, // Preserve original shape reference
      elevation, // Extracted from shape or inherited from parent <g>
      height, // Extracted from shape or inherited from parent <g>
    };
  });

  return { svg, shapes };
};
