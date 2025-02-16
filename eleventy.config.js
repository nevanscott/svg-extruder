export default function (eleventyConfig) {
  eleventyConfig.addWatchTarget("./src/**/*.{js}");

  // Pass through the JavaScript file (transformSvgToIsometric.js)
  eleventyConfig.addPassthroughCopy("src/content/assets/transform.js");

  // Specify directories for Eleventy to read from
  return {
    dir: {
      input: "website/src/content",
      data: "../data",
      layouts: "../layouts",
      output: "website/_site",
    },
  };
}
