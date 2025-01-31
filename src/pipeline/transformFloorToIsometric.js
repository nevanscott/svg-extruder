import transformPathToIsometric from "../transforms/transformPathToIsometric.js";
import { JSDOM } from "jsdom";

export default ({ svg, shapes }) => {
  shapes = shapes.map(({ floor }) => ({
    floor: {
      shape: transformPathToIsometric(floor.shape, floor.z),
      z: floor.z,
    },
  }));

  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  svgElement.querySelectorAll("path").forEach((path) => path.remove());
  shapes.forEach(({ floor }) =>
    svgElement.appendChild(floor.shape.cloneNode(true))
  );

  return { svg: dom.serialize(), shapes };
};
