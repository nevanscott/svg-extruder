import createPathFromShape from "../utils/createPathFromShape.js";
import { parseSvg, serializeSvg } from "../utils/environment.js";

export default async function convertShapesToPaths(svg) {
  // Parse the SVG string into an SVG document
  const { doc } = parseSvg(svg);

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
  svg = serializeSvg(doc);

  return svg;
}
