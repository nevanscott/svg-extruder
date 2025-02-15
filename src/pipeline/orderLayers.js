import { JSDOM } from "jsdom";
import { getPathBoundingBox } from "../utils/getPathBoundingBox.js";

/**
 * Compute depth as a percentage of how far the bottom-most Y is from the bottom of the viewBox.
 */
function computeDepth(bbox, viewBox) {
  const { maxY } = bbox; // Bottom-most Y value of the shape
  const [, , , viewBoxHeight] = viewBox.split(" ").map(Number);
  const bottomOfViewBox = viewBoxHeight; // Y coordinate of the bottom

  return (bottomOfViewBox - maxY) / viewBoxHeight; // Normalize from 0 (back) to 1 (front)
}

export default ({ svg, shapes }) => {
  // ✅ Parse the original SVG
  const originalDom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const originalDoc = originalDom.window.document;
  const originalSvg = originalDoc.querySelector("svg");

  // ✅ Extract viewBox dimensions
  const viewBox = originalSvg.getAttribute("viewBox") || "0 0 100 100";
  const width = originalSvg.getAttribute("width") || "100";
  const height = originalSvg.getAttribute("height") || "100";

  // ✅ Create new clean & debug SVGs
  const cleanDom = new JSDOM(
    `<!DOCTYPE html><svg xmlns="http://www.w3.org/2000/svg"></svg>`
  );
  const cleanDoc = cleanDom.window.document;
  const cleanSvgElement = cleanDoc.querySelector("svg");

  const debugDom = new JSDOM(
    `<!DOCTYPE html><svg xmlns="http://www.w3.org/2000/svg"></svg>`
  );
  const debugDoc = debugDom.window.document;
  const debugSvgElement = debugDoc.querySelector("svg");

  // ✅ Set viewBox & dimensions
  [cleanSvgElement, debugSvgElement].forEach((svgEl) => {
    svgEl.setAttribute("viewBox", viewBox);
    svgEl.setAttribute("width", width);
    svgEl.setAttribute("height", height);
  });

  // ✅ Compute and store depth values
  shapes = shapes.map((shape, index) => {
    let floorBBox = getPathBoundingBox(shape.floor.path.getAttribute("d"));
    let floorDepth = computeDepth(floorBBox, viewBox);

    let walls =
      shape.walls?.map((wall) => {
        let sides = wall.sides?.map((side) => {
          let sideBBox = getPathBoundingBox(side.path.getAttribute("d"));
          return {
            ...side,
            depth: computeDepth(sideBBox, viewBox),
          };
        });

        return {
          ...wall,
          sides,
        };
      }) || [];

    return {
      ...shape,
      depth: floorDepth,
      floor: { ...shape.floor, depth: floorDepth },
      walls,
      ceiling: shape.ceiling ? { ...shape.ceiling, order: index } : null, // ✅ Preserve original order
    };
  });

  // ✅ Sort floors in increasing depth order (front-to-back)
  const sortedFloors = [...shapes].sort(
    (a, b) => a.floor.depth - b.floor.depth
  );

  // ✅ Sort wall sides in **decreasing** depth order (back-to-front)
  const sortedWallSides = [
    ...shapes.flatMap((s) => s.walls.flatMap((w) => w.sides)),
  ].sort((a, b) => b.depth - a.depth);

  // ✅ Preserve original order for ceilings
  const sortedCeilings = [...shapes]
    .filter((s) => s.ceiling)
    .sort((a, b) => a.ceiling.order - b.ceiling.order);

  // ▶️ **Clean SVG:**
  sortedFloors.forEach(({ floor }) => {
    const floorPath = cleanDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    floorPath.setAttribute("d", floor.path.getAttribute("d"));
    floorPath.setAttribute("fill", floor.fillColor || "gray");
    cleanSvgElement.appendChild(floorPath);
  });

  sortedWallSides.forEach((side) => {
    const wallPath = cleanDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    wallPath.setAttribute("d", side.path.getAttribute("d"));
    wallPath.setAttribute("fill", side.fillColor || "gray");
    cleanSvgElement.appendChild(wallPath);
  });

  sortedCeilings.forEach(({ ceiling }) => {
    const ceilingPath = cleanDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    ceilingPath.setAttribute("d", ceiling.path.getAttribute("d"));
    ceilingPath.setAttribute("fill", ceiling.fillColor || "gray");
    cleanSvgElement.appendChild(ceilingPath);
  });

  // ▶️ **Debug SVG (Semi-Transparent with Bounding Boxes & Depth Numbers)**
  function drawBBoxWithDepth(bbox, depth, color, doc) {
    const rect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", bbox.minX);
    rect.setAttribute("y", bbox.minY);
    rect.setAttribute("width", bbox.maxX - bbox.minX);
    rect.setAttribute("height", bbox.maxY - bbox.minY);
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", color);
    rect.setAttribute("stroke-width", "0.5");

    // ✅ Add depth label
    const text = doc.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", bbox.minX + (bbox.maxX - bbox.minX) / 2);
    text.setAttribute("y", bbox.maxY + 5); // Positioned slightly below the bounding box
    text.setAttribute("fill", color);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "6");
    text.setAttribute("font-family", "Arial");
    text.textContent = depth.toFixed(2);

    return [rect, text];
  }

  sortedFloors.forEach(({ floor }) => {
    const debugFloor = debugDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    debugFloor.setAttribute("d", floor.path.getAttribute("d"));
    debugFloor.setAttribute("fill", floor.fillColor || "gray");
    debugFloor.setAttribute("opacity", "0.5");
    debugSvgElement.appendChild(debugFloor);

    const bboxElements = drawBBoxWithDepth(
      getPathBoundingBox(floor.path.getAttribute("d")),
      floor.depth,
      "red",
      debugDoc
    );
    bboxElements.forEach((el) => debugSvgElement.appendChild(el));
  });

  sortedWallSides.forEach((side) => {
    const debugWall = debugDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    debugWall.setAttribute("d", side.path.getAttribute("d"));
    debugWall.setAttribute("fill", side.fillColor || "gray");
    debugWall.setAttribute("opacity", "0.5");
    debugWall.setAttribute("stroke", "black");
    debugWall.setAttribute("stroke-width", "0.5");
    debugSvgElement.appendChild(debugWall);

    const bboxElements = drawBBoxWithDepth(
      getPathBoundingBox(side.path.getAttribute("d")),
      side.depth,
      "blue",
      debugDoc
    );
    bboxElements.forEach((el) => debugSvgElement.appendChild(el));
  });

  sortedCeilings.forEach(({ ceiling }) => {
    const debugCeiling = debugDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    debugCeiling.setAttribute("d", ceiling.path.getAttribute("d"));
    debugCeiling.setAttribute("fill", ceiling.fillColor || "gray");
    debugCeiling.setAttribute("opacity", "0.5");
    debugSvgElement.appendChild(debugCeiling);
  });

  return {
    svg: cleanDom.serialize(), // ✅ Clean SVG with proper layering
    svgDebug: debugDom.serialize(), // ✅ Debug SVG with bounding boxes & depth labels
    shapes,
  };
};
