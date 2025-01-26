import colorName from "color-name";

// Helper function to darken a color
export function darkenColor(color, factor = 0.7) {
  if (color === "none") return color;

  // Convert named color to RGB
  if (color in colorName) {
    const [r, g, b] = colorName[color];
    return darkenRgb(r, g, b, factor);
  }

  // Handle hex color
  if (color.startsWith("#")) {
    const rgb = color
      .slice(1)
      .match(/.{2}/g)
      .map((hex) => parseInt(hex, 16));
    const [r, g, b] = rgb;
    return darkenRgb(r, g, b, factor);
  }

  // If the color is unsupported, return it as-is
  return color;
}

// Darken RGB color and return as hex
function darkenRgb(r, g, b, factor) {
  const darkened = [r, g, b].map((c) => Math.max(0, Math.floor(c * factor)));
  return `#${darkened.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
