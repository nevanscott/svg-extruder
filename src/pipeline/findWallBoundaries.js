import { identifyWallBoundaries } from "../utils/identifyWallBoundaries.js";
import { visualizeWallBoundaries } from "../utils/visualizeWallBoundaries.js";
import { JSDOM } from "jsdom";

export default ({ svg, shapes }) => {
  // ✅ Extract wall boundaries for each floor shape
  shapes = shapes.map((shape) => {
    const pathD = shape.floor.path.getAttribute("d");
    const wallBounds = identifyWallBoundaries(pathD); // ✅ Get ordered boundary points

    return {
      ...shape,
      wallBounds, // ✅ Store boundary points
      walls: [
        {
          base: shape.floor.path,
          bounds: wallBounds,
        },
      ],
    };
  });

  // ✅ Generate debug SVG that includes only the floor and wall boundaries
  const debugDom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const debugDoc = debugDom.window.document;
  const debugSvgElement = debugDoc.querySelector("svg");

  // ✅ Remove all non-floor paths
  debugSvgElement.querySelectorAll("path").forEach((path) => path.remove());

  // ✅ Add only floor paths
  shapes.forEach(({ floor }) => {
    if (!floor?.path) return;
    debugSvgElement.appendChild(floor.path.cloneNode(true));
  });

  // ✅ Visualize wall boundaries in debug mode
  let debugSvg = debugDom.serialize();
  shapes.forEach(({ wallBounds }, index) => {
    debugSvg = visualizeWallBoundaries(debugSvg, wallBounds, index);
  });

  return {
    svg, // ✅ Keep original SVG unchanged
    svgDebug: debugSvg, // ✅ Debug version: floors + wall boundaries only
    shapes, // ✅ Pass updated shape model
  };
};
