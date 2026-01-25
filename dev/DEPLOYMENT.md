# GitHub Pages Deployment Guide

This document explains how the MBUA512 presentations are automatically deployed to GitHub Pages.

## Automatic Deployment

The site is automatically deployed to GitHub Pages whenever changes are pushed to the `main` branch.

### How it Works

1. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
   - Triggers on every push to `main` branch
   - Can also be triggered manually via "Actions" tab
   - Deploys the `dev/` directory to GitHub Pages

2. **Deployment Process**
   - Checks out the repository
   - Configures GitHub Pages
   - Uploads the `dev/` directory as an artifact
   - Deploys to GitHub Pages

### Site URL

After deployment, the site will be available at:
```
https://bogdanstate.github.io/mbua512/
```

## Initial Setup (One-Time)

To enable GitHub Pages for this repository:

1. Go to repository **Settings** → **Pages**
2. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
3. Save the changes

That's it! The workflow will handle all deployments automatically.

## Manual Deployment

To manually trigger a deployment:

1. Go to the **Actions** tab in GitHub
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select the `main` branch
5. Click "Run workflow"

## Directory Structure

The deployed site structure:
```
/                       → Landing page (index.html)
/week-09/              → Week 9: Correlation & Regression
/week-10/              → Week 10: Cluster Analysis
/slide-framework/      → Shared framework (CSS, JS)
```

## Updating Content

### To update Week 9 or Week 10:
1. Edit files in `dev/week-09/` or `dev/week-10/`
2. Commit changes
3. Push to `main` branch
4. Deployment happens automatically

### To add a new week:
1. Create `dev/week-XX/` directory
2. Add `index.html` and `presentation.yml`
3. Update `dev/index.html` to add the new presentation card
4. Commit and push

## Troubleshooting

### Deployment failed
- Check the **Actions** tab for error details
- Ensure GitHub Pages is enabled in Settings
- Verify the `dev/` directory contains valid HTML

### Site not updating
- Check if the workflow ran successfully in Actions tab
- GitHub Pages may take 1-2 minutes to update after deployment
- Clear browser cache (Ctrl+F5 or Cmd+Shift+R)

### 404 errors
- Ensure all file paths are relative (no leading `/`)
- Check that files exist in the `dev/` directory
- Verify links in `index.html` point to correct directories

## Testing Locally

Before pushing, test the site locally:

```bash
cd dev
python3 -m http.server 8080
# Visit http://localhost:8080
```

## Repository Structure

```
mbua512/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← Deployment workflow
├── dev/                        ← Deployed to GitHub Pages
│   ├── index.html             ← Landing page
│   ├── slide-framework/       ← Shared framework
│   ├── week-09/               ← Week 9 slides
│   └── week-10/               ← Week 10 slides
├── index.html                 ← Original Week 9 presentation (legacy)
└── *.svg, *.jpg               ← Original Week 9 assets (legacy)
```

---

**Last updated:** 2026-01-25
