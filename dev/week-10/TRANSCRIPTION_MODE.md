# Transcription Mode

Week 10 uses **transcription mode** to show side-by-side comparison of original PowerPoint slides and their ported versions.

## What is Transcription Mode?

Transcription mode displays two panes for each slide:

1. **Left Pane:** Screenshot of the original PowerPoint slide
2. **Right Pane:** The ported slide using the Slide Framework

This allows you to:
- Verify the accuracy of the conversion
- See what has been preserved vs. what has changed
- Compare visual design between PowerPoint and the framework
- Identify areas that need improvement

## How It Works

Each slide in `presentation.yml` uses the `transcription` type:

```yaml
- type: transcription
  title: "Slide Title"
  slideNum: 1
  original: assets/original-slides/slide-01.png
  ported:
    type: content
    title: "Actual Slide Title"
    bullets:
      - "Point 1"
      - "Point 2"
```

### Fields

- **type**: Must be `transcription`
- **title**: Header shown above the comparison
- **slideNum**: Slide number for reference
- **original**: Path to original PowerPoint screenshot
- **ported**: The actual slide configuration (can be any slide type)

## Screenshots

Original PowerPoint slides have been converted to PNG images at 150 DPI and stored in:
```
assets/original-slides/
├── slide-01.png
├── slide-02.png
├── slide-03.png
...
├── slide-55.png
```

## Converting to Normal Mode

To convert a presentation from transcription mode to normal mode, simply replace each transcription slide with its `ported` content:

```python
import yaml

with open('presentation.yml', 'r') as f:
    pres = yaml.safe_load(f)

# Extract ported slides
normal_slides = [slide['ported'] for slide in pres['slides']]
pres['slides'] = normal_slides

with open('presentation.yml', 'w') as f:
    yaml.dump(pres, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
```

## Styling

Transcription mode styles are defined in:
```
slide-framework/css/slides.css
```

Key classes:
- `.sf-slide--transcription` - Main slide container
- `.sf-transcription-header` - Header with title and badge
- `.sf-transcription-compare` - Two-pane grid layout
- `.sf-transcription-pane` - Individual pane (original or ported)
- `.sf-transcription-original` - Container for PowerPoint screenshot
- `.sf-transcription-ported` - Container for ported slide content

## Use Cases

Transcription mode is ideal for:
- **Initial porting**: Verify content is correctly extracted
- **Quality control**: Ensure no information is lost
- **Training**: Show others how to port slides
- **Documentation**: Demonstrate the conversion process
- **Incremental improvement**: Gradually refine ported slides

---

**Note:** Once you're satisfied with the conversion, you can remove transcription mode and use the normal slide types.
