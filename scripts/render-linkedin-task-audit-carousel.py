from pathlib import Path

from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "linkedin-ai-task-audit-carousel.pdf"
WIDTH, HEIGHT = 1080, 1350

INK = HexColor("#10100F")
CREAM = HexColor("#FFF8E7")
HONEY = HexColor("#F5A41F")
AMBER = HexColor("#B86B00")
MUTED = HexColor("#CFC7B7")
GREEN = HexColor("#7CD6A4")


def wrap_text(text, font, size, max_width):
    lines = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        current = ""
        for word in words:
            candidate = word if not current else f"{current} {word}"
            if stringWidth(candidate, font, size) <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
    return lines


def text_block(c, text, x, y, max_width, font="Helvetica", size=42,
               leading=None, color=CREAM, max_lines=None):
    leading = leading or size * 1.2
    lines = wrap_text(text, font, size, max_width)
    if max_lines:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def frame(c, page, section):
    c.setFillColor(INK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
    c.setFillColor(HexColor("#261E12"))
    c.circle(1040, 1260, 270, fill=1, stroke=0)
    c.setFillColor(HexColor("#211710"))
    c.circle(20, 35, 210, fill=1, stroke=0)
    c.setStrokeColor(AMBER)
    c.setLineWidth(2)
    c.roundRect(70, 70, WIDTH - 140, HEIGHT - 140, 38, fill=0, stroke=1)
    c.setFillColor(HONEY)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(110, 1230, f"LULIDIGITAL  /  {section.upper()}")
    c.setFont("Helvetica", 18)
    c.setFillColor(MUTED)
    c.drawRightString(970, 1232, f"{page:02d} / 08")
    c.setStrokeColor(HexColor("#72521C"))
    c.line(110, 155, 970, 155)
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(CREAM)
    c.drawString(110, 105, "LuliDigital")
    c.setFont("Helvetica", 17)
    c.setFillColor(MUTED)
    c.drawRightString(970, 108, "AI  ·  MARKETING  ·  OPERATIONS")


def headline(c, text, y=1080, size=66, color=CREAM):
    return text_block(c, text, 110, y, 830, "Helvetica-Bold", size, size * 1.08, color)


def label(c, text, x, y, color=HONEY):
    c.setFillColor(color)
    c.roundRect(x, y - 12, stringWidth(text, "Helvetica-Bold", 18) + 32, 42, 18, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(x + 16, y, text)


def draw_bullet(c, number, title, body, y):
    c.setFillColor(HONEY)
    c.circle(140, y + 6, 27, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(140, y - 2, str(number))
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 29)
    c.drawString(190, y, title)
    text_block(c, body, 190, y - 45, 700, "Helvetica", 25, 33, MUTED)


def render():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(WIDTH, HEIGHT), pageCompression=1)
    c.setTitle("The 5-minute AI task audit")
    c.setAuthor("LuliDigital")

    frame(c, 1, "A founder's AI audit")
    label(c, "SAVE THIS", 110, 1140)
    y = headline(c, "I stopped asking, “What can AI do?”", 1040, 72)
    text_block(c, "I started asking:", 110, y - 55, 820, "Helvetica", 34, 42, MUTED)
    text_block(c, "Where is work waiting for a decision?", 110, y - 130, 820,
               "Helvetica-Bold", 52, 60, HONEY)
    text_block(c, "That question finds better automation opportunities than any list of tools.",
               110, 390, 790, "Helvetica", 30, 40, CREAM)
    c.showPage()

    frame(c, 2, "The real bottleneck")
    y = headline(c, "The task is rarely the bottleneck.", 1080, 66)
    text_block(c, "The decision before it is.", 110, y - 30, 830,
               "Helvetica-Bold", 58, 66, HONEY)
    draw_bullet(c, 1, "Replying", "Waiting for someone to decide which lead matters.", 690)
    draw_bullet(c, 2, "Scheduling", "Waiting for someone to choose the next open slot.", 515)
    draw_bullet(c, 3, "Reporting", "Waiting for someone to decide what needs attention.", 340)
    c.showPage()

    frame(c, 3, "The five-minute audit")
    headline(c, "Open your calendar from last week.", 1080, 62)
    text_block(c, "Circle every task that made you pause to choose, approve, route, chase, or check.",
               110, 840, 820, "Helvetica", 35, 48, CREAM)
    c.setFillColor(HexColor("#1B1812"))
    c.roundRect(110, 390, 860, 300, 28, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 31)
    c.setFillColor(HONEY)
    c.drawString(155, 620, "Do not count minutes yet.")
    text_block(c, "Count how often work had to wait for you.", 155, 545, 735,
               "Helvetica-Bold", 45, 54, CREAM)
    text_block(c, "That waiting is the automation brief.", 155, 420, 735,
               "Helvetica", 28, 38, MUTED)
    c.showPage()

    frame(c, 4, "Question one")
    label(c, "FIND THE REPEAT", 110, 1140)
    headline(c, "What happens at least three times a week?", 1020, 67)
    text_block(c, "Repetition creates enough volume to make a small system worthwhile.",
               110, 650, 800, "Helvetica", 32, 43, CREAM)
    text_block(c, "Examples: qualifying enquiries, triaging an inbox, updating a tracker, chasing missing information.",
               110, 485, 820, "Helvetica", 27, 38, MUTED)
    c.showPage()

    frame(c, 5, "Question two")
    label(c, "FIND THE RULE", 110, 1140)
    headline(c, "What do you already decide the same way?", 1020, 67)
    text_block(c, "If you can explain the decision in a short checklist, a system can usually support it.",
               110, 650, 820, "Helvetica", 32, 43, CREAM)
    text_block(c, "No stable rule yet? Document the judgment before automating it.",
               110, 470, 820, "Helvetica-Bold", 31, 42, HONEY)
    c.showPage()

    frame(c, 6, "Question three")
    label(c, "FIND THE BOUNDARY", 110, 1140)
    headline(c, "What must stay human?", 1020, 70)
    c.setFillColor(HexColor("#18231D"))
    c.roundRect(110, 565, 400, 270, 26, fill=1, stroke=0)
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 29)
    c.drawString(150, 770, "KEEP HUMAN")
    text_block(c, "Ambiguity\nReputation\nSensitive money decisions", 150, 700, 310,
               "Helvetica", 26, 40, CREAM)
    c.setFillColor(HexColor("#251D11"))
    c.roundRect(550, 565, 420, 270, 26, fill=1, stroke=0)
    c.setFillColor(HONEY)
    c.setFont("Helvetica-Bold", 29)
    c.drawString(590, 770, "SYSTEMISE")
    text_block(c, "Sorting\nReminders\nRouting and preparation", 590, 700, 330,
               "Helvetica", 26, 40, CREAM)
    text_block(c, "Good automation protects judgment. It does not pretend judgment is unnecessary.",
               110, 420, 820, "Helvetica-Bold", 31, 43, CREAM)
    c.showPage()

    frame(c, 7, "Choose what goes first")
    headline(c, "Score each bottleneck from 1 to 5.", 1080, 62)
    draw_bullet(c, 1, "Frequency", "How often does it happen?", 760)
    draw_bullet(c, 2, "Rule clarity", "How consistently can the decision be made?", 585)
    draw_bullet(c, 3, "Cost of delay", "What happens while the work waits?", 410)
    text_block(c, "Start with the highest total, not the most impressive technology.",
               110, 255, 820, "Helvetica-Bold", 29, 38, HONEY)
    c.showPage()

    frame(c, 8, "The takeaway")
    y = headline(c, "Do not automate the work first.", 1050, 66)
    text_block(c, "Automate the waiting around it.", 110, y - 40, 830,
               "Helvetica-Bold", 60, 68, HONEY)
    text_block(c, "That is usually where time, momentum, and follow-through disappear.",
               110, 585, 810, "Helvetica", 31, 43, CREAM)
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(110, 350, "What recurring decision would you remove first?")
    text_block(c, "Save the audit. Run it against last week's calendar.", 110, 285, 800,
               "Helvetica", 25, 34, MUTED)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    render()
