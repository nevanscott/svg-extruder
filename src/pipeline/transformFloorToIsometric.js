import transformPathToIsometric from "../transforms/transformPathToIsometric.js";
import { JSDOM } from "jsdom";

export default ({ svg, shapes }) => {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  // ✅ Apply isometric transformation while preserving all floor properties
  shapes = shapes.map((shape) => ({
    ...shape,
    floor: {
      path: transformPathToIsometric(shape.floor.path, shape.floor.elevation), // ✅ Use `elevation`
      fillColor: shape.floor.fillColor, // Preserve original fill color
      elevation: shape.floor.elevation, // ✅ Keep elevation instead of `z`
    },
  }));

  // ✅ Remove all existing paths before rendering updated floors
  svgElement.querySelectorAll("path").forEach((path) => path.remove());

  // ✅ Render transformed floor paths
  shapes.forEach(({ floor }) => {
    if (!floor.path) return;

    const floorPath = doc.createElementNS("http://www.w3.org/2000/svg", "path");
    floorPath.setAttribute("d", floor.path.getAttribute("d"));
    floorPath.setAttribute("fill", floor.fillColor || "gray"); // Maintain color

    svgElement.appendChild(floorPath);
  });

  // ✅ Ensure `svgDebug` is identical to `svg`
  const updatedSvg = dom.serialize();
  return { svg: updatedSvg, svgDebug: updatedSvg, shapes };
};
