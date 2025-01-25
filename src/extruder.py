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


def extrude_rectangle(rect):
    """
    Transform a rectangle into an isometric top face.
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

    # Build the top face of the rectangle
    faces = {"top": [iso_top_left, iso_top_right, iso_bottom_right, iso_bottom_left]}

    return faces, fill_color


def extrude_circle(circle):
    """
    Transform a circle into an isometric top face.
    """
    cx = float(circle.get("cx", 0))
    cy = float(circle.get("cy", 0))
    r = float(circle.get("r", 0))

    # Extract the fill color from the circle
    fill_color = circle.get("fill", "none")

    # Transform the center and radius of the circle
    center = transform_to_isometric(cx, cy)
    radius_x = r
    radius_y = r * 0.5  # Adjust for isometric scaling

    return center, radius_x, radius_y, fill_color


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


def transform_svg_to_isometric(input_file, output_file):
    """
    Read an SVG file, transform rectangles and circles into isometric top views, and save the output.
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
            faces, fill_color = extrude_rectangle(element)

            # Add top face
            polygon_element = create_polygon_element(faces["top"], fill=fill_color)
            new_svg.append(polygon_element)

            # Collect all points for viewport calculation
            transformed_elements.extend(faces.values())

        elif element.tag.endswith("circle"):  # Handle circles
            center, radius_x, radius_y, fill_color = extrude_circle(element)

            # Add top face
            ellipse_element = create_circle_element(
                center, radius_x, radius_y, fill=fill_color
            )
            new_svg.append(ellipse_element)

            # Collect the center point for viewport calculation
            transformed_elements.append((center, radius_x, radius_y))

    # Adjust the SVG viewport based on the transformed elements
    min_x, min_y, width, height = calculate_viewport(transformed_elements, padding=10)
    new_svg.set("viewBox", f"{min_x} {min_y} {width} {height}")

    # Write the output SVG
    output_tree = ET.ElementTree(new_svg)
    output_tree.write(output_file)
    print(f"Isometric transformed SVG written to: {output_file}")
