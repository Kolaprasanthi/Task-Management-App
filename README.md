# Taskflow — Task Management App

A responsive task manager built with plain HTML, CSS, and JavaScript. It lets you organize tasks, follow deadlines, and track progress in your browser.

## Run it

Open `index.html` in a modern browser. No install or build step is required. Tasks are saved in that browser's local storage, so they remain available after a refresh on the same device and browser.

## Features

- Add a task name, category, deadline, and initial status.
- Automatically mark unfinished tasks **Overdue** after their deadline. Completed tasks stay completed.
- Change a task to **In Progress**, **Completed**, or **Overdue**; an overdue task can be completed at any time.
- Filter by status or category and search task names and categories.
- See live counts for all tasks, in-progress tasks, completed tasks, and overdue tasks.
- Delete tasks and receive feedback when changes are saved.
- Responsive layout, keyboard shortcut **Ctrl/⌘ + K** to focus search, and accessible form labels.

## Files

- `index.html` — page structure and form controls.
- `style.css` — responsive visual styles.
- `app.js` — task objects, array operations, DOM rendering, overdue logic, filters, and local storage.
- `REFLECTION.md` — project reflection.
