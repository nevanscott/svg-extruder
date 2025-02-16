import {
  parseSvg,
  serializeSvg,
  createSvgElement,
} from "../utils/environment.js";

/**
 * Visualizes wall boundaries by adding circles and labels to the SVG.
 */
export function visualizeWallBoundaries(svg, boundaryPoints) {
  const { doc, svgElement } = parseSvg(svg); // Use parseSvg from environment.js

  boundaryPoints.forEach(({ x, y }, index) => {
    // 📦 Create a group <g> to contain both the circle and text
    const group = createSvgElement(doc, "g");

    // 🏷 Add data attributes for debugging
    group.setAttribute("data-index", index + 1);
    group.setAttribute("data-x", x);
    group.setAttribute("data-y", y);

    // 🎯 Create the numbered circle
    const circle = createSvgElement(doc, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "6"); // Bigger size
    circle.setAttribute("fill", "red"); // Main color
    circle.setAttribute("stroke", "white"); // White outline
    circle.setAttribute("stroke-width", "1"); // Thickness of the outline

    // 🏷 Create the number label
    const text = createSvgElement(doc, "text");
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

  return serializeSvg(doc); // Serialize the updated SVG using serializeSvg from environment.js
}
