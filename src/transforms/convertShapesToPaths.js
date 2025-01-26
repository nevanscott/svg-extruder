import { JSDOM } from "jsdom";
import createPathFromShape from "../utils/createPathFromShape.js";

export default async function convertShapesToPaths(svg) {
  // Parse the SVG string into an SVG document
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;

  // Find all shape elements (rect, circle, ellipse, line, polyline, polygon)
  const shapes = Array.from(
    doc.querySelectorAll("rect, circle, ellipse, line, polyline, polygon")
  );

  // Convert each shape to a path
  shapes.forEach((shape) => {
    const path = createPathFromShape(shape);
    shape.replaceWith(path);
  });

  // Serialize the SVG document back to a string
  svg = dom.serialize();

  return svg;
}
