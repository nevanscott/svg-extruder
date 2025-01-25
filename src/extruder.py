import xml.etree.ElementTree as ET
import colorsys

__all__ = [
    "transform_to_isometric",
    "extrude_rectangle",
    "extrude_circle",
    "create_polygon_element",
    "create_circle_element",
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


def darken_color(hex_color, factor=0.7):
    """
    Darkens a hex color by a given factor.
    """
    if hex_color == "none" or not hex_color.startswith("#"):
        return hex_color  # Return the original color for non-hex or "none" values

    hex_color = hex_color.lstrip("#")
    rgb = tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))
    h, l, s = colorsys.rgb_to_hls(*[x / 255.0 for x in rgb])
    l = max(0, l * factor)
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return f"#{int(r * 255):02x}{int(g * 255):02x}{int(b * 255):02x}"


def extrude_rectangle(rect, extrusion_height=20):
    """
    Extrudes a rectangle into an isometric view, adding height downward.
    """
    x = float(rect.get("x", 0))
    y = float(rect.get("y", 0))
    width = float(rect.get("width", 0))
    height = float(rect.get("height", 0))

    # Extract the fill color from the rectangle
    fill_color = rect.get("fill", "none")

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

    # Build the faces of the extruded block in proper drawing order
    faces = {
        "top": [iso_top_left, iso_top_right, iso_bottom_right, iso_bottom_left],
        "left": [
            iso_top_left,
            iso_bottom_left,
            iso_bottom_left_extruded,
            iso_top_left_extruded,
        ],
        "front": [
            iso_bottom_left,
            iso_bottom_right,
            iso_bottom_right_extruded,
            iso_bottom_left_extruded,
        ],
        "right": [
            iso_top_right,
            iso_bottom_right,
            iso_bottom_right_extruded,
            iso_top_right_extruded,
        ],
    }

    return faces, fill_color


def extrude_circle(circle, extrusion_height=20):
    """
    Extrudes a circle into an isometric view, creating a single path for the side face.
    """
    cx = float(circle.get("cx", 0))
    cy = float(circle.get("cy", 0))
    r = float(circle.get("r", 0))

    # Extract the fill color from the circle
    fill_color = circle.get("fill", "none")

    # Transform key points for the top and bottom arcs
    start_top = transform_to_isometric(cx - r, cy)
    end_top = transform_to_isometric(cx + r, cy)
    start_bottom = transform_to_isometric(cx - r, cy, z=extrusion_height)
    end_bottom = transform_to_isometric(cx + r, cy, z=extrusion_height)

    # Debug: Log transformed points for verification
    print(f"start_top: {start_top}, end_top: {end_top}")
    print(f"start_bottom: {start_bottom}, end_bottom: {end_bottom}")

    # Build the path for the side face
    side_path = (
        f"M {start_top[0]},{start_top[1]} "  # Move to start of top arc
        f"A {r},{r * 0.5} 0 1,0 {end_top[0]},{end_top[1]} "  # Top arc (adjusted flags)
        f"L {end_bottom[0]},{end_bottom[1]} "  # Line to end of bottom arc
        f"A {r},{r * 0.5} 0 1,1 {start_bottom[0]},{start_bottom[1]} "  # Bottom arc (adjusted flags)
        f"Z"  # Close the path
    )

    # Debug: Print the side path for verification
    print(f"Generated side_path: {side_path}")

    # Return the top face and side path
    return {
        "top": (transform_to_isometric(cx, cy), r, r * 0.5),
        "side_path": side_path,
    }, fill_color


def create_polygon_element(points, fill="gray", stroke="black"):
    """
    Create an SVG polygon element from a list of points.
    """
    points_str = " ".join(f"{x},{y}" for x, y in points)
    polygon = ET.Element(
        "polygon", attrib={"points": points_str, "fill": fill, "stroke": stroke}
    )
    return polygon


def create_circle_element(center, radius_x, radius_y, fill="gray", stroke="black"):
    """
    Create an SVG ellipse element from a center point and radii (approximation for circles).
    """
    cx, cy = center
    ellipse = ET.Element(
        "ellipse",
        attrib={
            "cx": str(cx),
            "cy": str(cy),
            "rx": str(radius_x),
            "ry": str(radius_y),
            "fill": fill,
            "stroke": stroke,
        },
    )
    return ellipse


def calculate_viewport(elements, padding=10):
    """
    Calculate the bounding box for the transformed elements to adjust the SVG viewport,
    including optional padding.
    """
    min_x = float("inf")
    min_y = float("inf")
    max_x = float("-inf")
    max_y = float("-inf")

    for element in elements:
        if isinstance(element, list):  # For polygons or point lists
            for x, y in element:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
        elif isinstance(element, tuple):  # For ellipses (center, rx, ry)
            center, rx, ry = element
            cx, cy = center
            min_x = min(min_x, cx - rx)
            min_y = min(min_y, cy - ry)
            max_x = max(max_x, cx + rx)
            max_y = max(max_y, cy + ry)

    width = max_x - min_x + 2 * padding
    height = max_y - min_y + 2 * padding

    return min_x - padding, min_y - padding, width, height


def transform_svg_to_isometric(input_file, output_file, extrusion_height=20):
    """
    Read an SVG file, transform rectangles and circles into isometric views with extrusion, and save the output.
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
        if element.tag.endswith("rect"):  # Handle rectangles
            faces, fill_color = extrude_rectangle(
                element, extrusion_height=-extrusion_height
            )

            # Add faces in the correct drawing order
            for face_name in ["left", "front", "right", "top"]:
                face_fill = (
                    darken_color(fill_color, factor=0.8)
                    if face_name != "top"
                    else fill_color
                )
                polygon_element = create_polygon_element(
                    faces[face_name], fill=face_fill
                )
                new_svg.append(polygon_element)

            # Collect all points for viewport calculation
            transformed_elements.extend(faces.values())

        elif element.tag.endswith("circle"):  # Handle circles
            faces, fill_color = extrude_circle(
                element, extrusion_height=-extrusion_height
            )

            # Add top face (ellipse)
            top_center, radius_x, radius_y = faces["top"]
            ellipse_element = create_circle_element(
                top_center, radius_x, radius_y, fill=fill_color
            )
            new_svg.append(ellipse_element)

            # Add side face (path)
            side_fill = darken_color(fill_color, factor=0.8)
            side_path_element = ET.Element(
                "path",
                attrib={"d": faces["side_path"], "fill": side_fill, "stroke": "black"},
            )
            new_svg.append(side_path_element)

    # Adjust the SVG viewport based on the transformed elements
    min_x, min_y, width, height = calculate_viewport(transformed_elements, padding=10)
    new_svg.set("viewBox", f"{min_x} {min_y} {width} {height}")

    # Write the output SVG
    output_tree = ET.ElementTree(new_svg)
    output_tree.write(output_file)
    print(f"Isometric transformed SVG with extrusion written to: {output_file}")
