import { JSDOM } from "jsdom";
import paper from "paper";

export default ({ svg, shapes }) => {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  const updatedShapes = shapes.map((shape) => {
    const { floor, wallBounds, z = 20, color = "gray" } = shape;

    if (!floor || !wallBounds || wallBounds.length < 2) return shape;

    let walls = [];

    // ✅ Extract SVG path data from floor shape
    const pathData = floor.shape.getAttribute("d");
    if (!pathData) return shape;

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

      // 🎯 Extract bottom edge from the floor path
      const bottomSegment = extractSegment(floorPath, start, end);
      if (!bottomSegment) continue;

      // 🎯 Create the top edge by offsetting the bottom edge upward by `z`
      const topSegment = bottomSegment.clone();
      topSegment.translate(new paper.Point(0, -z));

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

      // ✅ Create <path> for the wall
      const wallElement = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      wallElement.setAttribute("d", wallD);
      wallElement.setAttribute("fill", color);
      wallElement.setAttribute("opacity", "0.5");
      wallElement.setAttribute("stroke", "black");
      wallElement.setAttribute("stroke-width", "0.5");

      svgElement.appendChild(wallElement);
    }

    return { ...shape, walls };
  });

  return { svg: dom.serialize(), shapes: updatedShapes };
};

/**
 * Extracts the segment of a Paper.js path between two points.
 */
function extractSegment(path, start, end) {
  if (!path || path.segments.length < 2) return null;

  let startPoint = new paper.Point(start.x, start.y);
  let endPoint = new paper.Point(end.x, end.y);

  let startOffset = path.getOffsetOf(startPoint);
  let endOffset = path.getOffsetOf(endPoint);

  if (isNaN(startOffset)) {
    startPoint = path.getNearestPoint(startPoint);
    startOffset = path.getOffsetOf(startPoint);
  }
  if (isNaN(endOffset)) {
    endPoint = path.getNearestPoint(endPoint);
    endOffset = path.getOffsetOf(endPoint);
  }

  if (isNaN(startOffset) || isNaN(endOffset)) return null;
  if (startOffset > endOffset)
    [startOffset, endOffset] = [endOffset, startOffset];

  try {
    let subPath = path.clone().splitAt(startOffset);
    if (subPath) subPath = subPath.splitAt(endOffset - startOffset);
    return subPath?.segments.length >= 2 ? subPath : null;
  } catch {
    return null;
  }
}
