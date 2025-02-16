import { getPathBoundingBox } from "../utils/getPathBoundingBox.js";
import {
  parseSvg,
  serializeSvg,
  createSvgElement,
} from "../utils/environment.js";

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
  const { doc: originalDoc, svgElement: originalSvg } = parseSvg(svg);

  // ✅ Extract viewBox dimensions
  const viewBox = originalSvg.getAttribute("viewBox") || "0 0 100 100";
  const width = originalSvg.getAttribute("width") || "100";
  const height = originalSvg.getAttribute("height") || "100";

  // ✅ Create new clean & debug SVGs
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

  // ✅ Compute and store depth and elevation values
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

  // ✅ Group shapes by elevation
  const groupedByElevation = shapes.reduce((groups, shape) => {
    const elevation = shape.elevation;
    if (!groups[elevation]) groups[elevation] = [];
    groups[elevation].push(shape);
    return groups;
  }, {});

  // ✅ Sort elevations ascending
  const sortedElevations = Object.keys(groupedByElevation)
    .map(Number)
    .sort((a, b) => a - b);

  // ▶️ **Clean SVG:**
  sortedElevations.forEach((elevation) => {
    const shapesAtElevation = groupedByElevation[elevation];

    // Render floors first (original stacking order)
    shapesAtElevation.forEach(({ floor }) => {
      const floorPath = createSvgElement(cleanDoc, "path", {
        d: floor.path.getAttribute("d"),
        fill: floor.fillColor || "gray",
      });
      cleanSvgElement.appendChild(floorPath);
    });

    // Render walls next (sorted by depth within the elevation, back-to-front)
    shapesAtElevation
      .flatMap((shape) => shape.walls.flatMap((wall) => wall.sides))
      .sort((a, b) => b.depth - a.depth)
      .forEach((side) => {
        const wallPath = createSvgElement(cleanDoc, "path", {
          d: side.path.getAttribute("d"),
          fill: side.fillColor || "gray",
        });
        cleanSvgElement.appendChild(wallPath);
      });

    // Render ceilings last (original stacking order)
    shapesAtElevation.forEach(({ ceiling }) => {
      if (ceiling) {
        const ceilingPath = createSvgElement(cleanDoc, "path", {
          d: ceiling.path.getAttribute("d"),
          fill: ceiling.fillColor || "gray",
        });
        cleanSvgElement.appendChild(ceilingPath);
      }
    });
  });

  // ▶️ **Debug SVG (Semi-Transparent with Bounding Boxes & Depth Numbers)**
  function drawBBoxWithDepth(bbox, depth, color, doc) {
    const rect = createSvgElement(doc, "rect", {
      x: bbox.minX,
      y: bbox.minY,
      width: bbox.maxX - bbox.minX,
      height: bbox.maxY - bbox.minY,
      fill: "none",
      stroke: color,
      "stroke-width": "0.5",
    });

    // ✅ Add depth label
    const text = createSvgElement(doc, "text", {
      x: bbox.minX + (bbox.maxX - bbox.minX) / 2,
      y: bbox.maxY + 5, // Positioned slightly below the bounding box
      fill: color,
      "text-anchor": "middle",
      "font-size": "6",
      "font-family": "Arial",
    });
    text.textContent = depth.toFixed(2);

    return [rect, text];
  }

  sortedElevations.forEach((elevation) => {
    const shapesAtElevation = groupedByElevation[elevation];

    // Debug floors
    shapesAtElevation.forEach(({ floor }) => {
      const debugFloor = createSvgElement(debugDoc, "path", {
        d: floor.path.getAttribute("d"),
        fill: floor.fillColor || "gray",
        opacity: "0.5",
      });
      debugSvgElement.appendChild(debugFloor);

      const floorBBoxElements = drawBBoxWithDepth(
        getPathBoundingBox(floor.path.getAttribute("d")),
        floor.depth,
        "red",
        debugDoc
      );
      floorBBoxElements.forEach((el) => debugSvgElement.appendChild(el));
    });

    // Debug walls
    shapesAtElevation
      .flatMap((shape) => shape.walls.flatMap((wall) => wall.sides))
      .sort((a, b) => b.depth - a.depth)
      .forEach((side) => {
        const debugWall = createSvgElement(debugDoc, "path", {
          d: side.path.getAttribute("d"),
          fill: side.fillColor || "gray",
          opacity: "0.5",
          stroke: "black",
          "stroke-width": "0.5",
        });
        debugSvgElement.appendChild(debugWall);

        const wallBBoxElements = drawBBoxWithDepth(
          getPathBoundingBox(side.path.getAttribute("d")),
          side.depth,
          "blue",
          debugDoc
        );
        wallBBoxElements.forEach((el) => debugSvgElement.appendChild(el));
      });

    // Debug ceilings
    shapesAtElevation.forEach(({ ceiling }) => {
      if (ceiling) {
        const debugCeiling = createSvgElement(debugDoc, "path", {
          d: ceiling.path.getAttribute("d"),
          fill: ceiling.fillColor || "gray",
          opacity: "0.5",
        });
        debugSvgElement.appendChild(debugCeiling);
      }
    });
  });

  return {
    svg: serializeSvg(cleanDoc), // ✅ Clean SVG with proper layering
    svgDebug: serializeSvg(debugDoc), // ✅ Debug SVG with bounding boxes & depth labels
    shapes,
  };
};
