# Changelog

## 2025-01-25

The initial version of the extruder is working with a very limited feature set.

The goal is to take a source "birds-eye" SVG file and extrude it into an isometric projection.

- Rectangular shapes are supported
- Circular shapes are supporten
- Extrusions are all to the same height
- Fill color carries over
- Simple shading is applied to the sides of an extruded object

For development convenience, a set of test source SVGs are provided. Running `npm run dev` will open a demo page in your browser to see the input and output of these test SVGs. It will also watch for changes, regenerate the extruded SVGs, and refresh the browser. Add new test SVGs to `tests/sources` to include them in this process.
