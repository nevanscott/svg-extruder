import convertShapesToPaths from "./transforms/convertShapesToPaths.js";
import getShapesFromSvg from "./transforms/getShapesFromSvg.js";
import createPathFromShape from "./utils/createPathFromShape.js";
import { JSDOM } from "jsdom";
import transformPathToIsometric from "./transforms/transformPathToIsometric.js";
import translateIsometricPath from "./transforms/translateIsometricPath.js";
import recenterSvg from "./transforms/recenterSvg.js";
import { identifyWallBoundaries } from "./utils/identifyWallBoundaries.js";
import { visualizeWallBoundaries } from "./utils/visualizeWallBoundaries.js";

// Pipeline steps
const pipeline = [
  {
    name: "Original SVG",
    show: true,
    step: ({ svg }) => ({ svg }), // Pass through original SVG
  },
  {
    name: "Split into Shapes",
    show: false,
    step: ({ svg, shapes = [] }) => {
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
      svg = await convertShapesToPaths(svg);
      shapes = shapes.map(({ shape }) => createPathFromShape(shape));
      return { svg, shapes };
    },
  },
  {
    name: "Construct the Floor",
    show: false,
    step: ({ svg, shapes }) => {
      shapes = shapes.map((shape) => ({
        floor: { shape, z: 0 },
      }));

      // Render floor shapes
      const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
      const doc = dom.window.document;
      const svgElement = doc.querySelector("svg");

      svgElement.querySelectorAll("path").forEach((path) => path.remove());
      shapes.forEach(({ floor }) =>
        svgElement.appendChild(floor.shape.cloneNode(true))
      );

      return { svg: dom.serialize(), shapes };
    },
  },
  {
    name: "Transform the Floor to Isometric",
    show: false,
    step: ({ svg, shapes }) => {
      shapes = shapes.map(({ floor }) => ({
        floor: {
          shape: transformPathToIsometric(floor.shape, floor.z),
          z: floor.z,
        },
      }));

      const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
      const doc = dom.window.document;
      const svgElement = doc.querySelector("svg");

      svgElement.querySelectorAll("path").forEach((path) => path.remove());
      shapes.forEach(({ floor }) =>
        svgElement.appendChild(floor.shape.cloneNode(true))
      );

      return { svg: dom.serialize(), shapes };
    },
  },
  {
    name: "Recenter SVG",
    show: true,
    step: ({ svg, shapes }) => {
      const floorPaths = shapes.map(({ floor }) => floor.shape);
      const result = recenterSvg(svg, floorPaths);

      return {
        svg: result.svg,
        shapes: shapes.map((shape, i) => ({
          floor: { shape: result.paths[i], z: shape.floor.z },
        })),
      };
    },
  },
  {
    name: "Identify Wall Boundaries",
    show: true,
    step: (state) => {
      const floorPaths = state.shapes.map(({ floor }) =>
        floor.shape.getAttribute("d")
      );
      let boundaryPoints = [];

      floorPaths.forEach((d) => {
        boundaryPoints = boundaryPoints.concat(identifyWallBoundaries(d));
      });

      const updatedSvg = visualizeWallBoundaries(state.svg, boundaryPoints);
      return { ...state, svg: updatedSvg };
    },
  },
  {
    name: "Construct Walls",
    show: false,
    step: (state) => state, // Placeholder
  },
  {
    name: "Construct Ceiling",
    show: false,
    step: ({ svg, shapes }) => {
      shapes = shapes.map(({ floor }) => ({
        floor,
        ceiling: {
          shape: translateIsometricPath(floor.shape, 0, 0, 20),
          z: 20,
        },
      }));

      const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
      const doc = dom.window.document;
      const svgElement = doc.querySelector("svg");

      shapes.forEach(({ ceiling }) =>
        svgElement.appendChild(ceiling.shape.cloneNode(true))
      );

      return { svg: dom.serialize(), shapes };
    },
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
    steps.push({ name, show, svg: state.svg });
  }

  return { svg: state.svg, steps };
}

export { transformSvgToIsometric };
