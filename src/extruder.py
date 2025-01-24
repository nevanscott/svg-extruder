import xml.etree.ElementTree as ET

__all__ = [
    "transform_to_isometric",
    "extrude_rectangle",
    "create_polygon_element",
    "calculate_viewport",
    "transform_svg_to_isometric",
]


def transform_to_isometric(x, y, z=0):
    """
    Apply a proper isometric transformation to 2D coordinates with optional height.
    """
    iso_x = x - y
    iso_y = (x + y) * 0.5 - z  # Ensure downward movement by subtracting z
    return iso_x, iso_y


def extrude_rectangle(rect, extrusion_height=20):
    """
    Extrudes a rectangle into an isometric view, adding height downward.
    """
    x = float(rect.get("x", 0))
    y = float(rect.get("y", 0))
    width = float(rect.get("width", 0))
    height = float(rect.get("height", 0))

    # Compute original rectangle corners (top-down view)
    top_left = (x, y)
    top_right = (x + width, y)
    bottom_left = (x, y + height)
    bottom_right = (x + width, y + height)

    # Transform corners to isometric view (top face)
    iso_top_left = transform_to_isometric(*top_left)
    iso_top_right = transform_to_isometric(*top_right)
    iso_bottom_left = transform_to_isometric(*bottom_left)
    iso_bottom_right = transform_to_isometric(*bottom_right)

    # Transform corners for the extruded bottom face (downward)
    iso_top_left_extruded = transform_to_isometric(*top_left, z=extrusion_height)
    iso_top_right_extruded = transform_to_isometric(*top_right, z=extrusion_height)
    iso_bottom_left_extruded = transform_to_isometric(*bottom_left, z=extrusion_height)
    iso_bottom_right_extruded = transform_to_isometric(
        *bottom_right, z=extrusion_height
    )

    # Debugging: Log the computed points
    print("Top face:", [iso_top_left, iso_top_right, iso_bottom_right, iso_bottom_left])
    print(
        "Bottom face:",
        [
            iso_top_left_extruded,
            iso_top_right_extruded,
            iso_bottom_right_extruded,
            iso_bottom_left_extruded,
        ],
    )

    # Build the faces of the extruded block in proper drawing order
    faces = {
        "top": [iso_top_left, iso_top_right, iso_bottom_right, iso_bottom_left],
        "front": [
            iso_bottom_left,
            iso_bottom_right,
            iso_bottom_right_extruded,
            iso_bottom_left_extruded,
        ],
        "left": [
            iso_top_left,
            iso_bottom_left,
            iso_bottom_left_extruded,
            iso_top_left_extruded,
        ],
        "right": [
            iso_top_right,
            iso_bottom_right,
            iso_bottom_right_extruded,
            iso_top_right_extruded,
        ],
    }

    return faces


def create_polygon_element(points, fill="gray", stroke="black"):
    """
    Create an SVG polygon element from a list of points.
    """
    points_str = " ".join(f"{x},{y}" for x, y in points)
    polygon = ET.Element(
        "polygon", attrib={"points": points_str, "fill": fill, "stroke": stroke}
    )
    return polygon


def calculate_viewport(elements, padding=10):
    """
    Calculate the bounding box for the transformed elements to adjust the SVG viewport,
    including optional padding.
    """
    min_x = float("inf")
    min_y = float("inf")
    max_x = float("-inf")
    max_y = float("-inf")

    for points in elements:
        for x, y in points:
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

    width = max_x - min_x + 2 * padding
    height = max_y - min_y + 2 * padding

    return min_x - padding, min_y - padding, width, height


def transform_svg_to_isometric(input_file, output_file, extrusion_height=20):
    """
    Read an SVG file, transform rectangles into isometric views with extrusion, and save the output.
    """
    # Parse the input SVG
    tree = ET.parse(input_file)
    root = tree.getroot()

    # Store transformed elements to calculate viewport later
    transformed_elements = []

    # Create a new SVG root for the output
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    new_svg = ET.Element(
        "svg",
        attrib={"xmlns": "http://www.w3.org/2000/svg", "width": "200", "height": "200"},
    )

    for element in root:
        if element.tag.endswith("rect"):  # Handle rectangles only
            faces = extrude_rectangle(
                element, extrusion_height=-extrusion_height
            )  # Correct extrusion downward

            # Add faces in the correct drawing order
            for face_name in ["left", "front", "right", "top"]:
                polygon_element = create_polygon_element(faces[face_name])
                new_svg.append(polygon_element)

            # Collect all points for viewport calculation
            transformed_elements.extend(faces.values())

    # Adjust the SVG viewport based on the transformed elements
    min_x, min_y, width, height = calculate_viewport(transformed_elements, padding=10)
    new_svg.set("viewBox", f"{min_x} {min_y} {width} {height}")

    # Write the output SVG
    output_tree = ET.ElementTree(new_svg)
    output_tree.write(output_file)
    print(f"Isometric transformed SVG with extrusion written to: {output_file}")
