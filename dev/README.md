# MBUA512 Slide Presentations

Interactive slide presentations for MBUA512 - Databases and Analytics course at Victoria University of Wellington.

## 🌐 Live Site

**GitHub Pages:** https://bogdanstate.github.io/mbua512/

## 📚 Available Presentations

### Week 9: Correlation & Regression
- **Slides:** 75
- **Interactive Components:** 20
- **R Code Examples:** 20 (with WebR)
- **Topics:** Correlation analysis, linear regression, R², model fitting, assumptions

**URL:** https://bogdanstate.github.io/mbua512/week-09/

### Week 10: Cluster Analysis
- **Slides:** 30 (basic content extracted from PPTX)
- **Topics:** K-means, hierarchical clustering, distance metrics, applications

**URL:** https://bogdanstate.github.io/mbua512/week-10/

## 🛠️ Technology Stack

### Slide Framework
Custom-built framework using:
- **HTML5/CSS3** - Modern web standards
- **ES Modules** - Modular JavaScript
- **YAML** - Content definition
- **WebR** - R execution in the browser
- **No build step** - Direct file serving

### Features
- ✨ Interactive visualizations
- 💻 Live R code execution
- 📱 Mobile responsive
- ⌨️ Keyboard navigation (←/→)
- 🎨 Custom interactive components
- 📊 Canvas-based charts

## 📁 Project Structure

```
dev/
├── index.html              Landing page
├── slide-framework/        Shared framework
│   ├── css/               Stylesheets
│   ├── js/                Core JavaScript modules
│   │   ├── core/         Navigation, slide generation
│   │   └── webr/         WebR integration, SmartPlot
│   ├── docs/             Documentation
│   └── examples/         Example presentations
├── week-09/              Week 9 presentation
│   ├── index.html
│   ├── presentation.yml  Slide definitions (75 slides)
│   ├── js/              Interactive components (20 modules)
│   ├── assets/          Images and graphics
│   └── data/            CSV data files
└── week-10/              Week 10 presentation
    ├── index.html
    ├── presentation.yml  Slide definitions (30 slides)
    ├── js/              Interactive components
    ├── assets/
    └── data/
```

## 🚀 Deployment

### Automatic Deployment
Changes pushed to `main` branch are automatically deployed to GitHub Pages via GitHub Actions.

**Workflow:** `.github/workflows/deploy.yml`

### Manual Deployment
1. Go to **Actions** tab on GitHub
2. Select "Deploy to GitHub Pages"
3. Click "Run workflow"

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 💻 Local Development

### Running Locally

```bash
cd dev
python3 -m http.server 8080
# Visit http://localhost:8080
```

### Adding a New Week

1. Create directory: `dev/week-XX/`
2. Copy structure from existing week
3. Create `presentation.yml` with slides
4. Update `dev/index.html` to add presentation card
5. Commit and push

### Week Directory Structure

```
week-XX/
├── index.html              Presentation loader
├── presentation.yml        Slide content (YAML)
├── js/                    Interactive components
│   ├── interactives.js   Module loader
│   └── *.js             Individual modules
├── assets/               Images, SVGs
└── data/                 CSV, JSON data
```

## 📝 Creating Slides

Slides are defined in `presentation.yml`:

```yaml
slides:
  # Title slide
  - type: title
    title: "Presentation Title"
    subtitle: "Subtitle"
    background: "https://..."
    
  # Section divider
  - type: section
    number: 1
    title: "Section Title"
    
  # Content slide
  - type: content
    title: "Slide Title"
    bullets:
      - "Point 1"
      - "Point 2"
      
  # R code slide
  - type: code
    id: plot-1
    title: "R Code Example"
    code: |
      library(ggplot2)
      ggplot(mtcars, aes(x=wt, y=mpg)) +
        geom_point()
        
  # Interactive component
  - type: interactive
    id: my-interactive
```

## 🎨 Creating Interactive Components

Interactive components are ES modules in `week-XX/js/`:

```javascript
// js/my-interactive.js
export function init(container, config = {}) {
  container.innerHTML = `
    <div>Custom interactive content</div>
  `;
  
  return {
    destroy() {
      // Cleanup
    }
  };
}

export default { init };
```

Register in `js/interactives.js`:
```javascript
const interactiveModules = {
  'my-interactive': './my-interactive.js',
  // ...
};
```

## 📖 Documentation

- **Framework Guide:** `slide-framework/docs/getting-started.md`
- **Deployment Guide:** `DEPLOYMENT.md`
- **Planning Document:** See repository root

## 👥 Credits

**Course:** MBUA512 - Databases and Analytics  
**Institution:** Victoria University of Wellington  
**Instructor:** Markus Luczak-Roesch  

**Framework Development:**  
Built with Claude Code and the Slide Framework

## 📄 License

Educational use for MBUA512 course.

---

**Last Updated:** 2026-01-25
