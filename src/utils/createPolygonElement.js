// Create a polygon element without strokes by default
export function createPolygonElement(points, fill = "gray", stroke = null) {
  const pointsStr = points.map(([x, y]) => `${x},${y}`).join(" ");
  return stroke
    ? `<polygon points="${pointsStr}" fill="${fill}" stroke="${stroke}" />`
    : `<polygon points="${pointsStr}" fill="${fill}" />`;
}
