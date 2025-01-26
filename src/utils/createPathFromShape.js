import { JSDOM } from "jsdom";

export default function createPathFromShape(shape) {
  const dom = new JSDOM();
  const document = dom.window.document;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

  const type = shape.tagName.toLowerCase();
  let d = "";

  switch (type) {
    case "rect":
      const x = parseFloat(shape.getAttribute("x")) || 0;
      const y = parseFloat(shape.getAttribute("y")) || 0;
      const width = parseFloat(shape.getAttribute("width")) || 0;
      const height = parseFloat(shape.getAttribute("height")) || 0;
      let rectRx = parseFloat(shape.getAttribute("rx")) || 0;
      let rectRy = parseFloat(shape.getAttribute("ry")) || rectRx;

      // Clamp rx and ry to half of width and height
      rectRx = Math.min(rectRx, width / 2);
      rectRy = Math.min(rectRy, height / 2);

      if (rectRx > 0 || rectRy > 0) {
        // Rounded rectangle path
        d = `
        M${x + rectRx},${y} 
        h${width - 2 * rectRx} 
        a${rectRx},${rectRy} 0 0 1 ${rectRx},${rectRy} 
        v${height - 2 * rectRy} 
        a${rectRx},${rectRy} 0 0 1 -${rectRx},${rectRy} 
        h-${width - 2 * rectRx} 
        a${rectRx},${rectRy} 0 0 1 -${rectRx},-${rectRy} 
        v-${height - 2 * rectRy} 
        a${rectRx},${rectRy} 0 0 1 ${rectRx},-${rectRy} 
        Z
      `.trim();
      } else {
        // Regular rectangle path
        d = `M${x},${y} h${width} v${height} h-${width} Z`;
      }
      break;
    case "circle":
      const cx = parseFloat(shape.getAttribute("cx")) || 0;
      const cy = parseFloat(shape.getAttribute("cy")) || 0;
      const r = parseFloat(shape.getAttribute("r")) || 0;
      d = `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 -${
        2 * r
      },0`;
      break;
    case "ellipse":
      const ecx = parseFloat(shape.getAttribute("cx")) || 0;
      const ecy = parseFloat(shape.getAttribute("cy")) || 0;
      const rx = parseFloat(shape.getAttribute("rx")) || 0;
      const ry = parseFloat(shape.getAttribute("ry")) || 0;
      d = `M${ecx - rx},${ecy} a${rx},${ry} 0 1,0 ${
        2 * rx
      },0 a${rx},${ry} 0 1,0 -${2 * rx},0`;
      break;
    case "line":
      const x1 = parseFloat(shape.getAttribute("x1")) || 0;
      const y1 = parseFloat(shape.getAttribute("y1")) || 0;
      const x2 = parseFloat(shape.getAttribute("x2")) || 0;
      const y2 = parseFloat(shape.getAttribute("y2")) || 0;
      d = `M${x1},${y1} L${x2},${y2}`;
      break;
    case "polyline":
    case "polygon":
      const points = shape
        .getAttribute("points")
        .trim()
        .split(/\s+|,/)
        .map(parseFloat);
      d = points.reduce((acc, point, index) => {
        return (
          acc + (index % 2 === 0 ? (index === 0 ? "M" : "L") : ",") + point
        );
      }, "");
      if (type === "polygon") {
        d += " Z";
      }
      break;
    default:
      throw new Error(`Unsupported shape type: ${type}`);
  }

  path.setAttribute("fill", shape.getAttribute("fill"));
  path.setAttribute("stroke", shape.getAttribute("stroke"));
  path.setAttribute("d", d);

  return path;
}
