'use strict';

const STORAGE_KEY = 'taskflow.tasks.v1';
const VALID_STATUSES = ['In Progress', 'Completed', 'Overdue'];
let tasks = loadTasks();

const elements = {
  form: document.querySelector('#task-form'),
  name: document.querySelector('#task-name'),
  category: document.querySelector('#task-category'),
  deadline: document.querySelector('#task-deadline'),
  initialStatus: document.querySelector('#task-status'),
  message: document.querySelector('#form-message'),
  list: document.querySelector('#task-list'),
  empty: document.querySelector('#empty-state'),
  emptyTitle: document.querySelector('#empty-title'),
  emptyCopy: document.querySelector('#empty-copy'),
  statusFilter: document.querySelector('#status-filter'),
  categoryFilter: document.querySelector('#category-filter'),
  search: document.querySelector('#search-tasks'),
  visibleCount: document.querySelector('#visible-count'),
  footerCount: document.querySelector('#footer-count'),
  total: document.querySelector('#stat-total'),
  progress: document.querySelector('#stat-progress'),
  completed: document.querySelector('#stat-completed'),
  overdue: document.querySelector('#stat-overdue'),
  categorySuggestions: document.querySelector('#category-suggestions')
};

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(savedTasks)) return [];
    return savedTasks.filter((task) => task && typeof task === 'object')
      .map((task) => ({
        id: String(task.id || createId()),
        name: String(task.name || '').trim(),
        category: String(task.category || '').trim(),
        deadline: String(task.deadline || ''),
        status: VALID_STATUSES.includes(task.status) ? task.status : 'In Progress',
        createdAt: Number(task.createdAt) || Date.now()
      }))
      .filter((task) => task.name && task.category && /^\d{4}-\d{2}-\d{2}$/.test(task.deadline));
  } catch (error) {
    console.warn('Saved tasks could not be read.', error);
    return [];
  }
}

function createId() {
  return window.crypto && typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getLocalDateString(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function updateOverdueStatuses() {
  const today = getLocalDateString();
  let changed = false;
  tasks.forEach((task) => {
    if (task.status !== 'Completed' && task.deadline < today && task.status !== 'Overdue') {
      task.status = 'Overdue';
      changed = true;
    } else if (task.status === 'Overdue' && task.deadline >= today) {
      task.status = 'In Progress';
      changed = true;
    }
  });
  if (changed) saveTasks();
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Tasks could not be saved.', error);
    showMessage('Your browser could not save changes. Check that local storage is enabled.');
  }
}

function showMessage(message = '', isSuccess = false) {
  elements.message.textContent = message;
  elements.message.classList.toggle('success', isSuccess);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(year, month - 1, day));
}

function getVisibleTasks() {
  const selectedStatus = elements.statusFilter.value;
  const selectedCategory = elements.categoryFilter.value;
  const query = elements.search.value.trim().toLocaleLowerCase();
  return tasks.filter((task) => {
    const statusMatches = selectedStatus === 'All' || task.status === selectedStatus;
    const categoryMatches = selectedCategory === 'All' || task.category.toLocaleLowerCase() === selectedCategory.toLocaleLowerCase();
    const searchMatches = !query || `${task.name} ${task.category}`.toLocaleLowerCase().includes(query);
    return statusMatches && categoryMatches && searchMatches;
  }).sort((first, second) => first.deadline.localeCompare(second.deadline) || first.createdAt - second.createdAt);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderTask(task) {
  const row = createElement('article', 'task-row');
  row.dataset.taskId = task.id;

  const primary = createElement('div', 'task-primary');
  primary.append(createElement('p', 'task-name', task.name));
  primary.append(createElement('p', 'task-caption', `Added ${formatDate(getLocalDateString(new Date(task.createdAt)))}`));

  const category = createElement('span', 'category-pill', task.category);
  const deadline = createElement('div', `deadline${task.status === 'Overdue' ? ' overdue' : ''}`);
  deadline.append(createElement('span', 'calendar-icon', '▦'));
  deadline.append(document.createTextNode(formatDate(task.deadline)));

  const statusWrap = createElement('div', 'status-wrap');
  const statusSelect = document.createElement('select');
  statusSelect.className = `status-select ${task.status.toLowerCase().replace(' ', '-')}`;
  statusSelect.setAttribute('aria-label', `Update status for ${task.name}`);
  statusSelect.dataset.action = 'status';
  VALID_STATUSES.forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    option.selected = status === task.status;
    // Overdue is assigned automatically from the deadline, not chosen manually.
    option.disabled = status === 'Overdue' && task.status !== 'Overdue';
    statusSelect.append(option);
  });
  statusWrap.append(statusSelect);

  const removeButton = createElement('button', 'delete-button', '×');
  removeButton.type = 'button';
  removeButton.dataset.action = 'delete';
  removeButton.setAttribute('aria-label', `Delete ${task.name}`);
  row.append(primary, category, deadline, statusWrap, removeButton);
  return row;
}

function updateFilters() {
  const currentCategory = elements.categoryFilter.value;
  const categories = [...new Set(tasks.map((task) => task.category).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));
  elements.categoryFilter.replaceChildren(new Option('All categories', 'All'));
  elements.categorySuggestions.replaceChildren();
  categories.forEach((category) => {
    elements.categoryFilter.add(new Option(category, category));
    elements.categorySuggestions.append(new Option(category));
  });
  elements.categoryFilter.value = categories.includes(currentCategory) ? currentCategory : 'All';
}

function updateSummary() {
  elements.total.textContent = tasks.length;
  elements.progress.textContent = tasks.filter((task) => task.status === 'In Progress').length;
  elements.completed.textContent = tasks.filter((task) => task.status === 'Completed').length;
  elements.overdue.textContent = tasks.filter((task) => task.status === 'Overdue').length;
}

function renderTasks() {
  updateOverdueStatuses();
  updateFilters();
  updateSummary();
  const visibleTasks = getVisibleTasks();
  elements.list.replaceChildren(...visibleTasks.map(renderTask));
  elements.visibleCount.textContent = visibleTasks.length;
  elements.footerCount.textContent = `${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`;
  const isEmpty = visibleTasks.length === 0;
  elements.empty.classList.toggle('visible', isEmpty);
  if (tasks.length === 0) {
    elements.emptyTitle.textContent = 'A fresh start';
    elements.emptyCopy.textContent = 'Your task list is clear. Add a task above to get started.';
  } else {
    elements.emptyTitle.textContent = 'No tasks match';
    elements.emptyCopy.textContent = 'Try another search or adjust your filters.';
  }
}

function addTask(event) {
  event.preventDefault();
  const name = elements.name.value.trim();
  const category = elements.category.value.trim();
  const deadline = elements.deadline.value;
  const status = elements.initialStatus.value;
  if (!name || !category || !deadline) {
    showMessage('Please fill in the task name, category, and deadline.');
    return;
  }
  if (deadline < getLocalDateString() && status !== 'Completed') {
    showMessage('That deadline has passed. Choose Completed or enter a future deadline.');
    elements.deadline.focus();
    return;
  }
  tasks.unshift({ id: createId(), name, category, deadline, status, createdAt: Date.now() });
  saveTasks();
  elements.form.reset();
  elements.deadline.min = getLocalDateString();
  showMessage('Task added and saved.', true);
  renderTasks();
  elements.name.focus();
}

function handleTaskAction(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const row = target.closest('[data-task-id]');
  const task = tasks.find((item) => item.id === row?.dataset.taskId);
  if (!task) return;

  if (target.dataset.action === 'status') {
    const nextStatus = target.value;
    if (!VALID_STATUSES.includes(nextStatus)) return;
    task.status = nextStatus;
    updateOverdueStatuses();
    saveTasks();
    showMessage(task.status === 'Overdue' ? 'This task is overdue because its deadline has passed.' : 'Task status updated.', true);
  } else if (target.dataset.action === 'delete') {
    tasks = tasks.filter((item) => item.id !== task.id);
    saveTasks();
    showMessage('Task deleted.', true);
  }
  renderTasks();
}

function focusTaskForm() {
  elements.name.focus();
  document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateTodayLabel() {
  document.querySelector('#today-label').textContent = new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric'
  }).format(new Date());
}

elements.form.addEventListener('submit', addTask);
elements.list.addEventListener('change', handleTaskAction);
elements.list.addEventListener('click', handleTaskAction);
elements.statusFilter.addEventListener('change', renderTasks);
elements.categoryFilter.addEventListener('change', renderTasks);
elements.search.addEventListener('input', renderTasks);
document.querySelector('#focus-task-button').addEventListener('click', focusTaskForm);
document.querySelector('#empty-add-button').addEventListener('click', focusTaskForm);
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    elements.search.focus();
  }
});

elements.deadline.min = getLocalDateString();
updateTodayLabel();
renderTasks();
// Recheck daily boundaries while the page is open (for example, at midnight).
window.setInterval(renderTasks, 60_000);
