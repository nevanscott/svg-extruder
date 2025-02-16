import transformPathToIsometric from "../transforms/transformPathToIsometric.js";
import {
  parseSvg,
  serializeSvg,
  createSvgElement,
} from "../utils/environment.js";

export default ({ svg, shapes }) => {
  // ✅ Parse the SVG into a DOM structure
  const { doc, svgElement } = parseSvg(svg);

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

    const floorPath = createSvgElement(doc, "path", {
      d: floor.path.getAttribute("d"),
      fill: floor.fillColor || "gray", // Maintain color
    });

    svgElement.appendChild(floorPath);
  });

  // ✅ Ensure `svgDebug` is identical to `svg`
  const updatedSvg = serializeSvg(doc);
  return { svg: updatedSvg, svgDebug: updatedSvg, shapes };
};
