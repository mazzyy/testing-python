from reportlab.lib.colors import HexColor

def get_contrast_color(hex_color: str) -> str:
    """Return #ffffff or #1a1a1a depending on background brightness."""
    # Strip hash
    h = hex_color.lstrip('#')
    if len(h) != 6: return '#ffffff'
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    # Convert to brightness, formula: (r*299 + g*587 + b*114) / 1000
    brightness = (r * 299 + g * 587 + b * 114) / 1000
    return '#1a1a1a' if brightness > 128 else '#ffffff'

print("Dark bg (#2c3e50):", get_contrast_color("#2c3e50"))
print("Light bg (#f3f4f6):", get_contrast_color("#f3f4f6"))
