// Create polygon element
export function createPolygonElement(points, fill = "gray", stroke = "black") {
  const pointsStr = points.map(([x, y]) => `${x},${y}`).join(" ");
  return `<polygon points="${pointsStr}" fill="${fill}" stroke="${stroke}" />`;
}
