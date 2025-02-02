import splitIntoShapes from "./pipeline/splitIntoShapes.js";
import convertShapesToPaths from "./pipeline/convertShapesToPaths.js";
import constructFloor from "./pipeline/constructFloor.js";
import transformFloorToIsometric from "./pipeline/transformFloorToIsometric.js";
import recenterView from "./pipeline/recenterView.js";
import findWallBoundaries from "./pipeline/findWallBoundaries.js";
import constructCeiling from "./pipeline/constructCeiling.js";
import constructWalls from "./pipeline/constructWalls.js";

// Pipeline steps
const pipeline = [
  {
    name: "Original SVG",
    show: false,
    step: ({ svg }) => ({ svg }), // Pass through original SVG
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
    name: "Recenter SVG",
    show: true,
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
    name: "Construct Ceiling",
    show: true,
    step: constructCeiling,
  },
];

// Function to run the pipeline
async function transformSvgToIsometric(svg) {
  let state = { svg };

  const decorateSvgWithStepName = (svg, stepNumber, name) =>
    `${svg}<!-- Step ${stepNumber}: ${name} -->`;

  const steps = [];
  for (let i = 0; i < pipeline.length; i++) {
    const { name, show, step } = pipeline[i];
    state = await step(state);
    state.svg = decorateSvgWithStepName(state.svg, i, name);
    // console.log(`✅ Step ${i}: ${name}`);
    // console.log(state.svg);
    steps.push({ name, show, svg: state.svg });
  }

  return { svg: state.svg, steps };
}

export { transformSvgToIsometric };
