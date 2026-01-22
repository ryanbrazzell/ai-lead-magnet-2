# Time Freedom Report - PDF UI Update

## What This Is

This is a **visual redesign** of the PDF output. Your existing prompt generates the content (client name, tasks, analysis, etc.) — this code handles how it looks.

---

## Quick Integration

### 1. Install Font (run once at app startup)

```python
import subprocess
subprocess.run(['apt-get', 'install', '-y', '-qq', 'fonts-ibm-plex'], check=False)
```

### 2. Replace Your PDF Generation

Replace your current PDF generation code with `generate_time_freedom_pdf.py`. The function signature is:

```python
from generate_time_freedom_pdf import generate_report

generate_report(data, '/path/to/output.pdf')
```

---

## Data Structure Expected

Your content generation should output this structure:

```python
data = {
    # Client info
    'client_name': str,       # "Ryan Brazzell"
    'date': str,              # "December 8, 2025"
    
    # Metrics
    'annual_value': int,      # 109200 (formatted as $109,200)
    'weekly_hours': int,      # 21
    'total_tasks_ea': int,    # 15
    'ea_investment': int,     # 33000
    'net_return': int,        # 76200
    'roi_multiplier': float,  # 3.3
    
    # Analysis paragraph
    'analysis_text': str,     # 2-4 sentences summarizing the opportunity
    
    # Tasks (5 per category)
    'daily_tasks': [
        {
            'name': str,         # "Email & Inbox Management"
            'description': str,  # One sentence, truncated at 90 chars in display
            'time_saved': str,   # "2+ hrs/day"
        },
        # ... 4 more
    ],
    'weekly_tasks': [...],    # Same structure
    'monthly_tasks': [...],   # Same structure
}
```

---

## If Your Data Structure Differs

Add a transformation layer before calling generate_report:

```python
def transform_to_pdf_format(your_data):
    """Convert your existing data structure to PDF format."""
    return {
        'client_name': your_data['name'],
        'date': your_data['report_date'],
        'annual_value': your_data['total_value'],
        # ... map your fields to the expected structure
    }

pdf_data = transform_to_pdf_format(your_existing_data)
generate_report(pdf_data, output_path)
```

---

## Page Structure (5 pages)

1. **Summary** — Header, client info, hero metric ($X), 3-box metrics, analysis paragraph, investment breakdown
2. **Daily Tasks** — Section title + 5 numbered task cards
3. **Weekly Tasks** — Section title + 5 numbered task cards
4. **Monthly Tasks** — Section title + 5 numbered task cards
5. **CTA** — Next steps + call to action button

---

## Design Details

**Font:** IBM Plex Sans (installed via apt-get)

**Colors:**
- `#0D7377` — Accent (teal)
- `#111827` — Primary text
- `#4B5563` — Secondary text

**No difficulty badges** — removed as requested

---

## Files

- `generate_time_freedom_pdf.py` — The PDF generator code
- `final_report.pdf` — Sample output

---

## No Changes Needed To Your Content Prompt

Your existing prompt that generates the tasks, analysis, and metrics stays the same. This only replaces the PDF rendering layer.
