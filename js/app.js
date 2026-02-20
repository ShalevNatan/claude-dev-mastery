/**
 * app.js — DevOps Learning Platform
 *
 * Architecture: single centralized `state` object; all modules read from
 * and write to it, then call saveState() + renderAll() to persist and sync the UI.
 *
 * Sections:
 *  1. Constants & Default State
 *  2. State Management  (loadState, saveState, renderAll)
 *  3. XP & Leveling     (computeLevel, renderXPBar)
 *  4. Roadmap / Skill Tree
 *  5. Quick Task Manager
 *  6. Pomodoro Timer
 *  7. Clock & Greeting
 *  8. Bootstrap
 */

'use strict';

/* ==========================================================================
   1. Constants & Default State
   ========================================================================== */

const STORAGE_KEY = 'devops_platform_state';

/**
 * XP required to *reach* each level (index = level - 1).
 * Level 1 starts at 0 XP; level 5 is the current ceiling.
 */
const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700];

/** Deep-cloned on first load when no saved state exists. */
const DEFAULT_STATE = {
  xp: 0,
  level: 1,
  roadmap: [
    {
      id: 1,
      title: 'Linux Fundamentals',
      tasks: [
        { id: 101, text: 'File Permissions',   done: false, xpReward: 50 },
        { id: 102, text: 'Process Management', done: false, xpReward: 50 },
      ],
    },
    {
      id: 2,
      title: 'Git & Version Control',
      tasks: [
        { id: 201, text: 'Branching',       done: false, xpReward: 75 },
        { id: 202, text: 'Merge Conflicts', done: false, xpReward: 75 },
      ],
    },
    {
      id: 3,
      title: 'Containerization',
      tasks: [
        { id: 301, text: 'Dockerfiles', done: false, xpReward: 100 },
        { id: 302, text: 'Volumes',     done: false, xpReward: 100 },
      ],
    },
  ],
  tasks: [], // Phase 1 quick-task list
};

/* ==========================================================================
   2. State Management
   ========================================================================== */

/** Runtime state — single source of truth. Never access localStorage directly. */
let state = {};

/** Hydrates `state` from localStorage, falling back to DEFAULT_STATE. */
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    state = saved ?? JSON.parse(JSON.stringify(DEFAULT_STATE));
  } catch {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  // Level is always recomputed from XP; never trust the stored value.
  state.level = computeLevel(state.xp);
}

/** Persists the current `state` to localStorage. */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Re-renders all dynamic UI sections from the current `state`. */
function renderAll() {
  renderXPBar();
  renderRoadmap();
  renderTasks();
}

/* ==========================================================================
   3. XP & Leveling
   ========================================================================== */

/**
 * Returns the level corresponding to the given XP total.
 * Levels start at 1 and are bounded by LEVEL_THRESHOLDS.
 */
function computeLevel(xp) {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

/**
 * Returns a 0–100 percentage representing progress within the current level.
 * Returns 100 if the player has reached the maximum level.
 */
function getLevelProgress(xp, level) {
  const from = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const to   = LEVEL_THRESHOLDS[level];      // undefined at max level
  if (to === undefined) return 100;
  return Math.round(((xp - from) / (to - from)) * 100);
}

/** Updates the XP progress bar and level/XP labels in the header. */
function renderXPBar() {
  const { xp, level } = state;
  const progress  = getLevelProgress(xp, level);
  const nextThreshold = LEVEL_THRESHOLDS[level];

  document.getElementById('level-label').textContent = `Level ${level}`;
  document.getElementById('xp-label').textContent = nextThreshold !== undefined
    ? `${xp} / ${nextThreshold} XP`
    : `${xp} XP — Max Level`;

  const fill = document.getElementById('xp-bar-fill');
  fill.style.width = `${progress}%`;
  fill.setAttribute('aria-valuenow', progress);
}

/* ==========================================================================
   4. Roadmap / Skill Tree
   ========================================================================== */

/**
 * Attaches a single delegated 'change' listener to the skill-tree container.
 * Called once at bootstrap — renderRoadmap() only rebuilds innerHTML.
 */
function initRoadmap() {
  document.getElementById('skill-tree').addEventListener('change', (e) => {
    const checkbox = e.target.closest('.skill-task__check');
    if (!checkbox) return;

    const categoryId = Number(checkbox.dataset.categoryId);
    const taskId     = Number(checkbox.dataset.taskId);
    const isChecked  = checkbox.checked;

    const category = state.roadmap.find(c => c.id === categoryId);
    if (!category) return;
    const task = category.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Award XP when checking; revoke when unchecking.
    if (isChecked && !task.done) {
      state.xp += task.xpReward;
    } else if (!isChecked && task.done) {
      state.xp = Math.max(0, state.xp - task.xpReward);
    }

    task.done    = isChecked;
    state.level  = computeLevel(state.xp);

    saveState();
    renderAll();
  });
}

/** Rebuilds the skill-card grid from the current state.roadmap. */
function renderRoadmap() {
  const container = document.getElementById('skill-tree');
  const fragment  = document.createDocumentFragment();

  state.roadmap.forEach(category => {
    const doneTasks  = category.tasks.filter(t => t.done).length;
    const totalTasks = category.tasks.length;
    const allDone    = doneTasks === totalTasks && totalTasks > 0;
    const progressPct = totalTasks
      ? Math.round((doneTasks / totalTasks) * 100)
      : 0;

    const card = document.createElement('div');
    card.className = `skill-card${allDone ? ' skill-card--complete' : ''}`;

    // Build task rows as a string for a single innerHTML assignment.
    const taskRows = category.tasks.map(task => `
      <li class="skill-task${task.done ? ' skill-task--done' : ''}">
        <input
          type="checkbox"
          class="skill-task__check"
          data-category-id="${category.id}"
          data-task-id="${task.id}"
          ${task.done ? 'checked' : ''}
          aria-label="${task.text} (+${task.xpReward} XP)"
        />
        <span class="skill-task__text">${task.text}</span>
        <span class="skill-task__xp">+${task.xpReward} XP</span>
      </li>
    `).join('');

    card.innerHTML = `
      <div class="skill-card__header">
        <h3 class="skill-card__title">${category.title}</h3>
        <span class="skill-card__badge">${doneTasks}/${totalTasks}</span>
      </div>
      <div class="progress-bar progress-bar--skill"
           role="progressbar"
           aria-label="${category.title} progress"
           aria-valuenow="${progressPct}"
           aria-valuemin="0"
           aria-valuemax="100">
        <div class="progress-bar__fill" style="width: ${progressPct}%"></div>
      </div>
      <ul class="skill-card__tasks">${taskRows}</ul>
    `;

    fragment.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}

/* ==========================================================================
   5. Quick Task Manager (Phase 1 utility — retains to-do list behaviour)
   ========================================================================== */

/** Attaches form submit and delegated click listeners. Called once at bootstrap. */
function initTaskManager() {
  const form   = document.getElementById('task-form');
  const input  = document.getElementById('task-input');
  const listEl = document.getElementById('task-list');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    state.tasks.push({ id: Date.now(), text, done: false });
    saveState();
    renderTasks();

    input.value = '';
    input.focus();
  });

  // Delegated handler for delete and checkbox toggle.
  listEl.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.task-item__delete');
    const checkbox  = e.target.closest('.task-item__check');

    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.id);
      state.tasks = state.tasks.filter(t => t.id !== id);
      saveState();
      renderTasks();
    }

    if (checkbox) {
      const id = Number(checkbox.dataset.id);
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        task.done = !task.done;
        saveState();
        renderTasks();
      }
    }
  });
}

/** Rebuilds the quick-task list DOM from state.tasks. */
function renderTasks() {
  const listEl   = document.getElementById('task-list');
  const fragment = document.createDocumentFragment();

  if (state.tasks.length === 0) {
    const empty = document.createElement('li');
    empty.className   = 'task-list__empty';
    empty.textContent = 'No tasks yet — add one above!';
    listEl.innerHTML = '';
    listEl.appendChild(empty);
    return;
  }

  state.tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' task-item--done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'task-item__check';
    checkbox.checked   = task.done;
    checkbox.dataset.id = task.id;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);

    const label = document.createElement('span');
    label.className   = 'task-item__label';
    label.textContent = task.text;

    const del = document.createElement('button');
    del.className  = 'task-item__delete';
    del.dataset.id = task.id;
    del.setAttribute('aria-label', `Delete task: ${task.text}`);
    del.innerHTML  = '&times;';

    li.append(checkbox, label, del);
    fragment.appendChild(li);
  });

  listEl.innerHTML = '';
  listEl.appendChild(fragment);
}

/* ==========================================================================
   6. Pomodoro Timer (Phase 1 — re-labelled "Deep Work")
   ========================================================================== */

const POMODORO_SECONDS = 25 * 60;

function initTimer() {
  const display  = document.getElementById('timer-display');
  const startBtn = document.getElementById('timer-start');
  const pauseBtn = document.getElementById('timer-pause');
  const resetBtn = document.getElementById('timer-reset');

  let remaining  = POMODORO_SECONDS;
  let intervalId = null;
  let running    = false;

  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateDisplay() {
    const formatted = formatTime(remaining);
    display.textContent = formatted;
    document.title = running
      ? `${formatted} — Deep Work`
      : 'DevOps Learning Platform';
  }

  function setRunningState(isRunning) {
    startBtn.disabled = isRunning;
    pauseBtn.disabled = !isRunning;
  }

  function tick() {
    if (remaining <= 0) {
      clearInterval(intervalId);
      running = false;
      setRunningState(false);
      display.textContent = 'Done!';
      document.title = 'DevOps Learning Platform';
      return;
    }
    remaining -= 1;
    updateDisplay();
  }

  startBtn.addEventListener('click', () => {
    if (running || remaining <= 0) return;
    running    = true;
    intervalId = setInterval(tick, 1000);
    setRunningState(true);
    updateDisplay();
  });

  pauseBtn.addEventListener('click', () => {
    if (!running) return;
    clearInterval(intervalId);
    running = false;
    setRunningState(false);
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    running   = false;
    remaining = POMODORO_SECONDS;
    setRunningState(false);
    updateDisplay();
  });

  updateDisplay();
}

/* ==========================================================================
   7. Clock & Greeting
   ========================================================================== */

function initClock() {
  const clockEl    = document.getElementById('clock');
  const greetingEl = document.getElementById('greeting');

  function tick() {
    const now = new Date();
    const h   = String(now.getHours()).padStart(2, '0');
    const m   = String(now.getMinutes()).padStart(2, '0');
    const s   = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;

    const hour = now.getHours();
    const greeting =
      hour >= 5  && hour < 12 ? 'Good morning'   :
      hour >= 12 && hour < 17 ? 'Good afternoon'  :
      hour >= 17 && hour < 21 ? 'Good evening'    :
                                 'Good night';

    if (greetingEl.textContent !== greeting) {
      greetingEl.textContent = greeting;
    }
  }

  tick();
  setInterval(tick, 1000);
}

/* ==========================================================================
   8. Bootstrap
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  loadState();       // hydrate state from localStorage (or defaults)

  initClock();       // start the clock ticker
  initRoadmap();     // attach delegated roadmap listener
  initTaskManager(); // attach task form/list listeners
  initTimer();       // wire up timer buttons

  renderAll();       // initial render pass
});
