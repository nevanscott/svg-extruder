import paper from "paper";
import { PaperOffset } from "paperjs-offset";
import {
  parseSvg,
  serializeSvg,
  createSvgElement,
} from "../utils/environment.js";

export default async ({ svg, svgDebug, shapes }) => {
  // Parse the SVG into a DOM structure
  const { doc, svgElement } = parseSvg(svg);

  // Set up Paper.js
  paper.setup(new paper.Size(100, 100));

  shapes = shapes.map((shape, index) => {
    try {
      const pathD = shape.path?.getAttribute("d");
      const strokeWidth = parseFloat(
        shape.rawElement.getAttribute("stroke-width") || 0
      );
      const strokeColor = shape.rawElement.getAttribute("stroke");
      const fillColor = shape.rawElement.getAttribute("fill");

      // Only process shapes with a stroke, no fill, and a stroke width
      if (
        strokeWidth > 0 &&
        strokeColor &&
        (!fillColor || fillColor === "none")
      ) {
        const paperPath = new paper.Path(pathD);

        // Use PaperOffset to create the stroke outline
        const outlinedPath = PaperOffset.offsetStroke(
          paperPath,
          strokeWidth / 2,
          {
            insert: false,
          }
        );

        let pathData = "";

        // Handle outlined paths (single or compound)
        if (outlinedPath instanceof paper.Path) {
          pathData = outlinedPath.pathData;
        } else if (outlinedPath.children && outlinedPath.children.length > 0) {
          pathData = outlinedPath.children
            .map((child) => child.pathData)
            .join(" ");
        } else {
          return shape; // Skip this shape if the outline failed
        }

        if (!pathData || pathData.trim() === "") {
          return shape; // Skip if pathData is empty
        }

        // Create a new SVG path element with the outlined path
        const newPathElement = createSvgElement(doc, "path", {
          d: pathData,
          fill: strokeColor, // The stroke color becomes the fill
          stroke: "none", // Remove the stroke
        });

        // Update the shape model
        return {
          ...shape,
          path: newPathElement, // Updated path element with outlines
          fillColor: strokeColor, // Update fill color to the stroke color
        };
      }

      // Skip shapes that don’t meet the criteria
      return shape;
    } catch (error) {
      console.error(`Error processing shape ${index + 1}:`, error);
      return shape; // Skip this shape and move on
    }
  });

  // ✅ Create a new debug SVG
  const { doc: debugDoc, svgElement: debugSvgElement } = parseSvg(
    `<!DOCTYPE html><svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgElement.getAttribute(
      "viewBox"
    )}" width="${svgElement.getAttribute(
      "width"
    )}" height="${svgElement.getAttribute("height")}"></svg>`
  );

  // ✅ Append updated shapes for debugging
  shapes.forEach((shape, index) => {
    try {
      const debugPath = createSvgElement(debugDoc, "path", {
        d: shape.path?.getAttribute("d") || "",
        fill: shape.path?.getAttribute("fill") || "none",
        stroke: "red",
        "stroke-width": "1",
      });

      debugSvgElement.appendChild(debugPath);
    } catch (error) {
      console.error(`Error adding shape ${index + 1} to debug SVG:`, error);
    }
  });

  // Serialize debug SVG
  svgDebug = serializeSvg(debugDoc);

  return { svg, svgDebug, shapes };
};
