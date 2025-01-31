import { JSDOM } from "jsdom";

// Utility: Visualize wall boundaries
export function visualizeWallBoundaries(svg, boundaryPoints) {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  boundaryPoints.forEach(({ x, y }) => {
    const circle = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "1.5"); // Circle size
    circle.setAttribute("fill", "red"); // Main color
    circle.setAttribute("stroke", "white"); // White outline
    circle.setAttribute("stroke-width", "0.5"); // Thickness of the outline
    svgElement.appendChild(circle);
  });

  return dom.serialize();
}
