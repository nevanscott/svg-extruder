import {
  parseSvg,
  serializeSvg,
  createSvgElement,
  removeElements,
} from "../utils/environment.js";

export default ({ svg, shapes }) => {
  const { doc, svgElement } = parseSvg(svg);

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
  removeElements(doc, "path");

  // ✅ Render floor paths with original colors
  shapes.forEach(({ floor }) => {
    if (!floor.path) return;

    const floorPath = createSvgElement(doc, "path", {
      d: floor.path.getAttribute("d"),
      fill: floor.fillColor || "gray", // Use original color
    });

    svgElement.appendChild(floorPath);
  });

  // ✅ Set `svgDebug` to be the same as `svg`
  const updatedSvg = serializeSvg(doc);
  return { svg: updatedSvg, svgDebug: updatedSvg, shapes };
};
