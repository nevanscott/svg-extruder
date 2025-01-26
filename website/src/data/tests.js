/**
 * Gathers tests data from the test runner and returns it as an array of objects.
 *
 * @function
 * @name getTests
 * @returns {Array<Object>} An array of test objects.
 *
 * @typedef {Object} Test
 * @property {string} filename - The name of the test file.
 * @property {Array<Step>} steps - The steps involved in the test.
 *
 * @typedef {Object} Step
 * @property {string} name - The name of the step.
 * @property {StepDetail} step - The details of the step.
 *
 * @typedef {Object} StepDetail
 * @property {string} svg - The SVG content for the step.
 *
 */

import { buildPipelineTests } from "../../../tests/buildPipelineTests.js";

export default async function getTests() {
  const tests = await buildPipelineTests();
  return tests.map((test) => ({
    filename: test.file,
    steps: test.steps,
  }));
}
