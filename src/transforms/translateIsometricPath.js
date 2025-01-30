import { JSDOM } from "jsdom";

export default function translateIsometricPath(path, dx = 0, dy = 0, dz = 0) {
  const d = path.getAttribute("d");

  // Function to parse path commands
  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g);
  if (!commands) throw new Error("Invalid path data");

  const transformedCommands = commands.map((command) => {
    const type = command[0];
    const args = command.slice(1).trim().split(/[ ,]+/).map(parseFloat);

    switch (type) {
      case "M": // Move to (absolute)
      case "L": // Line to (absolute)
        return `${type}${args[0] + dx},${args[1] + dy - dz}`;
      case "m": // Move to (relative)
      case "l": // Line to (relative)
        return `${type}${args[0] + dx},${args[1] + dy - dz}`;
      case "H": // Horizontal line to (absolute)
        return `H${args[0] + dx}`;
      case "h": // Horizontal line to (relative)
        return `h${args[0] + dx}`;
      case "V": // Vertical line to (absolute)
        return `V${args[0] + dy - dz}`;
      case "v": // Vertical line to (relative)
        return `v${args[0] + dy - dz}`;
      case "C": // Cubic Bézier curve
        return `${type}${args[0] + dx},${args[1] + dy - dz} ${args[2] + dx},${
          args[3] + dy - dz
        } ${args[4] + dx},${args[5] + dy - dz}`;
      case "c": // Cubic Bézier curve (relative)
        return `${type}${args[0] + dx},${args[1] + dy - dz} ${args[2] + dx},${
          args[3] + dy - dz
        } ${args[4] + dx},${args[5] + dy - dz}`;
      case "A": // Arc (absolute)
        return `${type}${args[0]},${args[1]} ${args[2]} ${args[3]},${args[4]} ${
          args[5] + dx
        },${args[6] + dy - dz}`;
      case "a": // Arc (relative)
        return `${type}${args[0]},${args[1]} ${args[2]} ${args[3]},${args[4]} ${
          args[5] + dx
        },${args[6] + dy - dz}`;
      case "Z": // Close path
      case "z":
        return "Z";
      default:
        console.warn(`Unhandled command type: ${type}`);
        return command;
    }
  });

  // Create a new path with the transformed data
  const newPath = path.cloneNode(true);
  newPath.setAttribute("d", transformedCommands.join(" "));

  return newPath;
}
