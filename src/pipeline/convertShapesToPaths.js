import { JSDOM } from "jsdom";
import convertShapesToPaths from "../transforms/convertShapesToPaths.js";
import createPathFromShape from "../utils/createPathFromShape.js";

export default async ({ svg, svgDebug, shapes }) => {
  // Convert SVG shapes into paths
  svg = await convertShapesToPaths(svg);

  // Parse the SVG into a DOM structure
  const dom = new JSDOM(svg);
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  // Update shape model
  shapes = shapes.map((shape) => ({
    ...shape,
    path: createPathFromShape(shape.rawElement), // Ensure we pass the raw SVG element
  }));

  // ✅ Create a brand new debug SVG document
  const debugDom = new JSDOM(
    `<!DOCTYPE html><svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgElement.getAttribute(
      "viewBox"
    )}" width="${svgElement.getAttribute(
      "width"
    )}" height="${svgElement.getAttribute("height")}"></svg>`
  );
  const debugDoc = debugDom.window.document;
  const debugSvgElement = debugDoc.querySelector("svg");

  // ✅ Append only the red outline paths
  shapes.forEach((shape) => {
    const debugPath = debugDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    debugPath.setAttribute("d", shape.path.getAttribute("d"));
    debugPath.setAttribute("stroke", "red");
    debugPath.setAttribute("fill", "none");
    debugPath.setAttribute("stroke-width", "1");

    debugSvgElement.appendChild(debugPath);
  });

  // ✅ Serialize back to strings
  svgDebug = debugDom.serialize();
  svg = dom.serialize();

  return { svg, svgDebug, shapes };
};
