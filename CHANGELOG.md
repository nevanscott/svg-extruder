# Changelog

## 2025-01-27

<svg width="143" height="126" viewBox="0 0 143 126" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M24,36 L71,59.5 C84.254833995944,66.127416997972 84.254833995944,76.872583002028 71,83.5 L41,98.5 C27.745166004056003,105.127416997972 6.254833995943997,105.127416997972 -7,98.5 L-54,75 C-67.254833995944,68.372583002028 -67.254833995944,57.627416997972 -54,51 L-24,36 C-10.745166004056003,29.372583002028 10.745166004056003,29.372583002028 24,36 Z" fill="#D50C34"/>
  <path d="M24,16 L71,39.5 C84.254833995944,46.127416997972006 84.254833995944,56.872583002027994 71,63.5 L41,78.5 C27.745166004056003,85.127416997972 6.254833995943997,85.127416997972 -7,78.5 L-54,55 C-67.254833995944,48.372583002027994 -67.254833995944,37.627416997972 -54,31 L-24,16 C-10.745166004056003,9.372583002028001 10.745166004056003,9.372583002028001 24,16 Z" fill="#D50C34"/>
  <path d="M20.200000000000003,75.53999999999999 L12.608000000000004,79.336 L8.968000000000004,77.51599999999999 L2,81 L-8.087999999999994,75.956 L-1.171999999999997,72.446 L-15.991999999999997,65.036 L-9.283999999999999,61.682 L23.215999999999994,55.156 L28.884000000000007,61.11 L2.156000000000006,66.518 L6.524000000000001,68.702 L15.415999999999997,65.452 L24.256,69.872 L16.560000000000002,73.72 L20.200000000000003,75.53999999999999 Z" fill="white"/>
  <path d="M20.200000000000003,55.53999999999999 L12.608000000000004,59.336 L8.968000000000004,57.51599999999999 L2,61 L-8.087999999999994,55.956 L-1.171999999999997,52.446 L-15.991999999999997,45.036 L-9.283999999999999,41.682 L23.215999999999994,35.156 L28.884000000000007,41.11 L2.156000000000006,46.518 L6.524000000000001,48.702 L15.415999999999997,45.452 L24.256,49.872 L16.560000000000002,53.72 L20.200000000000003,55.53999999999999 Z" fill="white"/>
</svg>

After much head-banging and code-wrangling, I've started on a new approach to make things more systematic as this progresses. I'm now using a pipeline process to transform the original SVG in stages, which also allows me to visualize the output and debug at each step.

### Pipeline

The transform process is not broken down into steps, with the following working at the moment:

1. Split into Shapes
2. Convert Shapes to Paths
3. Construct Floor and Ceiling
4. Transform to Isometric

This approach has already borne significant fruit.

### Paths and Curves

For example, the isometric transformation was struggling to handle arcs correctly. So instead, when shapes are converted into paths, now rounded corners, circles, and ellipses are converted into approximated Bézier curves. This approach, in combination with the switch to converting everything to paths, has made the projected isometric output smoother and more predictable.

As a bonus, this means that a wider variety of shapes can now be used.

### Glass Walls

At this stage, the new pipeline doesn't yet add walls, so let's just pretend they are transparent for now.

It's anyone's guess how the roofs are supported.

### Further Reading

While casting about trying to understand what was going on, I came across Peter Collingridge's tutorial on [Isometric Projection](https://www.petercollingridge.co.uk/tutorials/svg/isometric-projection/). While I'm not currently using this approach, it was illuminating nonetheless. (Content warning: mathematics.)

## 2025-01-25

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 134.875 122.325">
  <polygon points="40,10 10,25 10,45 40,30" fill="#cc8400"></polygon>
  <polygon points="10,25 60,50 60,70 10,45" fill="#e59400"></polygon>
  <polygon points="90,35 60,50 60,70 90,55" fill="#cc8400"></polygon>
  <defs>
    <linearGradient id="gradient-100-50" gradientUnits="userSpaceOnUse" x1="55.125" y1="95" x2="124.875" y2="95">
      <stop offset="0%" style="stop-color:#730073;stop-opacity:1"></stop>
      <stop offset="100%" style="stop-color:#660066;stop-opacity:1"></stop>
    </linearGradient>
  </defs>
  <path d="M55.125,75
  A34.875,17.325 0 0,0 124.875,75
  L124.875,95
  A34.875,17.325 0 0,1 55.125,95
  Z" fill="url(#gradient-100-50)"></path>
  <polygon points="40,10 90,35 60,50 10,25" fill="orange"></polygon>
  <ellipse cx="90" cy="75" rx="34.875" ry="17.325" fill="purple"></ellipse>
</svg>

The initial version of the extruder is working with a very limited feature set.

The goal is to take a source "birds-eye" SVG file and extrude it into an isometric projection.

- Rectangular shapes are supported
- Circular shapes are supporten
- Extrusions are all to the same height
- Fill color carries over
- Simple shading is applied to the sides of an extruded object

For development convenience, a set of test source SVGs are provided. Running `npm run dev` will open a demo page in your browser to see the input and output of these test SVGs. It will also watch for changes, regenerate the extruded SVGs, and refresh the browser. Add new test SVGs to `tests/sources` to include them in this process.
