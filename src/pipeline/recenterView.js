import recenterSvg from "../transforms/recenterSvg.js";

export default ({ svg, shapes }) => {
  const floorPaths = shapes.map(({ floor }) => floor.shape);
  const result = recenterSvg(svg, floorPaths);

  return {
    svg: result.svg,
    shapes: shapes.map((shape, i) => ({
      floor: { shape: result.paths[i], z: shape.floor.z },
    })),
  };
};
