import recenterSvg from "../transforms/recenterSvg.js";

export default ({ svg, svgDebug, shapes }) => {
  // ✅ Collect all paths (floor + ceiling) for recentering
  const pathsToRecenter = shapes.flatMap(
    ({ floor, ceiling }) => [floor?.path, ceiling?.path].filter(Boolean) // Only include existing paths
  );

  // ✅ Apply recentering transformation
  const result = recenterSvg(svg, pathsToRecenter);

  // ✅ Update shape model with recentered floor and ceiling paths
  let updatedIndex = 0;
  shapes = shapes.map((shape) => {
    const updatedShape = { ...shape };

    // ✅ Recenter floor if it exists
    if (shape.floor) {
      updatedShape.floor = {
        ...shape.floor,
        path: result.paths[updatedIndex++], // Assign next recentered path
      };
    }

    // ✅ Recenter ceiling if it exists
    if (shape.ceiling) {
      updatedShape.ceiling = {
        ...shape.ceiling,
        path: result.paths[updatedIndex++], // Assign next recentered path
      };
    }

    return updatedShape;
  });

  // ✅ Ensure `svgDebug` is identical to the recentered `svg`
  return {
    svg: result.svg,
    svgDebug: result.svg, // ✅ No extra debug overlays needed
    shapes,
  };
};
