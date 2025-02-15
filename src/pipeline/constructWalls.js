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

    // ✅ Extract SVG path data from floor shape
    const pathData = floor.path.getAttribute("d");
    if (!pathData) return shape;

    // ✅ Extract fill color from the floor shape
    const floorColor = floor.fillColor || "gray";
    const wallColor = darkenColor(floorColor);

    walls.map((wall) => {
      const { base, bounds } = wall;

      let sides = [];

      if (!base || !bounds || bounds.length < 2) return shape;

      const floor = base.cloneNode(true);

      // ✅ Convert SVG pathData into a Paper.js Path
      paper.setup(new paper.Size(100, 100));
      const floorPath = new paper.Path(pathData);
      if (floorPath.segments.length < 2) return shape;

      // 🔄 Check if the floor shape is closed
      const isClosed = floorPath.closed;

      // ✅ If the floor shape is closed, explicitly add the last segment back to the start
      if (isClosed) {
        bounds.push(bounds[0]); // Close the loop
      }

      for (let i = 0; i < bounds.length - 1; i++) {
        const start = bounds[i];
        const end = bounds[i + 1];

        // 🎯 Determine whether to reverse the longer segment for the final wall
        const isFinalWall = isClosed && bounds.length === 3 && i === 1;
        const reverseLonger = isFinalWall ? true : false;

        // 🎯 Extract bottom edge from the floor path
        const bottomSegment = extractSegment(
          floorPath,
          start,
          end,
          reverseLonger
        );
        if (!bottomSegment) continue;

        // 🎯 Create the top edge by offsetting the bottom edge upward by `height`
        const topSegment = bottomSegment.clone();
        topSegment.translate(new paper.Point(0, -height)); // ✅ Uses shape's height

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

        // ✅ Create clean wall element (fully opaque)
        const wallElement = cleanDoc.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        wallElement.setAttribute("d", wallD);
        wallElement.setAttribute("fill", wallColor);
        wallElement.setAttribute("stroke", "black");
        wallElement.setAttribute("stroke-width", "0.5");

        // ✅ Append to the clean SVG (walls go on top of the floor)
        cleanSvgElement.appendChild(wallElement);

        // ✅ Create debug wall element (semi-transparent)
        const debugWallElement = debugDoc.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        debugWallElement.setAttribute("d", wallD);
        debugWallElement.setAttribute("fill", wallColor);
        debugWallElement.setAttribute("opacity", "0.5"); // ✅ Semi-transparent for debugging
        debugWallElement.setAttribute("stroke", "black");
        debugWallElement.setAttribute("stroke-width", "0.5");

        debugSvgElement.appendChild(debugWallElement);

        // ✅ Store the wall in the model (includes height)
        sides.push({
          path: wallElement,
          fillColor: wallColor,
          height: height, // ✅ Walls store height for future use
        });
      }
    });

    return { ...shape, walls };
  });

  // ✅ First, render the **floor** in both SVGs
  shapes.forEach(({ floor }) => {
    if (!floor.path) return;

    const floorPathClean = cleanDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    floorPathClean.setAttribute("d", floor.path.getAttribute("d"));
    floorPathClean.setAttribute("fill", floor.fillColor || "gray");
    cleanSvgElement.prepend(floorPathClean); // ✅ Floor is drawn first

    const floorPathDebug = debugDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    floorPathDebug.setAttribute("d", floor.path.getAttribute("d"));
    floorPathDebug.setAttribute("fill", floor.fillColor || "gray");
    debugSvgElement.prepend(floorPathDebug); // ✅ Floor is drawn first
  });

  // ✅ Walls are already added **after** the floor (above)

  // ✅ Finally, render the **ceiling** in the clean SVG (ceiling goes on top)
  shapes.forEach(({ ceiling }) => {
    if (!ceiling || !ceiling.path) return;

    const ceilingPath = cleanDoc.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    ceilingPath.setAttribute("d", ceiling.path.getAttribute("d"));
    ceilingPath.setAttribute("fill", ceiling.fillColor || "gray");

    cleanSvgElement.appendChild(ceilingPath); // ✅ Ceiling is drawn last
  });

  return {
    svg: cleanDom.serialize(), // ✅ Clean SVG with floor → walls → ceiling
    svgDebug: debugDom.serialize(), // ✅ Debug SVG with floor + semi-transparent walls
    shapes,
  };
};
