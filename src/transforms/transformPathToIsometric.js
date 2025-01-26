import { JSDOM } from "jsdom";

export default function transformPathToIsometric(path, z = 0) {
  console.log("---transforming the path---");

  const dom = new JSDOM();
  const doc = dom.window.document;
  const isometricPath = doc.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );

  const d = path.getAttribute("d");
  const fill = path.getAttribute("fill") || "none";

  // Transform (x, y, z) to isometric coordinates
  const toIsometric = (x, y, z) => {
    const isoX = x - y; // Isometric X
    const isoY = (x + y) * 0.5 - z; // Isometric Y
    return [isoX, isoY];
  };

  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
  if (!commands) throw new Error("Invalid path data");

  let currentX = 0,
    currentY = 0;

  const transformedCommands = commands.map((command) => {
    const type = command[0];
    const args = command.slice(1).trim().split(/[ ,]+/).map(parseFloat);

    switch (type) {
      case "M": // Move to (absolute)
        [currentX, currentY] = args; // Update the current position
        return `M${toIsometric(currentX, currentY, z).join(",")}`;

      case "m": // Move to (relative)
        // Compute the absolute position by adding the delta to the current position
        currentX += args[0];
        currentY += args[1];
        return `M${toIsometric(currentX, currentY, z).join(",")}`; // Always output absolute

      case "L": // Line to (absolute)
        [currentX, currentY] = args; // Update the current position
        return `L${toIsometric(currentX, currentY, z).join(",")}`;

      case "l": // Line to (relative)
        // Compute the absolute position by adding the delta to the current position
        const absX = currentX + args[0];
        const absY = currentY + args[1];
        const [isoX, isoY] = toIsometric(absX, absY, z);
        currentX = absX; // Update the current position
        currentY = absY;
        return `L${isoX},${isoY}`; // Output as an absolute line

      case "H": // Horizontal line to (absolute)
        currentX = args[0]; // Update the current X position
        return `L${toIsometric(currentX, currentY, z).join(",")}`;

      case "h": // Horizontal line to (relative)
        const absHX = currentX + args[0]; // Compute the absolute X position
        const [isoHX, isoHY] = toIsometric(absHX, currentY, z);
        currentX = absHX; // Update the current X position
        return `L${isoHX},${isoHY}`; // Output as an absolute line

      case "V": // Vertical line to (absolute)
        currentY = args[0]; // Update the current Y position
        return `L${toIsometric(currentX, currentY, z).join(",")}`;

      case "v": // Vertical line to (relative)
        const absVY = currentY + args[0]; // Compute the absolute Y position
        const [isoVX, isoVY] = toIsometric(currentX, absVY, z);
        currentY = absVY; // Update the current Y position
        return `L${isoVX},${isoVY}`; // Output as an absolute line

      case "C": // Cubic Bézier curve (absolute)
        const [c1x, c1y, c2x, c2y, x, y] = args;
        const [isoC1x, isoC1y] = toIsometric(c1x, c1y, z);
        const [isoC2x, isoC2y] = toIsometric(c2x, c2y, z);
        const [isoXC, isoYC] = toIsometric(x, y, z);
        currentX = x;
        currentY = y;
        return `C${isoC1x},${isoC1y} ${isoC2x},${isoC2y} ${isoXC},${isoYC}`;
      case "c": // Cubic Bézier curve (relative)
        const [rc1x, rc1y, rc2x, rc2y, rxc, ryc] = args;
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
        const [isoRX, isoRY] = toIsometric(currentX + rx, currentY + ry, z);
        currentX += rx;
        currentY += ry;
        return `c${isoRC1x},${isoRC1y} ${isoRC2x},${isoRC2y} ${isoRX},${isoRY}`;
      case "A": // Elliptical arc (absolute)
        const [rx, ry, xRot, largeArc, sweep, ax, ay] = args;
        const [isoAx, isoAy] = toIsometric(ax, ay, z);
        const isoRx = (rx * Math.sqrt(2)) / 2; // Adjust for isometric scaling
        const isoRy = ry * 0.5;
        currentX = ax;
        currentY = ay;
        return `A${isoRx},${isoRy} ${xRot} ${largeArc},${sweep} ${isoAx},${isoAy}`;
      case "a": // Elliptical arc (relative)
        const [rrx, rry, rXRot, rLargeArc, rSweep, rax, ray] = args;
        const relAx = currentX + rax;
        const relAy = currentY + ray;
        const [isoRelAx, isoRelAy] = toIsometric(relAx, relAy, z);
        const isoRelRx = (rrx * Math.sqrt(2)) / 2;
        const isoRelRy = rry * 0.5;
        currentX = relAx;
        currentY = relAy;
        return `a${isoRelRx},${isoRelRy} ${rXRot} ${rLargeArc},${rSweep} ${isoRelAx},${isoRelAy}`;
      case "Z": // Close path
      case "z":
        return "Z";
      default:
        console.warn(`Unhandled command type: ${type}`);
        return command; // Return unchanged for unhandled types
    }
  });

  // Set the transformed path data and fill
  isometricPath.setAttribute("d", transformedCommands.join(" "));
  isometricPath.setAttribute("fill", fill);

  return isometricPath;
}
