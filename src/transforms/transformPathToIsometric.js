import { JSDOM } from "jsdom";

export default function transformPathToIsometric(path, z = 0) {
  const dom = new JSDOM();
  const doc = dom.window.document;
  const isometricPath = doc.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );

  const d = path.getAttribute("d");
  const fill = path.getAttribute("fill") || "none";

  const toIsometric = (x, y, z) => {
    const isoX = x - y;
    const isoY = (x + y) * 0.5 - z;
    return [isoX, isoY];
  };

  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
  if (!commands) throw new Error("Invalid path data");

  let currentX = 0,
    currentY = 0,
    startX = 0,
    startY = 0;

  const transformedCommands = commands.map((command) => {
    const type = command[0];
    const args = command.slice(1).trim().split(/[ ,]+/).map(parseFloat);

    switch (type) {
      case "M": // Move to (absolute)
        [currentX, currentY] = args;
        [startX, startY] = [currentX, currentY];
        return `M${toIsometric(currentX, currentY, z).join(",")}`;

      case "m": // Move to (relative)
        currentX += args[0];
        currentY += args[1];
        [startX, startY] = [currentX, currentY];
        return `M${toIsometric(currentX, currentY, z).join(",")}`;

      case "L": // Line to (absolute)
        [currentX, currentY] = args;
        return `L${toIsometric(currentX, currentY, z).join(",")}`;

      case "l": // Line to (relative)
        currentX += args[0];
        currentY += args[1];
        return `L${toIsometric(currentX, currentY, z).join(",")}`;

      case "H": // Horizontal line to (absolute)
        currentX = args[0];
        return `L${toIsometric(currentX, currentY, z).join(",")}`;

      case "h": // Horizontal line to (relative)
        currentX += args[0];
        return `L${toIsometric(currentX, currentY, z).join(",")}`;

      case "V": // Vertical line to (absolute)
        currentY = args[0];
        return `L${toIsometric(currentX, currentY, z).join(",")}`;

      case "v": // Vertical line to (relative)
        currentY += args[0];
        return `L${toIsometric(currentX, currentY, z).join(",")}`;

      case "C": {
        // Cubic Bézier curve (absolute)
        const [c1x, c1y, c2x, c2y, x, y] = args;
        const [isoC1x, isoC1y] = toIsometric(c1x, c1y, z);
        const [isoC2x, isoC2y] = toIsometric(c2x, c2y, z);
        const [isoX, isoY] = toIsometric(x, y, z);
        currentX = x;
        currentY = y;
        return `C${isoC1x},${isoC1y} ${isoC2x},${isoC2y} ${isoX},${isoY}`;
      }

      case "c": {
        // Cubic Bézier curve (relative)
        const [rc1x, rc1y, rc2x, rc2y, dx, dy] = args;
        const [isoRC1x, isoRC1y] = toIsometric(
          currentX + rc1x,
          currentY + rc1y,
          z
        );
        const [isoRC2x, isoRC2y] = toIsometric(
          currentX + rc2x,
          currentY + rc2y,
          z
        );
        const [isoX, isoY] = toIsometric(currentX + dx, currentY + dy, z);
        currentX += dx;
        currentY += dy;
        return `C${isoRC1x},${isoRC1y} ${isoRC2x},${isoRC2y} ${isoX},${isoY}`;
      }

      case "A": {
        // Elliptical Arc (absolute)
        const [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y] = args;

        // Transform the radii for isometric projection
        const isoRx = rx * Math.SQRT1_2;
        const isoRy = ry * 0.5;

        // Transform the endpoint of the arc
        const [isoX, isoY] = toIsometric(x, y, z);

        // Update the current position
        currentX = x;
        currentY = y;

        // Return the transformed arc without redundant `L`
        return `A${isoRx},${isoRy} ${xAxisRotation} ${largeArcFlag},${sweepFlag} ${isoX},${isoY}`;
      }

      case "a": {
        // Elliptical Arc (relative)
        const [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, dx, dy] = args;

        // Compute the absolute endpoint
        const absX = currentX + dx;
        const absY = currentY + dy;

        // Transform the radii for isometric projection
        const isoRx = rx * Math.SQRT1_2;
        const isoRy = ry * 0.5;

        // Transform the endpoint of the arc
        const [isoX, isoY] = toIsometric(absX, absY, z);

        // Update the current position
        currentX = absX;
        currentY = absY;

        // Return the transformed arc without redundant `L`
        return `A${isoRx},${isoRy} ${xAxisRotation} ${largeArcFlag},${sweepFlag} ${isoX},${isoY}`;
      }

      case "Z": // Close path
      case "z": {
        // Ensure the close path connects back to the start point
        return "Z";
      }

      default:
        console.warn(`Unhandled command type: ${type}`);
        return command;
    }
  });

  isometricPath.setAttribute("d", transformedCommands.join(" "));
  isometricPath.setAttribute("fill", fill);

  return isometricPath;
}
