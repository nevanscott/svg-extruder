import { parseSvg } from "../utils/environment.js";

export default function (svg) {
  // Parse the SVG string into an SVG document
  const { doc } = parseSvg(svg);

  // Find all shape elements (rect, circle, ellipse, line, path, polyline, polygon)
  const shapes = Array.from(
    doc.querySelectorAll("rect, circle, ellipse, line, path, polyline, polygon")
  );

  return shapes;
}
