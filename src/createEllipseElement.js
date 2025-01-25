// Create an ellipse element without strokes by default
export function createEllipseElement(
  center,
  radiusX,
  radiusY,
  fill = "gray",
  stroke = null
) {
  const [cx, cy] = center;
  return stroke
    ? `<ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" fill="${fill}" stroke="${stroke}" />`
    : `<ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" fill="${fill}" />`;
}
