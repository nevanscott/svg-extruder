// Create ellipse element
export function createEllipseElement(center, radiusX, radiusY, fill = "gray") {
  const [cx, cy] = center;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${radiusX}" ry="${radiusY}" fill="${fill}" stroke="black" />`;
}
