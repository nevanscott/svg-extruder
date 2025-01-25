// Helper function to darken a color
export function darkenColor(hexColor, factor = 0.7) {
  if (hexColor === "none" || !hexColor.startsWith("#")) return hexColor;

  const rgb = hexColor
    .slice(1)
    .match(/.{2}/g)
    .map((hex) => parseInt(hex, 16));
  const [r, g, b] = rgb.map((c) => Math.max(0, Math.floor(c * factor)));

  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
