import { JSDOM } from "jsdom";

// Utility: Visualize wall boundaries
export function visualizeWallBoundaries(svg, boundaryPoints) {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  boundaryPoints.forEach(({ x, y }, index) => {
    // 🎯 Create the numbered circle
    const circle = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "6"); // Bigger size
    circle.setAttribute("fill", "red"); // Main color
    circle.setAttribute("stroke", "white"); // White outline
    circle.setAttribute("stroke-width", "1"); // Thickness of the outline
    svgElement.appendChild(circle);

    // 🏷 Create the number label
    const text = doc.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("font-size", "6");
    text.setAttribute("fill", "white");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = index + 1; // Start counting from 1
    svgElement.appendChild(text);
  });

  return dom.serialize();
}
