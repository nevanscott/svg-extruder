import { JSDOM } from "jsdom";
import translateIsometricPath from "../transforms/translateIsometricPath.js";

export default ({ svg, shapes }) => {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  shapes = shapes.map((shape) => {
    const { floor, elevation = 0, height = 20 } = shape;

    return {
      ...shape,
      ceiling: {
        path: translateIsometricPath(floor.path, 0, 0, height), // ✅ Offset by height
        fillColor: floor.fillColor, // ✅ Preserve floor color
        elevation: elevation + height, // ✅ Ceiling elevation = shape.elevation + shape.height
      },
    };
  });

  // ✅ Append ceilings to the SVG
  shapes.forEach(({ ceiling }) => {
    if (!ceiling.path) return;

    const ceilingPath = doc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    ceilingPath.setAttribute("d", ceiling.path.getAttribute("d"));
    ceilingPath.setAttribute("fill", ceiling.fillColor || "gray"); // ✅ Keep same color as floor

    svgElement.appendChild(ceilingPath);
  });

  const updatedSvg = dom.serialize();
  return { svg: updatedSvg, svgDebug: updatedSvg, shapes };
};
