import postcssImport from "postcss-import";
import postcssNested from "postcss-nested";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

export default {
  plugins: [
    postcssImport(), // Handles @import statements
    postcssNested(), // Handles nested CSS
    autoprefixer(), // Adds vendor prefixes
    ...(process.env.NODE_ENV === "production" ? [cssnano()] : []), // Minifies CSS in production
  ],
};
