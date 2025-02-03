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
    };
  });

  // ✅ Generate debug SVG with boundary visualization
  const debugDom = new JSDOM(svg, { contentType: "image/svg+xml" });
  let debugSvg = debugDom.serialize();

  shapes.forEach(({ wallBounds }, index) => {
    debugSvg = visualizeWallBoundaries(debugSvg, wallBounds, index);
  });

  return {
    svg, // ✅ Keep original SVG unchanged
    svgDebug: debugSvg, // ✅ Visualize boundaries in debug version
    shapes, // ✅ Pass updated shape model
  };
};
