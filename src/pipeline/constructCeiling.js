import { JSDOM } from "jsdom";
import translateIsometricPath from "../transforms/translateIsometricPath.js";

export default ({ svg, shapes }) => {
  shapes = shapes.map(({ floor }) => ({
    floor,
    ceiling: {
      shape: translateIsometricPath(floor.shape, 0, 0, 20),
      z: 20,
    },
  }));

  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  shapes.forEach(({ ceiling }) =>
    svgElement.appendChild(ceiling.shape.cloneNode(true))
  );

  return { svg: dom.serialize(), shapes };
};
