import paper from "paper";
import { extractSegment } from "../utils/extractSegment.js";
import { darkenColor } from "../utils/darkenColor.js";
import {
  parseSvg,
  serializeSvg,
  createSvgElement,
  removeElements,
} from "../utils/environment.js";

export default ({ svg, shapes }) => {
  // ✅ Preserve original viewBox and dimensions
  const { doc: originalDoc, svgElement: originalSvg } = parseSvg(svg);

  const viewBox = originalSvg.getAttribute("viewBox") || "0 0 100 100";
  const width = originalSvg.getAttribute("width") || "100";
  const height = originalSvg.getAttribute("height") || "100";

  // ✅ Create new clean & debug SVGs with preserved viewBox & dimensions
  const { doc: cleanDoc, svgElement: cleanSvgElement } = parseSvg(
    '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
  );
  const { doc: debugDoc, svgElement: debugSvgElement } = parseSvg(
    '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
  );

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
        const wallElement = createSvgElement(cleanDoc, "path", {
          d: wallD,
          fill: wallColor,
          stroke: "black",
          "stroke-width": "0.5",
        });
        cleanSvgElement.appendChild(wallElement);

        // ✅ Create debug wall element
        const debugWallElement = createSvgElement(debugDoc, "path", {
          d: wallD,
          fill: wallColor,
          opacity: "0.5",
          stroke: "black",
          "stroke-width": "0.5",
        });
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

    const floorPathClean = createSvgElement(cleanDoc, "path", {
      d: floor.path.getAttribute("d"),
      fill: floor.fillColor || "gray",
    });
    cleanSvgElement.prepend(floorPathClean);

    const floorPathDebug = createSvgElement(debugDoc, "path", {
      d: floor.path.getAttribute("d"),
      fill: floor.fillColor || "gray",
    });
    debugSvgElement.prepend(floorPathDebug);
  });

  // ✅ Render the **ceiling** in the clean SVG
  shapes.forEach(({ ceiling }) => {
    if (!ceiling?.path) return;

    const ceilingPath = createSvgElement(cleanDoc, "path", {
      d: ceiling.path.getAttribute("d"),
      fill: ceiling.fillColor || "gray",
    });
    cleanSvgElement.appendChild(ceilingPath);
  });

  return {
    svg: serializeSvg(cleanDoc), // ✅ Clean SVG with floor → walls → ceiling
    svgDebug: serializeSvg(debugDoc), // ✅ Debug SVG with floor + walls visualized
    shapes,
  };
};
