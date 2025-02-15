import { JSDOM } from "jsdom";
import paper from "paper";

export default ({ svg, shapes }) => {
  // ✅ Generate a new debug SVG
  const debugDom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const debugDoc = debugDom.window.document;
  const debugSvgElement = debugDoc.querySelector("svg");

  // ✅ Remove all non-floor paths
  debugSvgElement.querySelectorAll("path").forEach((path) => path.remove());

  // ✅ Process each shape
  shapes = shapes.map((shape) => {
    const pathD = shape.floor.path.getAttribute("d");

    // ✅ Set up Paper.js and create the floor path
    paper.setup(new paper.Size(100, 100));
    const floorPath = new paper.CompoundPath(pathD); // Use CompoundPath for potential compound shapes

    // ✅ Decompose compound paths into individual sub-paths
    const subPaths = floorPath.children || [floorPath];

    // ✅ Create a DOM to generate SVG elements
    const dom = new JSDOM(
      `<!DOCTYPE html><svg xmlns="http://www.w3.org/2000/svg"></svg>`
    );
    const doc = dom.window.document;

    // ✅ Process each sub-path into a wall
    const walls = subPaths.map((subPath, index) => {
      // Get the path data for the sub-path
      const subPathD = subPath.exportSVG().getAttribute("d");

      // Create an SVG `path` element for this sub-path
      const pathElement = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      pathElement.setAttribute("d", subPathD);

      // Add an outline for visualization
      const outlineElement = debugDoc.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      outlineElement.setAttribute("d", subPathD);

      // Assign a unique solid color to the outline
      const hue = (index * 360) / subPaths.length; // Unique hue
      const color = `hsl(${hue}, 100%, 40%)`;
      outlineElement.setAttribute("stroke", color);
      outlineElement.setAttribute("stroke-width", "2");
      outlineElement.setAttribute("fill", "none");

      // Append the outline to the debug SVG
      debugSvgElement.appendChild(outlineElement);

      // Add the path element itself (optional visualization of the base)
      pathElement.setAttribute("fill", color);
      pathElement.setAttribute("opacity", "0.3"); // Semi-transparent for debugging
      debugSvgElement.appendChild(pathElement);

      return {
        base: pathElement, // SVG `path` element for the sub-path
        type: subPath.clockwise ? "outer" : "inner", // Classify as outer or inner
      };
    });

    // ✅ Return the updated shape
    return {
      ...shape,
      walls, // Store the split walls
    };
  });

  return {
    svg, // ✅ Keep original SVG unchanged
    svgDebug: debugDom.serialize(), // ✅ Debug version: walls and outlines visualized
    shapes, // ✅ Pass updated shape model
  };
};
