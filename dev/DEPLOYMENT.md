# MBUA512 Dev Site - Deployment Guide

## ✅ Setup Complete!

The development branch has been successfully created and pushed to GitHub.

## 🔗 URLs

### Production (Current)
- **URL**: https://bogdanstate.github.io/mbua512/
- **Branch**: `main`
- **Status**: Live ✅
- **Content**: Original Week 9 slides

### Development (New Framework)
- **URL**: https://bogdanstate.github.io/mbua512/dev/
- **Branch**: `dev`
- **Status**: Deploying... ⏳
- **Content**: New slide framework (75 slides, 20 interactives)

## 📦 What Was Deployed

### New Slide Framework
- ✅ YAML-based slide configuration (`presentation.yml`)
- ✅ 75 slides fully ported
- ✅ 20 interactive modules (datasaurus, rho-slider, etc.)
- ✅ WebR integration for live R code
- ✅ Mobile-responsive design
- ✅ Touch gesture navigation
- ✅ PWA-capable

### Directory Structure
```
dev/
├── index.html              # Main presentation
├── presentation.yml        # Slide content (YAML)
├── slide-framework/        # Core framework
│   ├── css/               # Responsive styles
│   ├── js/                # Navigation, WebR
│   └── docs/              # Documentation
├── js/                    # Interactive modules
├── assets/                # Images, backgrounds
└── data/                  # CSV datasets
```

## 🚀 GitHub Pages Automatic Deployment

GitHub Pages automatically deploys both branches:

1. **Main branch** → https://bogdanstate.github.io/mbua512/
2. **Dev branch** → https://bogdanstate.github.io/mbua512/dev/

No additional configuration needed! GitHub Pages serves all files from the `dev/` directory on the `dev` branch.

## ⏱️ Deployment Timeline

- **Push time**: Just now
- **Build time**: ~1-2 minutes
- **Propagation**: ~5 minutes
- **Total**: ~5-10 minutes

Check deployment status:
```bash
gh run list --workflow=pages --limit 5
```

Or visit: https://github.com/bogdanstate/mbua512/actions

## ✅ Verification Steps

### 1. Wait for GitHub Pages Build
Visit: https://github.com/bogdanstate/mbua512/deployments

You should see:
- ✅ "github-pages" environment deployment in progress
- ⏳ Status: "In progress" → "Active"

### 2. Test Dev Site (5-10 minutes)
```bash
# Should return HTTP 200
curl -I https://bogdanstate.github.io/mbua512/dev/

# Should load presentation
curl https://bogdanstate.github.io/mbua512/dev/ | grep "MBUA512"
```

### 3. Test in Browser
Open: https://bogdanstate.github.io/mbua512/dev/

Expected:
- ✅ Slide navigation working
- ✅ 75 slides load from YAML
- ✅ Interactive modules initialize
- ✅ Mobile responsive
- ✅ Touch gestures work on mobile

## 📱 Mobile Testing

Test on your phone:
1. Visit: https://bogdanstate.github.io/mbua512/dev/
2. Swipe left/right to navigate
3. Test R code execution (may take time to load WebR)
4. Add to home screen (PWA)

## 🔄 Future Updates

### Update Dev Site
```bash
cd /home/bogdan/mbua512
git checkout dev

# Make changes to dev/ directory
# ... edit files ...

git add dev/
git commit -m "Update dev slides"
git push origin dev
```

GitHub Pages will automatically rebuild!

### Promote Dev to Production
When ready to replace production:

```bash
cd /home/bogdan/mbua512

# Option 1: Merge dev to main
git checkout main
git merge dev
git push origin main

# Option 2: Replace main content with dev
git checkout main
rm -rf *.html *.svg *.jpg *.json
git checkout dev -- dev/
mv dev/* .
rmdir dev/
git add .
git commit -m "Promote dev to production"
git push origin main
```

## 🐛 Troubleshooting

### Dev site shows 404
- Wait 5-10 minutes for deployment
- Check: https://github.com/bogdanstate/mbua512/actions
- Verify branch exists: `git branch -a`

### Styles/JS not loading
- Check browser console for errors
- Verify paths in `index.html` are relative
- Clear browser cache

### WebR not loading
- WebR downloads ~10MB on first load
- Check browser console for errors
- Try on desktop first (faster)

## 📊 Site Analytics

Both sites are independent:
- **Production**: Stable, proven
- **Development**: Testing, experimental

No risk to production site!

## 🔗 Quick Links

- **Production**: https://bogdanstate.github.io/mbua512/
- **Development**: https://bogdanstate.github.io/mbua512/dev/
- **Repository**: https://github.com/bogdanstate/mbua512
- **Actions**: https://github.com/bogdanstate/mbua512/actions
- **Branches**: https://github.com/bogdanstate/mbua512/branches

---

*Deployment completed: 2026-01-25*
*Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering)*
