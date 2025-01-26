// Create a path element, optionally with a gradient fill
export function createPathElement(
  pathData,
  fill = "gray",
  stroke = null,
  gradientId = null
) {
  const fillAttr = gradientId ? `url(#${gradientId})` : fill;
  return stroke
    ? `<path d="${pathData}" fill="${fillAttr}" stroke="${stroke}" />`
    : `<path d="${pathData}" fill="${fillAttr}" />`;
}
