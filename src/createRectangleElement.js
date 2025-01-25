// Create a rectangle element for SVG
export function createRectangleElement(
  x,
  y,
  width,
  height,
  fill = "pink",
  opacity = 0.5,
  stroke = "none"
) {
  return {
    tag: "rect",
    attributes: {
      x,
      y,
      width,
      height,
      fill,
      "fill-opacity": opacity,
      stroke,
    },
  };
}
