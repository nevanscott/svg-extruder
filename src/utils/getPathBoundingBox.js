/**
 * Compute the bounding box from a path's `d` attribute.
 */
export function getPathBoundingBox(d) {
  if (!d) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
  if (!commands) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let currentX = 0,
    currentY = 0;

  commands.forEach((command) => {
    const type = command[0];
    const args = command.slice(1).trim().split(/[ ,]+/).map(parseFloat);

    if (args.some(isNaN)) return;

    let x = currentX,
      y = currentY;
    switch (type) {
      case "M":
      case "L":
        [x, y] = args;
        break;
      case "C":
        [x, y] = args.slice(-2);
        break;
      case "Q":
        [x, y] = args.slice(-2);
        break;
      case "A":
        [x, y] = args.slice(-2);
        break;
      case "H":
        x = args[0];
        break;
      case "V":
        y = args[0];
        break;
      default:
        return;
    }

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);

    currentX = x;
    currentY = y;
  });

  return { minX, minY, maxX, maxY };
}
