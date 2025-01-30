import { JSDOM } from "jsdom";
import translateIsometricPath from "./translateIsometricPath.js";
import { getPathBoundingBox } from "../utils/getPathBoundingBox.js";

/**
 * Recenter an SVG based on its bounding box.
 * If `paths` are provided, it will adjust them as well.
 */
export default function recenterSvg(svg, paths = [], padding = 20) {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  if (!svgElement) {
    console.warn("recenterSvg: No valid SVG element found.");
    return { svg, paths };
  }

  // Gather all paths in the SVG if none are explicitly provided
  if (!paths.length) {
    paths = [...svgElement.querySelectorAll("path")];
  }

  if (!paths.length) {
    console.warn("recenterSvg: No paths found to recenter.");
    return { svg, paths };
  }

  // Compute bounding box from paths
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  paths.forEach((path) => {
    const d = path.getAttribute("d");
    if (!d) return;
    const bbox = getPathBoundingBox(d);

    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
  });

  if (
    minX === Infinity ||
    minY === Infinity ||
    maxX === -Infinity ||
    maxY === -Infinity
  ) {
    console.warn("recenterSvg: Could not compute bounding box.");
    return { svg, paths };
  }

  // Compute new dimensions and offsets
  const width = maxX - minX + 2 * padding;
  const height = maxY - minY + 2 * padding;
  const offsetX = minX - padding;
  const offsetY = minY - padding;

  // Adjust all paths
  paths = paths.map((path) => translateIsometricPath(path, -offsetX, -offsetY));

  // Update the SVG's viewBox and dimensions
  svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svgElement.setAttribute("width", width);
  svgElement.setAttribute("height", height);

  // Remove existing paths and append updated ones
  svgElement.querySelectorAll("path").forEach((path) => path.remove());
  paths.forEach((path) => svgElement.appendChild(path.cloneNode(true)));

  return { svg: dom.serialize(), paths };
}
