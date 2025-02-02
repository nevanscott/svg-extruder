import { JSDOM } from "jsdom";
import paper from "paper";

export default ({ svg, shapes }) => {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  const updatedShapes = shapes.map((shape) => {
    const {
      floor,
      wallBounds,
      z = 20,
      isClosed = false,
      color = "gray",
    } = shape;

    if (!floor || !wallBounds || wallBounds.length < 2) return shape;

    let walls = [];

    // 🔄 If shape is closed, connect last to first
    const bounds = isClosed ? [...wallBounds, wallBounds[0]] : wallBounds;

    // ✅ Extract SVG path data from floor shape
    const pathData = floor.shape.getAttribute("d");
    if (!pathData) {
      console.error("❌ ERROR: Floor shape has no valid 'd' attribute.");
      return shape;
    }

    // ✅ Convert SVG pathData into a Paper.js Path
    paper.setup(new paper.Size(100, 100));
    const floorPath = new paper.Path(pathData);

    console.log(`🟢 Floor path loaded: ${floorPath.segments.length} segments`);
    if (floorPath.segments.length < 2) {
      console.error("❌ ERROR: Floor path does not have enough segments.");
      return shape;
    }

    for (let i = 0; i < bounds.length - 1; i++) {
      const start = bounds[i];
      const end = bounds[i + 1];

      console.log(
        `🔍 Extracting bottom edge: (${start.x}, ${start.y}) → (${end.x}, ${end.y})`
      );

      // 🎯 Extract the corresponding segment from the floor path
      const bottomSegment = extractSegment(floorPath, start, end);
      if (!bottomSegment) {
        console.warn(
          `⚠️ Skipping wall: No valid segment found for (${start.x}, ${start.y}) → (${end.x}, ${end.y})`
        );
        continue;
      }

      console.log(
        `🔵 Bottom edge found: Start (${bottomSegment.firstSegment.point.x}, ${bottomSegment.firstSegment.point.y}) → End (${bottomSegment.lastSegment.point.x}, ${bottomSegment.lastSegment.point.y})`
      );

      // ✅ Create a blue <path> for the bottom edge
      const bottomEdgePath = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      bottomEdgePath.setAttribute(
        "d",
        `M${bottomSegment.firstSegment.point.x},${bottomSegment.firstSegment.point.y} ${bottomSegment.pathData}`
      );
      bottomEdgePath.setAttribute("stroke", "blue");
      bottomEdgePath.setAttribute("stroke-width", "1.5");
      bottomEdgePath.setAttribute("fill", "none");

      // ✅ Create a blue circle at the start of the bottom edge
      const startCircle = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      startCircle.setAttribute("cx", bottomSegment.firstSegment.point.x);
      startCircle.setAttribute("cy", bottomSegment.firstSegment.point.y);
      startCircle.setAttribute("r", "3");
      startCircle.setAttribute("fill", "blue");

      svgElement.appendChild(bottomEdgePath);
      svgElement.appendChild(startCircle);

      // 🎯 Create the top edge by offsetting the bottom edge upward by `z`
      const topSegment = bottomSegment.clone();
      topSegment.translate(new paper.Point(0, -z)); // Move upward

      console.log(
        `🔴 Top edge found: Start (${topSegment.firstSegment.point.x}, ${topSegment.firstSegment.point.y}) → End (${topSegment.lastSegment.point.x}, ${topSegment.lastSegment.point.y})`
      );

      // ✅ Create a red <path> for the top edge (reversed)
      const topEdgePath = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      topEdgePath.setAttribute(
        "d",
        `M${topSegment.lastSegment.point.x},${topSegment.lastSegment.point.y} ${topSegment.pathData}`
      ); // Reversed path
      topEdgePath.setAttribute("stroke", "red");
      topEdgePath.setAttribute("stroke-width", "1.5");
      topEdgePath.setAttribute("fill", "none");

      // ✅ Create a red circle at the start of the top edge
      const topStartCircle = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      topStartCircle.setAttribute("cx", topSegment.lastSegment.point.x);
      topStartCircle.setAttribute("cy", topSegment.lastSegment.point.y);
      topStartCircle.setAttribute("r", "3");
      topStartCircle.setAttribute("fill", "red");

      svgElement.appendChild(topEdgePath);
      svgElement.appendChild(topStartCircle);

      // 🎯 Reverse the top segment properly
      const reversedTopSegment = topSegment.clone();
      reversedTopSegment.reverse(); // Ensure the path is actually reversed

      console.log(
        `🔴 Corrected Top edge: Start (${reversedTopSegment.firstSegment.point.x}, ${reversedTopSegment.firstSegment.point.y}) → End (${reversedTopSegment.lastSegment.point.x}, ${reversedTopSegment.lastSegment.point.y})`
      );

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
      wallElement.setAttribute("fill", color); // Uses shape's color
      wallElement.setAttribute("opacity", "0.5"); // Semi-transparent
      wallElement.setAttribute("stroke", "black"); // Thin black border
      wallElement.setAttribute("stroke-width", "0.5"); // Thin stroke

      svgElement.appendChild(wallElement);
    }

    return { ...shape, walls };
  });

  const updatedSvg = dom.serialize();
  console.log("✅ Final Updated SVG:", updatedSvg);
  return { svg: updatedSvg, shapes: updatedShapes };
};

/**
 * Extracts the segment of a Paper.js path between two points.
 */
function extractSegment(path, start, end) {
  if (!path || path.segments.length < 2) {
    console.error("❌ ERROR: Path is invalid or has too few segments.");
    return null;
  }

  let startPoint = new paper.Point(start.x, start.y);
  let endPoint = new paper.Point(end.x, end.y);

  let startOffset = path.getOffsetOf(startPoint);
  let endOffset = path.getOffsetOf(endPoint);

  console.log(
    `🔹 Extracting path segment: startOffset=${startOffset}, endOffset=${endOffset}`
  );

  if (isNaN(startOffset)) {
    console.warn(`⚠️ Start point not found exactly: (${start.x}, ${start.y})`);
    startPoint = path.getNearestPoint(startPoint);
    startOffset = path.getOffsetOf(startPoint);
  }
  if (isNaN(endOffset)) {
    console.warn(`⚠️ End point not found exactly: (${end.x}, ${end.y})`);
    endPoint = path.getNearestPoint(endPoint);
    endOffset = path.getOffsetOf(endPoint);
  }

  if (isNaN(startOffset) || isNaN(endOffset)) {
    console.error("❌ ERROR: Could not locate start or end in path!");
    return null;
  }

  if (startOffset > endOffset) {
    console.warn(
      "⚠️ Start offset is greater than end offset. Swapping values."
    );
    [startOffset, endOffset] = [endOffset, startOffset];
  }

  try {
    let subPath = path.clone().splitAt(startOffset);
    if (subPath) {
      subPath = subPath.splitAt(endOffset - startOffset);
    }
    if (!subPath || subPath.segments.length < 2) {
      console.error("❌ ERROR: Extracted subPath has too few segments.");
      return null;
    }
    return subPath;
  } catch (e) {
    console.error(
      `❌ ERROR: Failed to split path at offsets: ${startOffset}, ${endOffset}.`,
      e
    );
    return null;
  }
}
