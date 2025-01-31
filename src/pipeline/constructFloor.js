import { JSDOM } from "jsdom";

export default ({ svg, shapes }) => {
  shapes = shapes.map((shape) => ({
    floor: { shape, z: 0 },
  }));

  // Render floor shapes
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  svgElement.querySelectorAll("path").forEach((path) => path.remove());
  shapes.forEach(({ floor }) =>
    svgElement.appendChild(floor.shape.cloneNode(true))
  );

  return { svg: dom.serialize(), shapes };
};
