import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["./src/transformSvgToIsometric.js"], // Path to your function file
    outfile: "./dist/transform.js", // Path where the bundled file will be saved
    bundle: true, // Bundle all dependencies into one file
    minify: true, // Minify the output for smaller file size
    platform: "browser", // Target browser environment
    format: "esm", // Use ES module format
    target: ["es6"], // Target modern JavaScript
    external: ["jsdom"], // Exclude jsdom from the browser build
  })
  .then(() => {
    console.log("Bundle built successfully!");
  })
  .catch((error) => {
    console.error("Error during build:", error);
    process.exit(1);
  });
