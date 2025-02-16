export default function (eleventyConfig) {
  // JavaScript bundle passthrough
  eleventyConfig.addPassthroughCopy({
    "./dist/transform.js": "assets/transform.js",
  });

  // CSS processing
  eleventyConfig.addPassthroughCopy({
    "./dist/main.css": "assets/css/main.css",
  });

  // Emulate Passthrough Copy During --serve
  eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

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
