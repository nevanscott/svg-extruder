export default function (eleventyConfig) {
  eleventyConfig.addWatchTarget("./src/**/*.{js}");

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
