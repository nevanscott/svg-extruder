import { JSDOM } from "jsdom";
import paper from "paper";
import { extractSegment } from "../utils/extractSegment.js";
import { darkenColor } from "../utils/darkenColor.js";

export default ({ svg, shapes }) => {
  // ✅ Preserve original viewBox and dimensions
  const originalDom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const originalDoc = originalDom.window.document;
  const originalSvg = originalDoc.querySelector("svg");

  const viewBox = originalSvg.getAttribute("viewBox") || "0 0 100 100";
  const width = originalSvg.getAttribute("width") || "100";
  const height = originalSvg.getAttribute("height") || "100";

  // ✅ Create new clean & debug SVGs with preserved viewBox & dimensions
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

  shapes = shapes.map((shape) => {
    const { floor, walls, height = 20 } = shape;

    if (!floor || !walls || walls.length < 1) return shape;

    // ✅ Extract fill color from the floor shape
    const floorColor = floor.fillColor || "gray";
    const wallColor = darkenColor(floorColor, 0.85, 0.9);

    const updatedWalls = walls.map((wall) => {
      const { base, bounds } = wall;

      if (!base || !bounds || bounds.length < 2) return wall;

      let sides = [];

      // ✅ Convert the `base` path data into a Paper.js Path
      const pathData = base.getAttribute("d");
      if (!pathData) return wall;

      paper.setup(new paper.Size(100, 100));
      const floorPath = new paper.Path(pathData);
      if (floorPath.segments.length < 2) return wall;

      // 🔄 Check if the floor shape is closed
      const isClosed = floorPath.closed;

      // ✅ If the floor shape is closed, explicitly add the last segment back to the start
      const closedBounds = isClosed ? [...bounds, bounds[0]] : bounds;

      closedBounds.forEach((point, i) => {
        if (i >= closedBounds.length - 1) return;

        const start = closedBounds[i];
        const end = closedBounds[i + 1];

        // 🎯 Determine whether to reverse the longer segment for the final wall
        const isFinalWall = isClosed && closedBounds.length === 3 && i === 1;
        const reverseLonger = isFinalWall ? true : false;

        // 🎯 Extract bottom edge from the floor path
        const bottomSegment = extractSegment(
          floorPath,
          start,
          end,
          reverseLonger
        );
        if (!bottomSegment) return;

        // 🎯 Create the top edge by offsetting the bottom edge upward by `height`
        const topSegment = bottomSegment.clone();
        topSegment.translate(new paper.Point(0, -height)); // Use shape's height

        // 🎯 Reverse the top segment properly
        const reversedTopSegment = topSegment.clone();
        reversedTopSegment.reverse();

        // ✅ Construct full wall shape
        const wallD = `
          M${bottomSegment.firstSegment.point.x},${bottomSegment.firstSegment.point.y}
          ${bottomSegment.pathData}
          L${reversedTopSegment.firstSegment.point.x},${reversedTopSegment.firstSegment.point.y}
          ${reversedTopSegment.pathData}
          L${bottomSegment.firstSegment.point.x},${bottomSegment.firstSegment.point.y}
        `
          .replace(/\s+/g, " ")
          .trim();

        // ✅ Create clean wall element
        const wallElement = cleanDoc.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        wallElement.setAttribute("d", wallD);
        wallElement.setAttribute("fill", wallColor);
        wallElement.setAttribute("stroke", "black");
        wallElement.setAttribute("stroke-width", "0.5");
        cleanSvgElement.appendChild(wallElement);

        // ✅ Create debug wall element
        const debugWallElement = debugDoc.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        debugWallElement.setAttribute("d", wallD);
        debugWallElement.setAttribute("fill", wallColor);
        debugWallElement.setAttribute("opacity", "0.5");
        debugWallElement.setAttribute("stroke", "black");
        debugWallElement.setAttribute("stroke-width", "0.5");
        debugSvgElement.appendChild(debugWallElement);

        // ✅ Store the wall in the model
        sides.push({
          path: wallElement,
          fillColor: wallColor,
          height, // Store the wall height
        });
      });

      return {
        ...wall,
        sides, // Update the wall with its sides
      };
    });

    return {
      ...shape,
      walls: updatedWalls, // Update the shape's walls
    };
  });

  // ✅ Render the **floor** in both SVGs
  shapes.forEach(({ floor }) => {
    if (!floor?.path) return;

    const floorPathClean = cleanDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    floorPathClean.setAttribute("d", floor.path.getAttribute("d"));
    floorPathClean.setAttribute("fill", floor.fillColor || "gray");
    cleanSvgElement.prepend(floorPathClean);

    const floorPathDebug = debugDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    floorPathDebug.setAttribute("d", floor.path.getAttribute("d"));
    floorPathDebug.setAttribute("fill", floor.fillColor || "gray");
    debugSvgElement.prepend(floorPathDebug);
  });

  // ✅ Render the **ceiling** in the clean SVG
  shapes.forEach(({ ceiling }) => {
    if (!ceiling?.path) return;

    const ceilingPath = cleanDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    ceilingPath.setAttribute("d", ceiling.path.getAttribute("d"));
    ceilingPath.setAttribute("fill", ceiling.fillColor || "gray");
    cleanSvgElement.appendChild(ceilingPath);
  });

  return {
    svg: cleanDom.serialize(), // ✅ Clean SVG with floor → walls → ceiling
    svgDebug: debugDom.serialize(), // ✅ Debug SVG with floor + walls visualized
    shapes,
  };
};
