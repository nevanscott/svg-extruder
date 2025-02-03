import { JSDOM } from "jsdom";

export default ({ svg, shapes }) => {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  // ✅ Preserve shape model and add floor info
  shapes = shapes.map((shape) => ({
    ...shape,
    floor: {
      path: shape.path,
      fillColor: shape.fillColor,
      elevation: shape.elevation, // ✅ Use the shape's elevation
    },
  }));

  // ✅ Remove all existing paths from the main SVG
  svgElement.querySelectorAll("path").forEach((path) => path.remove());

  // ✅ Render floor paths with original colors
  shapes.forEach(({ floor }) => {
    if (!floor.path) return;

    const floorPath = doc.createElementNS("http://www.w3.org/2000/svg", "path");
    floorPath.setAttribute("d", floor.path.getAttribute("d"));
    floorPath.setAttribute("fill", floor.fillColor || "gray"); // Use original color

    svgElement.appendChild(floorPath);
  });

  // ✅ Set `svgDebug` to be the same as `svg`
  const updatedSvg = dom.serialize();
  return { svg: updatedSvg, svgDebug: updatedSvg, shapes };
};
