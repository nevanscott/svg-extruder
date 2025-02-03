import { JSDOM } from "jsdom";
import paper from "paper";
import { extractSegment } from "../utils/extractSegment.js";
import { darkenColor } from "../utils/darkenColor.js";

export default ({ svg, shapes }) => {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  const debugDom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const debugDoc = debugDom.window.document;
  const debugSvgElement = debugDoc.querySelector("svg");

  shapes = shapes.map((shape) => {
    const { floor, wallBounds, elevation = 0, height = 20 } = shape;

    if (!floor || !wallBounds || wallBounds.length < 2) return shape;

    let walls = [];

    // ✅ Extract SVG path data from floor shape
    const pathData = floor.path.getAttribute("d");
    if (!pathData) return shape;

    // ✅ Extract fill color from the floor shape
    const floorColor = floor.fillColor || "gray";
    const wallColor = darkenColor(floorColor);

    // ✅ Convert SVG pathData into a Paper.js Path
    paper.setup(new paper.Size(100, 100));
    const floorPath = new paper.Path(pathData);
    if (floorPath.segments.length < 2) return shape;

    // 🔄 Check if the floor shape is closed
    const isClosed = floorPath.closed;
    const bounds = [...wallBounds];

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
      const wallElement = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      wallElement.setAttribute("d", wallD);
      wallElement.setAttribute("fill", wallColor);
      wallElement.setAttribute("stroke", "black");
      wallElement.setAttribute("stroke-width", "0.5");

      svgElement.appendChild(wallElement);

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
      walls.push({
        path: wallElement,
        fillColor: wallColor,
        height: height, // ✅ Walls store height for future use
      });
    }

    return { ...shape, walls };
  });

  return {
    svg: dom.serialize(), // ✅ Final version with full-opacity walls
    svgDebug: debugDom.serialize(), // ✅ Debug version with semi-transparent walls
    shapes,
  };
};
