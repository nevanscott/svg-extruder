import recenterSvg from "../transforms/recenterSvg.js";

export default ({ svg, svgDebug, shapes }) => {
  // ✅ Collect all floor paths for recentering
  const floorPaths = shapes.map(({ floor }) => floor.path);

  // ✅ Apply recentering transformation
  const result = recenterSvg(svg, floorPaths);

  // ✅ Update shape model with recentered floor paths
  shapes = shapes.map((shape, i) => ({
    ...shape,
    floor: {
      path: result.paths[i], // ✅ Use recentered path
      fillColor: shape.floor.fillColor, // ✅ Preserve fill color
      elevation: shape.floor.elevation, // ✅ Keep elevation
    },
  }));

  // ✅ Ensure `svgDebug` is identical to the recentered `svg`
  return {
    svg: result.svg,
    svgDebug: result.svg, // ✅ No extra debug overlays needed
    shapes,
  };
};
