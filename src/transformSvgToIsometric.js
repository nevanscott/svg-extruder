import convertShapesToPaths from "./transforms/convertShapesToPaths.js";
import getShapesFromSvg from "./transforms/getShapesFromSvg.js";
import createPathFromShape from "./utils/createPathFromShape.js";
import { JSDOM } from "jsdom";
import transformPathToIsometric from "./transforms/transformPathToIsometric.js";

// Sample pipeline steps
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
      // Parse SVG and extract shapes
      shapes = getShapesFromSvg(svg).map((shape) => {
        return {
          type: shape.tagName,
          shape: shape,
          fillColor: shape.getAttribute("fill"),
        };
      });
      return { svg, shapes };
    },
  },
  {
    name: "Convert Shapes to Paths",
    show: true,
    step: async ({ svg, shapes }) => {
      // Convert shapes to paths
      svg = await convertShapesToPaths(svg);

      shapes = shapes.map(({ shape }) => {
        return createPathFromShape(shape);
      });

      return { svg, shapes };
    },
  },
  {
    name: "Construct Floor and Ceiling",
    show: true,
    step: ({ svg, shapes }) => {
      // Add floor and ceiling logic
      shapes = shapes.map((shape) => {
        return {
          floor: { shape, z: 0 },
          ceiling: { shape, z: 20 },
        };
      });

      // Render floor and ceiling shapes to the SVG
      const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
      const doc = dom.window.document;
      const svgElement = doc.querySelector("svg");

      // Remove any existing paths
      const existingPaths = svgElement.querySelectorAll("path");
      existingPaths.forEach((path) => path.remove());

      shapes.forEach(({ floor, ceiling }) => {
        svgElement.appendChild(floor.shape.cloneNode(true));
        svgElement.appendChild(ceiling.shape.cloneNode(true));
      });

      svg = dom.serialize(); // Serialize the SVG document back to a string

      return { svg, shapes };
    },
  },
  {
    name: "Transform to Isometric",
    show: true,
    step: ({ svg, shapes }) => {
      // Transform the paths in SVG string to isometric view
      shapes = shapes.map(({ floor, ceiling }) => {
        return {
          floor: {
            shape: transformPathToIsometric(floor.shape, floor.z),
            z: floor.z,
          },
          ceiling: {
            shape: transformPathToIsometric(ceiling.shape, ceiling.z),
            z: ceiling.z,
          },
        };
      });

      // Render floor and ceiling shapes to the SVG
      const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
      const doc = dom.window.document;
      const svgElement = doc.querySelector("svg");

      // Remove any existing paths
      const existingPaths = svgElement.querySelectorAll("path");
      existingPaths.forEach((path) => path.remove());

      shapes.forEach(({ floor, ceiling }) => {
        svgElement.appendChild(floor.shape.cloneNode(true));
        svgElement.appendChild(ceiling.shape.cloneNode(true));
      });

      svg = dom.serialize(); // Serialize the SVG document back to a string

      return { svg, shapes };
    },
  },
  {
    name: "Identify Sharp Turn Points",
    show: false,
    step: (state) => {
      // Placeholder: Add sharp turn point detection
      return state;
    },
  },
];

async function transformSvgToIsometric(svg) {
  // Set up initial state
  let state = { svg };

  // Reusable function to decorate SVG with step comments
  const decorateSvgWithStepName = (svg, stepNumber, name) =>
    `${svg}<!-- Step ${stepNumber}: ${name} -->`;

  // Run through each step in the pipeline
  const steps = [];
  for (let i = 0; i < pipeline.length; i++) {
    const { name, show, step } = pipeline[i];
    state = await step(state); // Process current step
    state.svg = decorateSvgWithStepName(state.svg, i, name); // Add step comment with step number
    steps.push({ name, show, svg: state.svg }); // Collect step results
  }

  return { svg: state.svg, steps };
}
export { transformSvgToIsometric };
