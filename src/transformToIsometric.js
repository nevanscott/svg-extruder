// Helper function to transform coordinates to isometric view

export function transformToIsometric(x, y, z = 0) {
  const isoX = x - y;
  const isoY = (x + y) * 0.5 - z; // Ensure downward movement by subtracting z
  return [isoX, isoY];
}
