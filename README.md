# Split - Share Expenses with Friends

A mobile-first web application for splitting bills and managing shared expenses with friends. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎯 Mobile-responsive design optimized for phone browsers
- 🔐 Google authentication (coming soon)
- 💰 Split expenses with friends
- 📊 Track shared expenses
- ✅ Easy settlement

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Font**: Geist Sans & Geist Mono

## Development

The app is optimized for mobile browsers with:
- Responsive design (mobile-first)
- Touch-friendly UI elements
- Optimized viewport settings
- Modern color scheme with emerald/teal branding

### Branch Protection & Workflow

This repository uses a protected `main` branch workflow:

- 🔒 **Main branch is protected** - no direct commits or pushes allowed
- 🔄 **Changes flow through dev** - feature branches merge to `dev`, then `dev` merges to `main`
- ✅ **Automated checks** - linting, type checking, and builds must pass

**Quick workflow:**
```bash
# Work on features
git checkout dev
git checkout -b feature/my-feature
# ... make changes ...
git push -u origin feature/my-feature
# Create PR: feature/my-feature → dev

# Release to production
# Create PR: dev → main (only after dev is stable)
```

📚 **Documentation:**
- [Quick Reference](.github/QUICK_REFERENCE.md) - Essential commands and workflows
- [Complete Setup Guide](.github/BRANCH_PROTECTION_SETUP.md) - Full configuration details

**First time setup:** See [Quick Reference](.github/QUICK_REFERENCE.md#-quick-setup-3-steps) for configuring GitHub branch protection rules.
