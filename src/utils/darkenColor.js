import colorName from "color-name";
import { parse, formatHex, oklab, rgb } from "culori";

// Helper function to darken and desaturate a color using OKLab
export function darkenColor(
  color,
  lightnessFactor = 0.7,
  saturationFactor = 1
) {
  if (color === "none") return color;

  let rgbColor;

  // Convert named color to RGB
  if (color in colorName) {
    const [r, g, b] = colorName[color];
    rgbColor = { mode: "rgb", r: r / 255, g: g / 255, b: b / 255 };
  } else if (color.startsWith("#")) {
    rgbColor = parse(color); // Parse hex color to an RGB object
  } else {
    // If the color is unsupported, return it as-is
    return color;
  }

  if (!rgbColor) return color;

  // Convert RGB to OKLab
  const oklabColor = oklab(rgbColor);

  if (!oklabColor) return color; // Fallback if conversion fails

  // Adjust lightness (L) and desaturate (a, b)
  const darkenedAndDesaturatedOklab = {
    ...oklabColor,
    l: Math.max(0, oklabColor.l * lightnessFactor), // Reduce luminance (lightness)
    a: oklabColor.a * saturationFactor, // Adjust chromatic component 'a'
    b: oklabColor.b * saturationFactor, // Adjust chromatic component 'b'
  };

  // Convert back to RGB
  const adjustedRgb = rgb(darkenedAndDesaturatedOklab);

  if (!adjustedRgb) return color; // Fallback if conversion fails

  // Format as a hex color and return
  return formatHex(adjustedRgb);
}
