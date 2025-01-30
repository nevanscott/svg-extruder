import convertShapesToPaths from "./transforms/convertShapesToPaths.js";
import getShapesFromSvg from "./transforms/getShapesFromSvg.js";
import createPathFromShape from "./utils/createPathFromShape.js";
import { JSDOM } from "jsdom";
import transformPathToIsometric from "./transforms/transformPathToIsometric.js";
import translateIsometricPath from "./transforms/translateIsometricPath.js";

// Pipeline steps
const pipeline = [
  {
    name: "Original SVG",
    show: true,
    step: ({ svg }) => {
      return { svg }; // Pass through the original SVG
    },
  },
  {
    name: "Split into Shapes",
    show: false,
    step: ({ svg, shapes = [] }) => {
      // Extract individual shapes from the SVG
      shapes = getShapesFromSvg(svg).map((shape) => ({
        type: shape.tagName,
        shape,
        fillColor: shape.getAttribute("fill"),
      }));
      return { svg, shapes };
    },
  },
  {
    name: "Convert Shapes to Paths",
    show: false,
    step: async ({ svg, shapes }) => {
      // Convert all shapes into path elements
      svg = await convertShapesToPaths(svg);
      shapes = shapes.map(({ shape }) => createPathFromShape(shape));
      return { svg, shapes };
    },
  },
  {
    name: "Construct the Floor",
    show: true,
    step: ({ svg, shapes }) => {
      // Assign the floor level (z=0) to all shapes
      shapes = shapes.map((shape) => ({
        floor: { shape, z: 0 },
      }));

      // Render floor shapes to the SVG
      const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
      const doc = dom.window.document;
      const svgElement = doc.querySelector("svg");

      // Remove any existing paths
      svgElement.querySelectorAll("path").forEach((path) => path.remove());

      shapes.forEach(({ floor }) => {
        svgElement.appendChild(floor.shape.cloneNode(true));
      });

      svg = dom.serialize(); // Serialize updated SVG

      return { svg, shapes };
    },
  },
  {
    name: "Transform the Floor to Isometric",
    show: true,
    step: ({ svg, shapes }) => {
      // Convert the floor to its isometric projection
      shapes = shapes.map(({ floor }) => ({
        floor: {
          shape: transformPathToIsometric(floor.shape, floor.z),
          z: floor.z,
        },
      }));

      // Render transformed floor shapes to the SVG
      const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
      const doc = dom.window.document;
      const svgElement = doc.querySelector("svg");

      // Remove any existing paths
      svgElement.querySelectorAll("path").forEach((path) => path.remove());

      shapes.forEach(({ floor }) => {
        svgElement.appendChild(floor.shape.cloneNode(true));
      });

      svg = dom.serialize(); // Serialize updated SVG

      return { svg, shapes };
    },
  },
  {
    name: "Identify Wall Boundaries",
    show: true,
    step: (state) => {
      // Placeholder: Identify where walls should be constructed
      return state;
    },
  },
  {
    name: "Construct Walls",
    show: false,
    step: (state) => {
      // Placeholder: Construct walls between floor and ceiling edges
      return state;
    },
  },
  {
    name: "Construct Ceiling",
    show: false,
    step: ({ svg, shapes }) => {
      // Add ceiling by offsetting the floor upwards
      shapes = shapes.map(({ floor }) => ({
        floor,
        ceiling: {
          shape: translateIsometricPath(floor.shape, 0, 0, 20),
          z: 20,
        },
      }));

      // Render ceiling shapes to the SVG
      const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
      const doc = dom.window.document;
      const svgElement = doc.querySelector("svg");

      shapes.forEach(({ ceiling }) => {
        svgElement.appendChild(ceiling.shape.cloneNode(true));
      });

      svg = dom.serialize(); // Serialize updated SVG

      return { svg, shapes };
    },
  },
];

// Function to run the pipeline
async function transformSvgToIsometric(svg) {
  // Initialize state
  let state = { svg };

  // Utility function to add step comments
  const decorateSvgWithStepName = (svg, stepNumber, name) =>
    `${svg}<!-- Step ${stepNumber}: ${name} -->`;

  // Run through each step in the pipeline
  const steps = [];
  for (let i = 0; i < pipeline.length; i++) {
    const { name, show, step } = pipeline[i];
    state = await step(state); // Process current step
    state.svg = decorateSvgWithStepName(state.svg, i, name); // Add step comment
    steps.push({ name, show, svg: state.svg }); // Store step output
  }

  return { svg: state.svg, steps };
}

export { transformSvgToIsometric };
