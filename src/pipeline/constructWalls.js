import { JSDOM } from "jsdom";

export default ({ svg, shapes }) => {
  const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const svgElement = doc.querySelector("svg");

  const updatedShapes = shapes.map((shape) => {
    const { floor, wallBounds, z = 20 } = shape; // Default height

    if (!wallBounds || wallBounds.length < 2) return shape;

    let walls = [];

    for (let i = 0; i < wallBounds.length - 1; i++) {
      // ✅ Only iterate normally
      const start = wallBounds[i];
      const end = wallBounds[i + 1];

      const y1 = start.y - z;
      const y2 = end.y - z;

      console.log(
        `🟦 Wall: (${start.x}, ${start.y}) → (${end.x}, ${end.y}) | Height: ${z}`
      );

      if (isNaN(y1) || isNaN(y2)) {
        console.error("❌ ERROR: Found NaN values in wall path!");
        continue;
      }

      // ✅ Construct parallelogram for the wall
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
      wallElement.setAttribute("fill", "blue");
      wallElement.setAttribute("opacity", "0.5");
      wallElement.setAttribute("stroke", "black");
      wallElement.setAttribute("stroke-width", "0.5");

      svgElement.appendChild(wallElement); // ✅ Add wall inside SVG
    }

    return { ...shape, walls };
  });

  const updatedSvg = dom.serialize();
  console.log("✅ Final Updated SVG:", updatedSvg);
  return { svg: updatedSvg, shapes: updatedShapes };
};
