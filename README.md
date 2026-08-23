# Dummy Frontend for DevOps Testing

A lightweight frontend project to test CI/CD pipelines, build steps, and deployment artifacts.

## Quick Start

```bash
npm install
npm run dev
```

## Build for Deployment

```bash
npm run build
```

The production bundle is generated in `dist/`.

## Suggested CI Steps

1. Install Node.js (v20+ recommended)
2. Run `npm ci`
3. Run `npm run build`
4. Publish `dist/` as build artifact or deploy it
