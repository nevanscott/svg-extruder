import { JSDOM } from "jsdom";

export default function (svg) {
  // Parse the SVG string into an SVG document
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;

  // Find all shape elements (rect, circle, ellipse, line, path, polyline, polygon)
  const shapes = Array.from(
    doc.querySelectorAll("rect, circle, ellipse, line, path, polyline, polygon")
  );

  return shapes;
}
