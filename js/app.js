/**
 * app.js — Productivity Dashboard
 *
 * Sections:
 *  1. Clock & Greeting
 *  2. Task Manager
 *  3. Pomodoro Timer
 *
 * All state is either in the DOM or in localStorage (tasks only).
 * Each section is self-contained and initialised via DOMContentLoaded.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTaskManager();
  initTimer();
});

/* ==========================================================================
   1. Clock & Greeting
   ========================================================================== */

function initClock() {
  const clockEl    = document.getElementById('clock');
  const greetingEl = document.getElementById('greeting');

  function tick() {
    const now    = new Date();
    const h      = String(now.getHours()).padStart(2, '0');
    const m      = String(now.getMinutes()).padStart(2, '0');
    const s      = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}:${s}`;

    // Update greeting once per minute (or on first call)
    const hour = now.getHours();
    let greeting;
    if (hour >= 5 && hour < 12)       greeting = 'Good morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17 && hour < 21) greeting = 'Good evening';
    else                               greeting = 'Good night';

    if (greetingEl.textContent !== greeting) {
      greetingEl.textContent = greeting;
    }
  }

  tick(); // run immediately so there's no blank flash
  setInterval(tick, 1000);
}

/* ==========================================================================
   2. Task Manager
   ========================================================================== */

const TASKS_KEY = 'dashboard_tasks';

function initTaskManager() {
  const form      = document.getElementById('task-form');
  const input     = document.getElementById('task-input');
  const listEl    = document.getElementById('task-list');

  // Load persisted tasks and render
  renderTasks(listEl);

  // Add task on form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const tasks = loadTasks();
    tasks.push({ id: Date.now(), text, done: false });
    saveTasks(tasks);
    renderTasks(listEl);

    input.value = '';
    input.focus();
  });

  // Delete & toggle done — delegated to the list element
  listEl.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.task-item__delete');
    const checkbox  = e.target.closest('.task-item__check');

    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.id);
      const tasks = loadTasks().filter(t => t.id !== id);
      saveTasks(tasks);
      renderTasks(listEl);
    }

    if (checkbox) {
      const id = Number(checkbox.dataset.id);
      const tasks = loadTasks().map(t =>
        t.id === id ? { ...t, done: !t.done } : t
      );
      saveTasks(tasks);
      renderTasks(listEl);
    }
  });
}

/** Reads the task array from localStorage. */
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
  } catch {
    return [];
  }
}

/** Writes the task array to localStorage. */
function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

/** Rebuilds the task list DOM from the current localStorage state. */
function renderTasks(listEl) {
  const tasks = loadTasks();
  listEl.innerHTML = '';

  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'task-list__empty';
    empty.textContent = 'No tasks yet — add one above!';
    listEl.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' task-item--done' : ''}`;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-item__check';
    checkbox.checked = task.done;
    checkbox.dataset.id = task.id;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);

    // Label
    const label = document.createElement('span');
    label.className = 'task-item__label';
    label.textContent = task.text;

    // Delete button
    const del = document.createElement('button');
    del.className = 'task-item__delete';
    del.dataset.id = task.id;
    del.setAttribute('aria-label', `Delete task: ${task.text}`);
    del.innerHTML = '&times;';

    li.append(checkbox, label, del);
    fragment.appendChild(li);
  });

  listEl.appendChild(fragment);
}

/* ==========================================================================
   3. Pomodoro Timer
   ========================================================================== */

const POMODORO_SECONDS = 25 * 60; // 25 minutes

function initTimer() {
  const display    = document.getElementById('timer-display');
  const startBtn   = document.getElementById('timer-start');
  const pauseBtn   = document.getElementById('timer-pause');
  const resetBtn   = document.getElementById('timer-reset');

  let remaining  = POMODORO_SECONDS;
  let intervalId = null;
  let running    = false;

  /** Formats seconds into MM:SS. */
  function formatTime(secs) {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  /** Updates the display and the document title. */
  function updateDisplay() {
    const formatted = formatTime(remaining);
    display.textContent = formatted;
    document.title = running
      ? `${formatted} — Focus`
      : 'Productivity Dashboard';
  }

  /** Called every second when the timer is running. */
  function tick() {
    if (remaining <= 0) {
      clearInterval(intervalId);
      running = false;
      setRunningState(false);
      display.textContent = 'Done!';
      document.title = 'Productivity Dashboard';
      return;
    }
    remaining -= 1;
    updateDisplay();
  }

  /** Syncs button disabled/enabled state with the running flag. */
  function setRunningState(isRunning) {
    startBtn.disabled = isRunning;
    pauseBtn.disabled = !isRunning;
  }

  // Start
  startBtn.addEventListener('click', () => {
    if (running || remaining <= 0) return;
    running    = true;
    intervalId = setInterval(tick, 1000);
    setRunningState(true);
    updateDisplay();
  });

  // Pause
  pauseBtn.addEventListener('click', () => {
    if (!running) return;
    clearInterval(intervalId);
    running = false;
    setRunningState(false);
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    running   = false;
    remaining = POMODORO_SECONDS;
    setRunningState(false);
    updateDisplay();
  });

  // Initialise display
  updateDisplay();
}
