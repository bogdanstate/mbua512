- Use ~/canvas-utils virtualenv for Python scripts: ~/canvas-utils/bin/python3
- For worldfootballR: prefer R scripts and use pre-scraped data (load_* functions) instead of live scraping to avoid rate limits
- Always use Docker for data processing: docker run --rm -v "$(pwd)/r-scripts:/scripts:ro" -v "$(pwd)/data:/data" -w /scripts mbua512-worldfootballr:latest
- NEVER hardcode data: Always write scripts to process data from existing datasets. Read from CSV/JSON files and transform programmatically rather than manually copying data into scripts.

## MBUA512 Presentation Guidelines
- **NEVER add extra content to slides unless explicitly requested**: Only create what the user asks for. Don't add subtitles, descriptions, navigation hints, or "coming soon" placeholders without explicit request.
- **Title slides should be minimal**: Only the title and course name (MBUA 512) unless the user specifies otherwise.
- **Always credit Unsplash images**: When using background images from Unsplash, add a credit line at the bottom of the slide in small text (e.g., "Photo by [Photographer Name] on Unsplash")
- **Use NASA space background for MBUA512 presentations**: Use the same NASA space background from Unsplash as used in Week 9 (https://images.unsplash.com/photo-1462331940025-496dfbfc7564)
