/**
 * Parses an SVG path `d` attribute and extracts key points.
 * Returns an array of { x, y, isCurve } objects.
 */
export function parsePath(d) {
  if (!d) return [];

  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
  if (!commands) return [];

  let currentX = 0,
    currentY = 0;
  let points = [];

  commands.forEach((command) => {
    const type = command[0];
    const args = command.slice(1).trim().split(/[ ,]+/).map(parseFloat);

    if (args.some(isNaN)) return;

    let x = currentX,
      y = currentY;
    let isCurve = false;

    switch (type) {
      case "M": // Move to (absolute)
        [x, y] = args;
        break;
      case "m": // Move to (relative)
        x += args[0];
        y += args[1];
        break;
      case "L": // Line to (absolute)
        [x, y] = args;
        break;
      case "l": // Line to (relative)
        x += args[0];
        y += args[1];
        break;
      case "H": // Horizontal line (absolute)
        x = args[0];
        break;
      case "h": // Horizontal line (relative)
        x += args[0];
        break;
      case "V": // Vertical line (absolute)
        y = args[0];
        break;
      case "v": // Vertical line (relative)
        y += args[0];
        break;
      case "C": // Cubic Bézier curve (absolute)
        [x, y] = args.slice(-2);
        isCurve = true;
        break;
      case "c": // Cubic Bézier curve (relative)
        x += args[4];
        y += args[5];
        isCurve = true;
        break;
      case "Q": // Quadratic Bézier curve (absolute)
        [x, y] = args.slice(-2);
        isCurve = true;
        break;
      case "q": // Quadratic Bézier curve (relative)
        x += args[2];
        y += args[3];
        isCurve = true;
        break;
      case "A": // Arc (absolute)
        [x, y] = args.slice(-2);
        isCurve = true;
        break;
      case "a": // Arc (relative)
        x += args[5];
        y += args[6];
        isCurve = true;
        break;
      case "Z":
      case "z": // Close path (return to first point)
        if (points.length) {
          x = points[0].x;
          y = points[0].y;
        }
        break;
      default:
        return;
    }

    points.push({ x, y, isCurve });
    currentX = x;
    currentY = y;
  });

  return points;
}
