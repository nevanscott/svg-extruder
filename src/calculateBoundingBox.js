import { SVG, registerWindow } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";

export function calculateBoundingBox(elements) {
  const window = createSVGWindow();
  const document = window.document;

  registerWindow(window, document);
  const draw = SVG(document.documentElement);

  elements.forEach((element) => {
    draw.svg(element); // Add element to SVG container
  });

  const combinedBBox = draw.bbox(); // Compute bounding box

  return {
    minX: combinedBBox.x,
    minY: combinedBBox.y,
    width: combinedBBox.width,
    height: combinedBBox.height,
  };
}
