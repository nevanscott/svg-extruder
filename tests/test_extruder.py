import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from extruder import transform_svg_to_isometric

# Paths to test files
source_dir = "tests/sources"
output_dir = "tests/generated"

# Ensure the output directory exists
os.makedirs(output_dir, exist_ok=True)

# Loop over all SVG files in the source directory
for filename in os.listdir(source_dir):
    if filename.endswith(".svg"):
        input_file = os.path.join(source_dir, filename)
        output_file = os.path.join(output_dir, filename)

        print(f"Processing {input_file} -> {output_file}")
        transform_svg_to_isometric(
            input_file, output_file
        )  # No extrusion_height argument
