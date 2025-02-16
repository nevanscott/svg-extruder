export default function (eleventyConfig) {
  // Watch for changes in JavaScript files
  eleventyConfig.addWatchTarget("./website/src/**/*.{js}");

  // Watch CSS files for changes
  eleventyConfig.addWatchTarget("./website/src/assets/css/");

  // JavaScript bundle passthrough
  eleventyConfig.addPassthroughCopy({
    "./dist/transform.js": "assets/transform.js",
  });

  // CSS processing
  eleventyConfig.addPassthroughCopy({
    "./dist/main.css": "assets/css/main.css",
  });

  // Specify directories for Eleventy to read from
  return {
    dir: {
      input: "website/src/content",
      data: "../data",
      layouts: "../layouts",
      includes: "../partials",
      output: "website/_site",
    },
  };
}
