import postcss from "postcss";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import postcssImport from "postcss-import";
import postcssNested from "postcss-nested";

export default function (eleventyConfig) {
  // Watch for changes in JavaScript files
  eleventyConfig.addWatchTarget("./website/src/**/*.{js}");

  // Watch CSS files for changes
  eleventyConfig.addWatchTarget("./website/src/assets/css/");

  // Pass through the JavaScript file (transformSvgToIsometric.js)
  eleventyConfig.addPassthroughCopy("dist/transform.js");

  // Copy the processed CSS to the output directory
  eleventyConfig.addPassthroughCopy({
    "./website/src/assets/css/": "assets/css/",
  });

  // Add PostCSS transform for CSS files
  eleventyConfig.addTransform("postcss", async (content, outputPath) => {
    if (outputPath && outputPath.endsWith(".css")) {
      const result = await postcss([
        postcssImport, // Import CSS files
        postcssNested, // Enable nested selectors
        autoprefixer, // Add vendor prefixes
        ...(process.env.NODE_ENV === "production" ? [cssnano] : []), // Minify CSS in production
      ]).process(content, { from: outputPath });

      return result.css;
    }
    return content;
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
