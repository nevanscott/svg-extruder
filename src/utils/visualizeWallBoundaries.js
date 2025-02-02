import { JSDOM } from "jsdom";

// Utility: Visualize wall boundaries
export function visualizeWallBoundaries(svg, boundaryPoints) {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  boundaryPoints.forEach(({ x, y }, index) => {
    // 📦 Create a group <g> to contain both the circle and text
    const group = doc.createElementNS("http://www.w3.org/2000/svg", "g");

    // 🏷 Add data attributes for debugging
    group.setAttribute("data-index", index + 1);
    group.setAttribute("data-x", x);
    group.setAttribute("data-y", y);

    // 🎯 Create the numbered circle
    const circle = doc.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "6"); // Bigger size
    circle.setAttribute("fill", "red"); // Main color
    circle.setAttribute("stroke", "white"); // White outline
    circle.setAttribute("stroke-width", "1"); // Thickness of the outline

    // 🏷 Create the number label
    const text = doc.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("font-size", "6");
    text.setAttribute("fill", "white");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = index + 1; // Start counting from 1

    // 📌 Append circle and text to the group
    group.appendChild(circle);
    group.appendChild(text);

    // 📌 Append the group to the SVG
    svgElement.appendChild(group);
  });

  return dom.serialize();
}
