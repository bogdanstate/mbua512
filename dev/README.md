# MBUA512 Week 9 - New Slide Framework (Development)

This is the **development version** of MBUA512 Week 9: Correlation & Regression using the new slide framework.

## 🔗 Links

- **Production**: [https://bogdanstate.github.io/mbua512/](https://bogdanstate.github.io/mbua512/)
- **Development**: [https://bogdanstate.github.io/mbua512/dev/](https://bogdanstate.github.io/mbua512/dev/)

## 📊 Features

- **75 slides** fully ported from original presentation
- **20 interactive modules** (datasaurus, rho-slider, confusion matrix, etc.)
- **WebR integration** for live R code execution
- **Mobile responsive** design with touch gestures
- **YAML-based** slide configuration

## 🛠️ Local Development

```bash
# Navigate to dev directory
cd dev

# Start local server
python -m http.server 8000

# Open http://localhost:8000
```

## 📱 Mobile Features

- Swipe left/right to navigate
- Touch-optimized buttons (44x44px tap targets)
- Responsive typography
- Landscape mode support
- PWA-capable (add to home screen)

## 🚀 Deployment

This branch is configured for GitHub Pages deployment at the `/dev/` subdirectory.

To deploy updates:
```bash
git add .
git commit -m "Update slides"
git push origin dev
```

GitHub Pages will automatically rebuild the site.

## 📝 Slide Structure

```
dev/
├── index.html              # Main presentation page
├── presentation.yml        # Slide content (YAML)
├── slide-framework/        # Core framework
│   ├── css/               # Responsive styles
│   ├── js/                # Navigation, WebR, generators
│   └── docs/              # Framework documentation
├── js/                    # Custom interactive modules
├── assets/                # Images, backgrounds
└── data/                  # CSV datasets
```

## 🔄 Merging to Production

When ready to promote to production:

```bash
git checkout main
git merge dev
git push origin main
```

---

*Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering)*
