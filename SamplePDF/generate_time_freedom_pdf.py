"""
Time Freedom Report - PDF Generator
=====================================
This handles the visual styling/UI of the PDF.
Content is passed in via the `data` parameter.

SETUP: Run once at app startup:
    subprocess.run(['apt-get', 'install', '-y', '-qq', 'fonts-ibm-plex'])

USAGE:
    from generate_time_freedom_pdf import generate_report
    generate_report(data, '/path/to/output.pdf')
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import SimpleDocTemplate, Spacer, PageBreak, Flowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import subprocess
import os


# =============================================================================
# FONT SETUP
# =============================================================================

def ensure_fonts_installed():
    """Install IBM Plex fonts if not present. Call once at app startup."""
    font_path = '/usr/share/fonts/truetype/ibm-plex/IBMPlexSans-Regular.ttf'
    if not os.path.exists(font_path):
        subprocess.run(['apt-get', 'update', '-qq'], check=False, capture_output=True)
        subprocess.run(['apt-get', 'install', '-y', '-qq', 'fonts-ibm-plex'], check=False, capture_output=True)


def register_fonts():
    """Register IBM Plex Sans fonts with reportlab."""
    try:
        pdfmetrics.registerFont(TTFont('PlexRegular', '/usr/share/fonts/truetype/ibm-plex/IBMPlexSans-Regular.ttf'))
        pdfmetrics.registerFont(TTFont('PlexBold', '/usr/share/fonts/truetype/ibm-plex/IBMPlexSans-Bold.ttf'))
        pdfmetrics.registerFont(TTFont('PlexLight', '/usr/share/fonts/truetype/ibm-plex/IBMPlexSans-Light.ttf'))
        return True
    except Exception as e:
        print(f"Font registration failed: {e}, using Helvetica fallback")
        return False


# =============================================================================
# DESIGN TOKENS
# =============================================================================

# Colors
WHITE = HexColor('#FFFFFF')
INK = HexColor('#111827')
INK_SECONDARY = HexColor('#4B5563')
INK_MUTED = HexColor('#9CA3AF')
ACCENT = HexColor('#0D7377')
ACCENT_LIGHT = HexColor('#E6F4F4')
DIVIDER = HexColor('#E5E7EB')
BACKGROUND = HexColor('#F9FAFB')

# Layout
PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.75 * inch
CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN)

# Typography (with fallbacks)
FONT_REGULAR = 'PlexRegular'
FONT_BOLD = 'PlexBold'
FONT_LIGHT = 'PlexLight'


# =============================================================================
# FLOWABLE COMPONENTS
# =============================================================================

class ReportHeader(Flowable):
    """Report header with brand and title."""
    def __init__(self, width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.width = width
        self.height = 80
        
    def draw(self):
        # Brand
        self.canv.setFillColor(ACCENT)
        self.canv.setFont(FONT_BOLD, 10)
        self.canv.drawString(0, self.height - 12, "ASSISTANT LAUNCH")
        
        # Accent line
        self.canv.setStrokeColor(ACCENT)
        self.canv.setLineWidth(2)
        self.canv.line(0, self.height - 20, 100, self.height - 20)
        
        # Title
        self.canv.setFillColor(INK)
        self.canv.setFont(FONT_BOLD, 26)
        self.canv.drawString(0, self.height - 55, "Time Freedom Report")
        
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


class ClientBlock(Flowable):
    """Client name and date."""
    def __init__(self, name, date, width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.name = name
        self.date = date
        self.width = width
        self.height = 55
        
    def draw(self):
        self.canv.setFillColor(INK_MUTED)
        self.canv.setFont(FONT_REGULAR, 10)
        self.canv.drawString(0, self.height - 12, "Prepared for")
        
        self.canv.setFillColor(INK)
        self.canv.setFont(FONT_BOLD, 18)
        self.canv.drawString(0, self.height - 32, self.name)
        
        self.canv.setFillColor(INK_MUTED)
        self.canv.setFont(FONT_REGULAR, 10)
        self.canv.drawString(0, self.height - 50, self.date)
        
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


class HeroMetric(Flowable):
    """Large primary metric."""
    def __init__(self, value, label, width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.value = value
        self.label = label
        self.width = width
        self.height = 95
        
    def draw(self):
        self.canv.setFillColor(INK)
        self.canv.setFont(FONT_BOLD, 56)
        self.canv.drawString(0, 38, self.value)
        
        self.canv.setFillColor(INK_SECONDARY)
        self.canv.setFont(FONT_REGULAR, 12)
        self.canv.drawString(0, 10, self.label)
        
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


class MetricsRow(Flowable):
    """Three metrics in boxes."""
    def __init__(self, metrics, width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.metrics = metrics  # [(value, label), ...]
        self.width = width
        self.height = 85
        self.box_width = (width - 32) / 3
        
    def draw(self):
        x = 0
        for value, label in self.metrics:
            # Box background
            self.canv.setFillColor(ACCENT_LIGHT)
            self.canv.roundRect(x, 0, self.box_width, self.height, 8, fill=1, stroke=0)
            
            # Value
            self.canv.setFillColor(INK)
            self.canv.setFont(FONT_BOLD, 26)
            self.canv.drawCentredString(x + self.box_width/2, 42, value)
            
            # Label
            self.canv.setFillColor(INK_SECONDARY)
            self.canv.setFont(FONT_REGULAR, 10)
            self.canv.drawCentredString(x + self.box_width/2, 18, label)
            
            x += self.box_width + 16
            
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


class AnalysisBlock(Flowable):
    """Text block with left accent bar."""
    def __init__(self, title, text, width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.title = title
        self.text = text
        self.width = width
        self.lines = self._wrap_text(text, 95)  # ~95 chars per line
        self.height = len(self.lines) * 18 + 45
        
    def _wrap_text(self, text, max_chars):
        words = text.split()
        lines, current = [], []
        for word in words:
            if len(' '.join(current + [word])) <= max_chars:
                current.append(word)
            else:
                lines.append(' '.join(current))
                current = [word]
        if current:
            lines.append(' '.join(current))
        return lines
        
    def draw(self):
        # Accent bar
        self.canv.setFillColor(ACCENT)
        self.canv.rect(0, 0, 4, self.height, fill=1, stroke=0)
        
        # Title
        self.canv.setFillColor(INK)
        self.canv.setFont(FONT_BOLD, 11)
        self.canv.drawString(16, self.height - 18, self.title)
        
        # Text
        self.canv.setFillColor(INK_SECONDARY)
        self.canv.setFont(FONT_REGULAR, 11)
        y = self.height - 40
        for line in self.lines:
            self.canv.drawString(16, y, line)
            y -= 18
            
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


class InvestmentBlock(Flowable):
    """ROI breakdown."""
    def __init__(self, value, cost, net, roi, width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.value = value
        self.cost = cost
        self.net = net
        self.roi = roi
        self.width = width
        self.height = 125
        
    def draw(self):
        # Background
        self.canv.setFillColor(BACKGROUND)
        self.canv.roundRect(0, 0, self.width, self.height, 8, fill=1, stroke=0)
        
        # Title
        self.canv.setFillColor(INK_MUTED)
        self.canv.setFont(FONT_BOLD, 9)
        self.canv.drawString(20, self.height - 20, "THE INVESTMENT")
        
        # Rows
        y = self.height - 48
        for label, val in [("Annual value unlocked", self.value), ("EA investment (annual)", f"-{self.cost}")]:
            self.canv.setFillColor(INK_SECONDARY)
            self.canv.setFont(FONT_REGULAR, 12)
            self.canv.drawString(20, y, label)
            self.canv.setFillColor(INK)
            self.canv.setFont(FONT_BOLD, 12)
            self.canv.drawRightString(self.width - 20, y, val)
            y -= 26
        
        # Divider
        self.canv.setStrokeColor(DIVIDER)
        self.canv.setLineWidth(1)
        self.canv.line(20, y + 12, self.width - 20, y + 12)
        
        # Net return
        y -= 8
        self.canv.setFillColor(INK)
        self.canv.setFont(FONT_BOLD, 13)
        self.canv.drawString(20, y, "Net annual return")
        self.canv.setFillColor(ACCENT)
        self.canv.setFont(FONT_BOLD, 16)
        self.canv.drawRightString(self.width - 20, y, self.net)
        
        # ROI badge
        badge_w, badge_x = 55, self.width - 185
        self.canv.setFillColor(ACCENT)
        self.canv.roundRect(badge_x, y - 5, badge_w, 22, 11, fill=1, stroke=0)
        self.canv.setFillColor(WHITE)
        self.canv.setFont(FONT_BOLD, 10)
        self.canv.drawCentredString(badge_x + badge_w/2, y + 1, f"{self.roi}x ROI")
        
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


class SectionTitle(Flowable):
    """Section header."""
    def __init__(self, title, subtitle="", width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.title = title
        self.subtitle = subtitle
        self.width = width
        self.height = 60 if subtitle else 35
        
    def draw(self):
        self.canv.setFillColor(INK)
        self.canv.setFont(FONT_BOLD, 22)
        self.canv.drawString(0, self.height - 22, self.title)
        
        if self.subtitle:
            self.canv.setFillColor(INK_SECONDARY)
            self.canv.setFont(FONT_REGULAR, 11)
            self.canv.drawString(0, self.height - 45, self.subtitle)
            
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


class TaskCard(Flowable):
    """Individual task."""
    def __init__(self, number, name, description, time_saved, width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.number = number
        self.name = name
        self.description = description
        self.time_saved = time_saved
        self.width = width
        self.height = 70
        
    def draw(self):
        # Number circle
        self.canv.setFillColor(ACCENT)
        self.canv.circle(16, self.height - 20, 14, fill=1, stroke=0)
        self.canv.setFillColor(WHITE)
        self.canv.setFont(FONT_BOLD, 12)
        self.canv.drawCentredString(16, self.height - 25, str(self.number))
        
        # Name
        self.canv.setFillColor(INK)
        self.canv.setFont(FONT_BOLD, 13)
        self.canv.drawString(42, self.height - 16, self.name)
        
        # Description
        self.canv.setFillColor(INK_SECONDARY)
        self.canv.setFont(FONT_REGULAR, 10)
        desc = self.description[:90] + "..." if len(self.description) > 90 else self.description
        self.canv.drawString(42, self.height - 35, desc)
        
        # Time saved
        self.canv.setFillColor(INK_MUTED)
        self.canv.setFont(FONT_REGULAR, 9)
        self.canv.drawString(42, self.height - 54, f"Time saved: {self.time_saved}")
        
        # Bottom line
        self.canv.setStrokeColor(DIVIDER)
        self.canv.setLineWidth(0.5)
        self.canv.line(0, 2, self.width, 2)
        
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


class CTABlock(Flowable):
    """Call to action."""
    def __init__(self, width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.width = width
        self.height = 130
        
    def draw(self):
        self.canv.setFillColor(ACCENT_LIGHT)
        self.canv.roundRect(0, 0, self.width, self.height, 12, fill=1, stroke=0)
        
        self.canv.setFillColor(INK)
        self.canv.setFont(FONT_BOLD, 20)
        self.canv.drawCentredString(self.width/2, self.height - 38, "Ready to Get Started?")
        
        # Button
        btn_w, btn_h = 220, 42
        btn_x, btn_y = (self.width - btn_w)/2, 38
        self.canv.setFillColor(ACCENT)
        self.canv.roundRect(btn_x, btn_y, btn_w, btn_h, 21, fill=1, stroke=0)
        self.canv.setFillColor(WHITE)
        self.canv.setFont(FONT_BOLD, 12)
        self.canv.drawCentredString(self.width/2, btn_y + 14, "Schedule Free Consultation")
        
        self.canv.setFillColor(INK_SECONDARY)
        self.canv.setFont(FONT_REGULAR, 10)
        self.canv.drawCentredString(self.width/2, 16, "calendly.com/assistantlaunch/discovery-call")
        
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


class Footer(Flowable):
    """Page footer."""
    def __init__(self, width=CONTENT_WIDTH):
        Flowable.__init__(self)
        self.width = width
        self.height = 28
        
    def draw(self):
        self.canv.setStrokeColor(DIVIDER)
        self.canv.setLineWidth(1)
        self.canv.line(0, self.height - 5, self.width, self.height - 5)
        
        self.canv.setFillColor(INK_MUTED)
        self.canv.setFont(FONT_REGULAR, 9)
        self.canv.drawCentredString(self.width/2, 4, "Assistant Launch  •  assistantlaunch.com")
        
    def wrap(self, availWidth, availHeight):
        return (self.width, self.height)


# =============================================================================
# PAGE BUILDERS
# =============================================================================

def build_summary_page(story, data):
    story.append(ReportHeader())
    story.append(Spacer(1, 8))
    story.append(ClientBlock(data['client_name'], data['date']))
    story.append(Spacer(1, 28))
    story.append(HeroMetric(
        f"${data['annual_value']:,}",
        "Annual value you could unlock by delegating"
    ))
    story.append(Spacer(1, 28))
    story.append(MetricsRow([
        (f"{data['weekly_hours']} hrs", "Reclaimed Weekly"),
        (str(data['total_tasks_ea']), "Tasks to Delegate"),
        (f"{data['roi_multiplier']}x", "Projected ROI"),
    ]))
    story.append(Spacer(1, 28))
    story.append(AnalysisBlock("Summary Analysis", data['analysis_text']))
    story.append(Spacer(1, 22))
    story.append(InvestmentBlock(
        f"${data['annual_value']:,}",
        f"${data['ea_investment']:,}",
        f"${data['net_return']:,}",
        data['roi_multiplier']
    ))


def build_tasks_page(story, data, key, title, subtitle):
    story.append(PageBreak())
    story.append(SectionTitle(title, subtitle))
    story.append(Spacer(1, 12))
    
    for i, task in enumerate(data[key], 1):
        story.append(TaskCard(
            i, 
            task['name'], 
            task['description'],
            task['time_saved']
        ))
        story.append(Spacer(1, 8))


def build_cta_page(story, data):
    story.append(PageBreak())
    story.append(SectionTitle("Next Steps"))
    story.append(Spacer(1, 12))
    story.append(AnalysisBlock(
        "Where to Start",
        "Begin with daily tasks like email and calendar management — they'll give you "
        "immediate time back while you build trust with your EA. Then expand to weekly "
        "and monthly tasks as you develop systems together."
    ))
    story.append(Spacer(1, 30))
    story.append(CTABlock())
    story.append(Spacer(1, 35))
    story.append(Footer())


# =============================================================================
# MAIN GENERATOR
# =============================================================================

def generate_report(data, output_path):
    """
    Generate a Time Freedom Report PDF.
    
    Args:
        data: dict with keys:
            - client_name (str)
            - date (str)
            - annual_value (int)
            - weekly_hours (int)
            - total_tasks_ea (int)
            - ea_investment (int)
            - net_return (int)
            - roi_multiplier (float)
            - analysis_text (str)
            - daily_tasks (list of dicts with: name, description, time_saved)
            - weekly_tasks (list of dicts)
            - monthly_tasks (list of dicts)
        output_path: path to save PDF
    """
    ensure_fonts_installed()
    register_fonts()
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
    )
    
    story = []
    build_summary_page(story, data)
    build_tasks_page(story, data, 'daily_tasks', 'Top 5 Daily Tasks',
                     'High-frequency tasks eating your time every single day')
    build_tasks_page(story, data, 'weekly_tasks', 'Top 5 Weekly Tasks',
                     'Recurring tasks that stack up week after week')
    build_tasks_page(story, data, 'monthly_tasks', 'Top 5 Monthly Tasks',
                     'Administrative work that drains strategic thinking time')
    build_cta_page(story, data)
    
    doc.build(story)
    return output_path
