# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Modern Productivity Dashboard — a static single-page application with no build step, no npm, and no framework dependencies.

## Running the App

Open `index.html` directly in a browser, or serve it with any static file server:

```bash
# Python (available on most systems)
python -m http.server 8080

# Node.js (if available)
npx serve .
```

There is no build, compile, or install step.

## File Structure

```
index.html        # Entry point — loads CSS and JS
css/style.css     # All styles (glassmorphism dark theme, mobile-first)
js/app.js         # All application logic, split into modules via ES6+ patterns
```

## Architecture

`js/app.js` is organized into three self-contained logical sections, each initialized on `DOMContentLoaded`:

- **Clock/Greeting** — Updates every second via `setInterval`; greeting text is derived from `Date` hours.
- **Task Manager** — CRUD operations against `localStorage`; renders task list to the DOM on every mutation.
- **Pomodoro Timer** — 25-minute countdown managed with `setInterval`; start/pause/reset controls update a single display element.

State lives exclusively in `localStorage` (tasks only). There is no shared state object between modules — each section reads from and writes to the DOM and `localStorage` independently.

## Conventions

- Vanilla JS (ES6+): use `const`/`let`, arrow functions, template literals, and `querySelector`.
- CSS follows a mobile-first approach; breakpoints widen the layout for larger screens.
- Code must be modular and well-commented. Group related functions with a section comment header.
- Always summarize changes before committing so they can be reviewed.
- We work directly on the `main` branch.
