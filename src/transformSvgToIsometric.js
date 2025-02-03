import splitIntoShapes from "./pipeline/splitIntoShapes.js";
import convertShapesToPaths from "./pipeline/convertShapesToPaths.js";
import constructFloor from "./pipeline/constructFloor.js";
import transformFloorToIsometric from "./pipeline/transformFloorToIsometric.js";
import recenterView from "./pipeline/recenterView.js";
import findWallBoundaries from "./pipeline/findWallBoundaries.js";
import constructCeiling from "./pipeline/constructCeiling.js";
import constructWalls from "./pipeline/constructWalls.js";
import orderLayers from "./pipeline/orderLayers.js";

// Pipeline steps
const pipeline = [
  {
    name: "Original SVG",
    show: false,
    step: (state) => state,
  },
  {
    name: "Split into Shapes",
    show: false,
    step: splitIntoShapes,
  },
  {
    name: "Convert Shapes to Paths",
    show: false,
    step: convertShapesToPaths,
  },
  {
    name: "Construct the Floor",
    show: false,
    step: constructFloor,
  },
  {
    name: "Transform the Floor to Isometric",
    show: false,
    step: transformFloorToIsometric,
  },
  {
    name: "Construct Ceiling",
    show: false,
    step: constructCeiling,
  },
  {
    name: "Recenter SVG",
    show: false,
    step: recenterView,
  },
  {
    name: "Identify Wall Boundaries",
    show: true,
    step: findWallBoundaries,
  },
  {
    name: "Construct Walls",
    show: true,
    step: constructWalls,
  },
  {
    name: "Order Layers",
    show: true,
    step: orderLayers,
  },
  {
    name: "Final SVG",
    show: true,
    step: ({ shapes, svg, svgDebug }) => ({ shapes, svg, svgDebug: svg }),
  },
];

async function transformSvgToIsometric(svg, debug = false) {
  let state = { shapes: [], svg, svgDebug: svg, debug };

  const steps = [];

  for (let i = 0; i < pipeline.length; i++) {
    const { name, show, step } = pipeline[i];

    // Run the pipeline step
    const newState = await step(state);

    // Ensure state updates (avoid overwriting SVG if the step doesn't modify it)
    state = {
      ...state,
      ...newState,
      svg: newState.svg || state.svg,
      svgDebug: newState.svgDebug || state.svgDebug,
    };

    steps.push({ name, show, svg: state.svg, svgDebug: state.svgDebug });
  }

  return { svg: state.svg, svgDebug: state.svgDebug, steps };
}

export { transformSvgToIsometric };
