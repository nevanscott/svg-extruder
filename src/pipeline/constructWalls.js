import { JSDOM } from "jsdom";
import paper from "paper";
import { extractSegment } from "../utils/extractSegment.js";

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
