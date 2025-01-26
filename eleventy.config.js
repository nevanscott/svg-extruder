export default function (eleventyConfig) {
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
