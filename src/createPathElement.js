// Create a path element
export function createPathElement(pathData, fill = "gray", stroke = "black") {
  return `<path d="${pathData}" fill="${fill}" stroke="${stroke}" />`;
}
