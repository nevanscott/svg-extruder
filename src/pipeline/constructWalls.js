import { JSDOM } from "jsdom";

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
    } = shape; // Default color to gray if not specified

    if (!wallBounds || wallBounds.length < 2) return shape;

    let walls = [];

    // 🔄 If shape is closed, connect last to first
    const bounds = isClosed ? [...wallBounds, wallBounds[0]] : wallBounds;

    for (let i = 0; i < bounds.length - 1; i++) {
      const start = bounds[i];
      const end = bounds[i + 1];

      // ✅ Adjust Y for height offset
      const y1 = start.y - z; // If needed, switch to `start.y + z`
      const y2 = end.y - z;

      console.log(
        `🟦 Wall: (${start.x}, ${start.y}) → (${end.x}, ${end.y}) | Height: ${z} | Color: ${color}`
      );

      if (isNaN(y1) || isNaN(y2)) {
        console.error("❌ ERROR: Found NaN values in wall path!");
        continue;
      }

      // ✅ Construct parallelogram path
      const wallD = `
        M${start.x},${start.y}
        L${end.x},${end.y}
        L${end.x},${y2}
        L${start.x},${y1}
        Z
      `
        .replace(/\s+/g, " ")
        .trim();

      walls.push({ pathD: wallD });

      // ✅ Create <path> for the wall
      const wallElement = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      wallElement.setAttribute("d", wallD);
      wallElement.setAttribute("fill", color); // Uses shape's color
      wallElement.setAttribute("opacity", "0.5"); // Semi-transparent
      // Stroke is removed

      svgElement.appendChild(wallElement);
    }

    return { ...shape, walls };
  });

  const updatedSvg = dom.serialize();
  console.log("✅ Final Updated SVG:", updatedSvg);
  return { svg: updatedSvg, shapes: updatedShapes };
};
