import pdfplumber, textwrap
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch

src = "Arithmetic Operators.pdf"                 # input
out = "Arithmetic_Operators_text_sideways.pdf"   # output

# Output page is portrait, but we rotate the text 90 degrees
W, H = letter  # (612, 792) points
font_name = "Helvetica"
font_size = 10
leading = 12
margin = 0.6 * inch

# After rotating 90 degrees, the usable "text area" is swapped
rot_W = H
rot_H = W

def wrap_lines_preserving_blank_lines(text: str, max_chars: int):
    lines = []
    for raw in text.splitlines():
        if not raw.strip():
            lines.append("")
            continue
        raw = " ".join(raw.split())  # normalize whitespace
        lines.extend(textwrap.wrap(raw, width=max_chars))
    return lines

with pdfplumber.open(src) as pdf:
    c = canvas.Canvas(out, pagesize=letter)

    for page_num, page in enumerate(pdf.pages, start=1):
        txt = (page.extract_text() or "").replace("\t", " ").strip()

        header = f"Arithmetic Operators (extracted text) — page {page_num}"
        # estimate characters per line (rough but works well for quick print handouts)
        usable_width = rot_W - 2 * margin
        max_chars = max(20, int(usable_width / (font_size * 0.55)))

        lines = [header, "-" * len(header), ""] + wrap_lines_preserving_blank_lines(txt, max_chars)

        idx = 0
        while idx < len(lines):
            # Start a new output page (portrait), rotate the coordinate system, then draw text normally
            c.saveState()
            c.translate(W, 0)
            c.rotate(90)
            c.setFont(font_name, font_size)

            x = margin
            y = rot_H - margin

            max_lines = int((rot_H - 2 * margin) / leading)
            chunk = lines[idx: idx + max_lines]

            for line in chunk:
                c.drawString(x, y, line)
                y -= leading

            c.restoreState()
            c.showPage()
            idx += max_lines

    c.save()

print(f"Created: {out}")
