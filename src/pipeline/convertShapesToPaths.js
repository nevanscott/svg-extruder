import {
  parseSvg,
  serializeSvg,
  createSvgElement,
} from "../utils/environment.js";
import convertShapesToPaths from "../transforms/convertShapesToPaths.js";
import createPathFromShape from "../utils/createPathFromShape.js";

export default async ({ svg, svgDebug, shapes }) => {
  // Convert SVG shapes into paths
  svg = await convertShapesToPaths(svg);

  // Parse the SVG into a DOM structure
  const { doc, svgElement } = parseSvg(svg);

  // Update shape model
  shapes = shapes.map((shape) => ({
    ...shape,
    path: createPathFromShape(shape.rawElement), // Ensure we pass the raw SVG element
  }));

  // ✅ Create a brand new debug SVG document
  const { doc: debugDoc, svgElement: debugSvgElement } = parseSvg(
    `<!DOCTYPE html><svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgElement.getAttribute(
      "viewBox"
    )}" width="${svgElement.getAttribute(
      "width"
    )}" height="${svgElement.getAttribute("height")}"></svg>`
  );

  // ✅ Append only the red outline paths
  shapes.forEach((shape) => {
    const debugPath = createSvgElement(debugDoc, "path", {
      d: shape.path.getAttribute("d"),
      stroke: "red",
      fill: "none",
      "stroke-width": "1",
    });

    debugSvgElement.appendChild(debugPath);
  });

  // ✅ Serialize back to strings
  svgDebug = serializeSvg(debugDoc);
  svg = serializeSvg(doc);

  return { svg, svgDebug, shapes };
};
