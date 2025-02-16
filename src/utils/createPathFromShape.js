import { parseSvg, createSvgElement } from "../utils/environment.js";

/**
 * Converts an SVG shape element into a path element.
 * Supports various shapes like rect, circle, ellipse, line, polyline, polygon, and path.
 *
 * @param {Element} shape - The SVG shape element to convert.
 * @returns {SVGPathElement} - The resulting path element.
 */
export default function createPathFromShape(shape) {
  const { doc } = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const path = createSvgElement(doc, "path");

  const type = shape.tagName.toLowerCase();
  let d = ""; // Path data

  switch (type) {
    case "path":
      // Use existing path data directly
      d = shape.getAttribute("d");
      break;

    case "rect": {
      // Rectangle or rounded rectangle
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
        // Rounded rectangle: Approximation using cubic Bézier curves
        const kappa = 0.552284749831; // Control point offset for arcs
        const controlRx = rectRx * kappa;
        const controlRy = rectRy * kappa;

        d = `
          M${x + rectRx},${y}
          h${width - 2 * rectRx}
          c${controlRx},0 ${rectRx},${rectRy - controlRy} ${rectRx},${rectRy}
          v${height - 2 * rectRy}
          c0,${controlRy} ${-rectRx + controlRx},${rectRy} ${-rectRx},${rectRy}
          h-${width - 2 * rectRx}
          c-${controlRx},0 -${rectRx},${
          -rectRy + controlRy
        } -${rectRx},-${rectRy}
          v-${height - 2 * rectRy}
          c0,-${controlRy} ${rectRx - controlRx},-${rectRy} ${rectRx},-${rectRy}
          Z
        `.trim();
      } else {
        // Regular rectangle
        d = `M${x},${y} h${width} v${height} h-${width} Z`;
      }
      break;
    }

    case "circle": {
      // Circle: Approximation using cubic Bézier curves
      const cx = parseFloat(shape.getAttribute("cx")) || 0;
      const cy = parseFloat(shape.getAttribute("cy")) || 0;
      const r = parseFloat(shape.getAttribute("r")) || 0;
      const kappa = 0.552284749831; // Control point offset for a circle
      const cp = r * kappa;

      d = `
        M${cx - r},${cy}
        C${cx - r},${cy - cp} ${cx - cp},${cy - r} ${cx},${cy - r}
        C${cx + cp},${cy - r} ${cx + r},${cy - cp} ${cx + r},${cy}
        C${cx + r},${cy + cp} ${cx + cp},${cy + r} ${cx},${cy + r}
        C${cx - cp},${cy + r} ${cx - r},${cy + cp} ${cx - r},${cy}
        Z
      `.trim();
      break;
    }

    case "ellipse": {
      // Ellipse: Approximation using cubic Bézier curves
      const ecx = parseFloat(shape.getAttribute("cx")) || 0;
      const ecy = parseFloat(shape.getAttribute("cy")) || 0;
      const rx = parseFloat(shape.getAttribute("rx")) || 0;
      const ry = parseFloat(shape.getAttribute("ry")) || 0;
      const kappaX = rx * 0.552284749831;
      const kappaY = ry * 0.552284749831;

      d = `
        M${ecx - rx},${ecy}
        C${ecx - rx},${ecy - kappaY} ${ecx - kappaX},${ecy - ry} ${ecx},${
        ecy - ry
      }
        C${ecx + kappaX},${ecy - ry} ${ecx + rx},${ecy - kappaY} ${
        ecx + rx
      },${ecy}
        C${ecx + rx},${ecy + kappaY} ${ecx + kappaX},${ecy + ry} ${ecx},${
        ecy + ry
      }
        C${ecx - kappaX},${ecy + ry} ${ecx - rx},${ecy + kappaY} ${
        ecx - rx
      },${ecy}
        Z
      `.trim();
      break;
    }

    case "line": {
      // Line
      const x1 = parseFloat(shape.getAttribute("x1")) || 0;
      const y1 = parseFloat(shape.getAttribute("y1")) || 0;
      const x2 = parseFloat(shape.getAttribute("x2")) || 0;
      const y2 = parseFloat(shape.getAttribute("y2")) || 0;
      d = `M${x1},${y1} L${x2},${y2}`;
      break;
    }

    case "polyline":
    case "polygon": {
      // Polyline/Polygon
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
        d += " Z"; // Close the path for polygons
      }
      break;
    }

    default:
      throw new Error(`Unsupported shape type: ${type}`);
  }

  // Set attributes for the resulting path
  path.setAttribute("fill", shape.getAttribute("fill"));
  path.setAttribute("stroke", shape.getAttribute("stroke"));
  path.setAttribute("d", d);

  return path;
}
