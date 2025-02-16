import paper from "paper";
import {
  parseSvg,
  serializeSvg,
  createSvgElement,
} from "../utils/environment.js";

export default ({ svg, shapes }) => {
  // ✅ Generate a new debug SVG
  const { doc: debugDoc, svgElement: debugSvgElement } = parseSvg(svg);

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

    // ✅ Process each sub-path into a wall
    const walls = subPaths.map((subPath, index) => {
      // Get the path data for the sub-path
      const subPathD = subPath.exportSVG().getAttribute("d");

      // Create an SVG `path` element for this sub-path
      const pathElement = createSvgElement(debugDoc, "path", {
        d: subPathD,
        fill: `hsl(${(index * 360) / subPaths.length}, 100%, 40%)`, // Fill color based on hue
        opacity: "0.3", // Semi-transparent for debugging
      });

      // Add an outline for visualization
      const outlineElement = createSvgElement(debugDoc, "path", {
        d: subPathD,
        stroke: `hsl(${(index * 360) / subPaths.length}, 100%, 40%)`,
        "stroke-width": "2",
        fill: "none",
      });

      // Append the outline and path element to the debug SVG
      debugSvgElement.appendChild(outlineElement);
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
    svgDebug: serializeSvg(debugDoc), // ✅ Debug version: walls and outlines visualized
    shapes, // ✅ Pass updated shape model
  };
};
