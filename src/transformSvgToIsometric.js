import { create } from "@svgdotjs/svg.js";
import convertShapesToPaths from "./transforms/convertShapesToPaths.js";
import getShapesFromSvg from "./transforms/getShapesFromSvg.js";
import createPathFromShape from "./utils/createPathFromShape.js";
import { JSDOM } from "jsdom";
import transformPathToIsometric from "./transforms/transformPathToIsometric.js";

// Sample pipeline steps (placeholder functions for now)
const pipeline = [
  {
    name: "Original SVG",
    show: true,
    step: ({ svg }) => {
      // Pass through the original SVG
      svg += `<!-- Step: Original SVG -->`;
      return { svg };
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
      svg += `<!-- Step: Split into Shapes -->`;
      return { svg, shapes };
    },
  },
  {
    name: "Convert Shapes to Paths",
    show: true,
    step: async ({ svg, shapes }) => {
      // Parse SVG and convert shapes to paths
      svg = await convertShapesToPaths(svg);

      shapes = shapes.map(({ shape }) => {
        return createPathFromShape(shape);
      });

      svg += `<!-- Step: Convert Shapes to Paths -->`;
      return { svg, shapes };
    },
  },
  {
    name: "Construct Floor and Ceiling",
    show: true,
    step: ({ svg, shapes }) => {
      // Add floor and ceiling logic

      // Loop through each shape
      shapes = shapes.map((shape) => {
        return {
          floor: { shape, z: 0 },
          ceiling: { shape, z: 40 },
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

      // Serialize the SVG document back to a string
      svg = dom.serialize();

      svg += `<!-- Step: Construct Floor and Ceiling -->`;
      return { svg, shapes };
    },
  },
  {
    name: "Transform to Isometric",
    show: true,
    step: ({ svg, shapes }) => {
      // transform the paths in svg string to isometric view

      console.log("");
      console.log("");
      console.log("");
      console.log("BEFORE TRANSFORM");

      shapes.forEach(({ floor, ceiling }) => {
        console.log("floor", floor.shape.outerHTML);
        console.log("ceiling", ceiling.shape.outerHTML);
      });

      // Loop through each shape
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

      console.log("");
      console.log("AFTER TRANSFORM");

      shapes.forEach(({ floor, ceiling }) => {
        console.log("floor", floor.shape.outerHTML);
        console.log("ceiling", ceiling.shape.outerHTML);
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

      // Serialize the SVG document back to a string
      svg = dom.serialize();

      svg += `<!-- Step: Transform to Isometric -->`;
      return { svg, shapes };
    },
  },
  {
    name: "Identify Sharp Turn Points",
    show: false,
    step: (state) => {
      // Placeholder: Add sharp turn point detection
      state.svg += `<!-- Step: Identify Sharp Turn Points -->`;
      return state;
    },
  },
  // Additional steps here...
];

async function transformSvgToIsometric(svg) {
  // Set up initial state
  let state = { svg };

  // Run through each pipeline step
  const steps = [];
  for (const { name, show, step } of pipeline) {
    state = await step(state); // Process step
    steps.push({ name, show, svg: state.svg }); // Add step output
  }

  return { svg, steps };
}

export { transformSvgToIsometric };
