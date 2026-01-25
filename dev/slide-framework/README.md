# Slide Framework

A lightweight, modular framework for creating interactive presentations with optional R code execution via WebR.

## Features

- **No build step**: Pure ES modules, works directly in browser
- **YAML-based**: Define presentations in simple YAML format
- **Extensible templates**: Create custom slide types easily
- **WebR integration**: Run R code directly in the browser
- **Responsive**: Works on different screen sizes
- **Keyboard & touch**: Navigate with keys or swipe gestures

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="slide-framework/css/variables.css">
  <link rel="stylesheet" href="slide-framework/css/base.css">
  <link rel="stylesheet" href="slide-framework/css/slides.css">
</head>
<body>
  <div class="sf-slides">
    <div class="sf-slide sf-slide--lead active">
      <h1>Hello World</h1>
    </div>
  </div>

  <script type="module">
    import { SlideNavigation, createNavButtons } from './slide-framework/js/core/navigation.js';
    const nav = new SlideNavigation();
    createNavButtons(nav);
  </script>
</body>
</html>
```

## Documentation

See [docs/getting-started.md](docs/getting-started.md) for full documentation.

## Examples

- `examples/minimal.html` - Basic HTML-only presentation
- `examples/index.html` - Full YAML-based presentation with WebR

## Structure

```
slide-framework/
├── css/           # Stylesheets
├── js/            # JavaScript modules
│   ├── core/      # Navigation, slide generator
│   └── webr/      # WebR integration
├── examples/      # Example presentations
└── docs/          # Documentation
```

## License

MIT
