# Slide Framework - Getting Started

A lightweight, modular framework for creating interactive presentations with optional R code execution via WebR.

## Quick Start

### Option 1: HTML-Only (No YAML)

Create slides directly in HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Presentation</title>

  <!-- Framework CSS -->
  <link rel="stylesheet" href="slide-framework/css/variables.css">
  <link rel="stylesheet" href="slide-framework/css/base.css">
  <link rel="stylesheet" href="slide-framework/css/slides.css">
</head>
<body>
  <div class="sf-slides">
    <div class="sf-slide sf-slide--lead active">
      <h1>My Presentation</h1>
      <p>Subtitle goes here</p>
    </div>

    <div class="sf-slide sf-slide--content">
      <h1>First Topic</h1>
      <ul>
        <li>Point one</li>
        <li>Point two</li>
      </ul>
    </div>
  </div>

  <script type="module">
    import { SlideNavigation, createNavButtons, createPageNumber } from './slide-framework/js/core/navigation.js';

    const nav = new SlideNavigation();
    createNavButtons(nav);
    createPageNumber(nav);
  </script>
</body>
</html>
```

### Option 2: YAML Configuration

Define your presentation in YAML:

```yaml
# presentation.yml
meta:
  title: "My Presentation"
  authors: ["Your Name"]

config:
  webr:
    enabled: true
    packages: [ggplot2]

slides:
  - type: title
    title: "My Presentation"
    subtitle: "With WebR Support"

  - type: content
    title: "Topics"
    bullets:
      - "Data analysis"
      - "Visualizations"

  - type: code
    id: plot1
    title: "R Demo"
    code: |
      library(ggplot2)
      ggplot(mtcars, aes(wt, mpg)) +
        geom_point()
```

Then load it in HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="slide-framework/css/variables.css">
  <link rel="stylesheet" href="slide-framework/css/base.css">
  <link rel="stylesheet" href="slide-framework/css/slides.css">
  <link rel="stylesheet" href="slide-framework/css/smart-plot.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
</head>
<body>
  <div class="sf-slides"></div>

  <script type="module">
    import { initPresentation } from './slide-framework/js/index.js';
    await initPresentation({ yamlUrl: 'presentation.yml' });
  </script>
</body>
</html>
```

## Slide Types

### Title Slide

```yaml
- type: title
  title: "Main Title"
  subtitle: "Optional subtitle"
  authors: ["Name 1", "Name 2"]
  background: "image.jpg"  # optional
  overlay: 0.4             # optional darkness
```

### Section Interstitial

```yaml
- type: section
  number: 1
  title: "Section Name"
```

### Content Slide

```yaml
- type: content
  title: "Slide Title"
  bullets:
    - "First point"
    - "Second point"
```

### Code Slide (WebR)

```yaml
- type: code
  id: unique-id
  title: "R Code Demo"
  code: |
    # R code here
    plot(1:10)
```

### Two-Column Layout

```yaml
- type: two-column
  left:
    type: image
    src: "image.jpg"
  right:
    type: content
    title: "Description"
    bullets: ["Point 1", "Point 2"]
```

### Quote Slide

```yaml
- type: quote
  text: "Your quote here"
  author: "Attribution"
```

### Raw HTML

```yaml
- type: html
  class: "custom-class"
  html: |
    <div>Custom HTML content</div>
```

## Custom Templates

Define reusable templates in your YAML:

```yaml
templates:
  callout:
    html: |
      <div class="sf-slide">
        <div class="callout">
          <h2>{{title}}</h2>
          <p>{{message}}</p>
        </div>
      </div>

slides:
  - type: callout
    title: "Important!"
    message: "This uses a custom template"
```

## CSS Customization

Override CSS variables to customize the theme:

```css
:root {
  --sf-color-primary: #e74c3c;
  --sf-color-dark-bg: #2c3e50;
  --sf-font-family-base: 'Georgia', serif;
}
```

## Keyboard Shortcuts

- **Right Arrow / Space / Page Down**: Next slide
- **Left Arrow / Page Up**: Previous slide
- **Home**: First slide
- **End**: Last slide
- **Cmd/Ctrl + Enter** (in code editor): Run code

## File Structure

```
slide-framework/
├── css/
│   ├── variables.css    # CSS custom properties
│   ├── base.css         # Reset & typography
│   ├── slides.css       # Slide layouts
│   └── smart-plot.css   # Code editor widget
├── js/
│   ├── index.js         # Main entry point
│   ├── core/
│   │   ├── navigation.js
│   │   └── slide-generator.js
│   └── webr/
│       ├── webr-manager.js
│       └── smart-plot.js
└── examples/
    ├── minimal.html     # No YAML example
    ├── index.html       # Full YAML example
    └── presentation.yml # Example YAML config
```

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13.1+

WebR requires modern browser features (WebAssembly, ES Modules).

## Tips

1. **Start simple**: Use the minimal HTML approach first
2. **Incremental adoption**: Add YAML later for larger presentations
3. **Custom interactives**: Add slide-specific JavaScript in `<script>` tags
4. **Responsive**: CSS uses relative units, works on different screen sizes
5. **Print**: Use browser print (Cmd/Ctrl + P) for PDF export
