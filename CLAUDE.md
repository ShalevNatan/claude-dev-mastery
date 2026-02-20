# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A **DevOps Learning Platform** — a static single-page application with no build step, no npm, and no framework dependencies. The platform tracks a learner's progress through a DevOps roadmap, awarding XP and levels as tasks are completed.

> Phase 1 (Productivity Dashboard) has shipped. All new work targets Phase 2.

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
js/app.js         # Centralized state + all application logic
```

## Architecture

### State Management

All runtime state lives in a single centralized object in `js/app.js`. No module reads directly from `localStorage` or the DOM for state — they read from this object and call `saveState()`/`renderAll()` to persist and reflect changes.

```js
const state = {
  xp:       0,
  level:    1,
  roadmap:  [],   // see Data Schema below
  tasks:    [],   // legacy Phase 1 to-dos
};
```

Initialization flow:
1. `loadState()` — hydrates `state` from `localStorage` on `DOMContentLoaded`.
2. Feature modules mutate `state` and call `saveState()` to persist.
3. `renderAll()` (or a module-specific render function) is called after every mutation.

### Data Schema

The `localStorage` key `devops_platform_state` stores the full state object. Schema:

```json
{
  "xp": 0,
  "level": 1,
  "roadmap": [
    {
      "id": 1,
      "title": "Linux Fundamentals",
      "tasks": [
        { "id": 101, "text": "Learn file permissions", "done": false, "xpReward": 50 }
      ]
    }
  ],
  "tasks": []
}
```

- `xp` — cumulative points earned; drives level calculation.
- `level` — derived from `xp` thresholds; display only (recomputed on load, not trusted from storage).
- `roadmap` — ordered array of skill categories, each with nested task objects.
- `roadmap[].tasks[].xpReward` — XP awarded when the task is marked complete.

### UI Components

`css/style.css` must define these as reusable, independently scoped component classes:

**Skill Card** (`.skill-card`)
- Extends the base `.card` glassmorphism style.
- Contains a category title, a `.progress-bar`, and a list of roadmap tasks.
- State variants: `.skill-card--complete` when all tasks in the category are done.

**Progress Bar** (`.progress-bar`)
- A `<div>` wrapper with an inner `<div class="progress-bar__fill">`.
- Width of `__fill` is set via an inline `style="width: X%"` driven by JS.
- Color transitions from accent purple → green as value approaches 100%.

## Conventions

- Vanilla JS (ES6+): use `const`/`let`, arrow functions, template literals, and `querySelector`.
- CSS follows a mobile-first approach; breakpoints widen the layout for larger screens.
- Code must be modular and well-commented. Group related functions with a section comment header.
- Always summarize changes before committing so they can be reviewed.
- We work directly on the `main` branch.
