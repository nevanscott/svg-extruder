/**
 * Gathers demos data from the test runner and returns it as an array of objects.
 *
 * @returns {Array<Object>} An array of demo objects.
 *
 * Each demo object contains:
 * @property {string} filename - The filename of the demo.
 * @property {Object} input - The input data containing:
 * @property {string} input.svg - The input SVG content.
 * @property {Object} output - The output data containing:
 * @property {string} output.svg - The output SVG content.
 */

import { buildTestDemos } from "../../../tests/buildTestDemos.js";

export default async function () {
  const { processedFiles } = await buildTestDemos();
  return processedFiles.map((file) => ({
    filename: file.filename,
    input: {
      svg: file.originalSvg,
    },
    output: {
      svg: file.transformedSvg,
    },
  }));
}
