import {
  parseSvg,
  serializeSvg,
  createSvgElement,
} from "../utils/environment.js";
import translateIsometricPath from "../transforms/translateIsometricPath.js";

export default ({ svg, shapes }) => {
  const { doc, svgElement } = parseSvg(svg);

  shapes = shapes.map((shape) => {
    const { floor, elevation = 0, height = 20 } = shape;

    return {
      ...shape,
      ceiling: {
        path: translateIsometricPath(floor.path, 0, 0, height),
        fillColor: floor.fillColor,
        elevation: elevation + height,
      },
    };
  });

  shapes.forEach(({ ceiling }) => {
    if (!ceiling.path) return;

    const ceilingPath = createSvgElement(doc, "path", {
      d: ceiling.path.getAttribute("d"),
      fill: ceiling.fillColor || "gray",
    });

    svgElement.appendChild(ceilingPath);
  });

  const updatedSvg = serializeSvg(doc); // Use serializeSvg with `doc`
  return { svg: updatedSvg, svgDebug: updatedSvg, shapes };
};
