/**
 * app.js - TaskFlow Frontend Application Logic
 * 
 * Written in vanilla JavaScript with no external libraries.
 * Handles API communication with Express server, DOM rendering,
 * and user interactions.
 */

// ----------------------------------------------------
// STATE VARIABLES
// ----------------------------------------------------
let currentFilter = 'all';    // 'all' | 'pending' | 'completed'
let searchQuery = '';          // text entered in search box
let tasksList = [];            // in-memory list of tasks

// ----------------------------------------------------
// DOM ELEMENTS
// ----------------------------------------------------
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const titleError = document.getElementById('title-error');

const tasksContainer = document.getElementById('tasks-list');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptySubtitle = document.getElementById('empty-subtitle');
const loadingSpinner = document.getElementById('loading-spinner');

const filterTabs = document.querySelectorAll('.filter-tab');
const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');

const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const badgeAll = document.getElementById('badge-all');
const badgePending = document.getElementById('badge-pending');
const badgeCompleted = document.getElementById('badge-completed');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');

// Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editTaskId = document.getElementById('edit-task-id');
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskDesc = document.getElementById('edit-task-desc');
const editTaskCompleted = document.getElementById('edit-task-completed');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelEdit = document.getElementById('btn-cancel-edit');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadTasksAndStats();
});

// ----------------------------------------------------
// EVENT LISTENERS SETUP
// ----------------------------------------------------
function setupEventListeners() {
  // New Task Submission
  taskForm.addEventListener('submit', handleAddTask);

  // Clear validation error on title input
  taskTitleInput.addEventListener('input', () => {
    titleError.textContent = '';
  });

  // Filter Tabs Click
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentFilter = tab.getAttribute('data-filter');
      applyFilterAndRender();
    });
  });

  // Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    btnClearSearch.style.display = searchQuery ? 'block' : 'none';
    applyFilterAndRender();
  });

  // Clear Search Button
  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    btnClearSearch.style.display = 'none';
    applyFilterAndRender();
  });

  // Edit Modal Event Handlers
  editForm.addEventListener('submit', handleSaveEdit);
  btnCloseModal.addEventListener('click', closeEditModal);
  btnCancelEdit.addEventListener('click', closeEditModal);

  // Close modal if user clicks outside modal card
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      closeEditModal();
    }
  });

  // Keyboard shortcut: close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('open')) {
      closeEditModal();
    }
  });
}

// ----------------------------------------------------
// API CALLS & DATA FETCHING
// ----------------------------------------------------

/**
 * Fetch tasks and statistics from the backend server.
 */
async function loadTasksAndStats() {
  try {
    showLoading(true);

    // Run both fetch calls in parallel for fast response
    const [tasksResponse, statsResponse] = await Promise.all([
      fetch('/api/tasks'),
      fetch('/api/stats')
    ]);

    if (!tasksResponse.ok || !statsResponse.ok) {
      throw new Error('Failed to fetch data from server.');
    }

    const tasksData = await tasksResponse.json();
    const statsData = await statsResponse.json();

    if (tasksData.success) {
      tasksList = tasksData.data;
      applyFilterAndRender();
    }

    if (statsData.success) {
      updateStatsUI(statsData.data);
    }
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('Could not connect to server. Please ensure the backend is running.', 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Update the dashboard statistics and progress bar.
 */
function updateStatsUI(stats) {
  const total = stats.total || 0;
  const pending = stats.pending || 0;
  const completed = stats.completed || 0;

  // Update card numbers
  statTotal.textContent = total;
  statPending.textContent = pending;
  statCompleted.textContent = completed;

  // Update filter badges
  badgeAll.textContent = total;
  badgePending.textContent = pending;
  badgeCompleted.textContent = completed;

  // Calculate and update completion percentage
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

// ----------------------------------------------------
// TASK ACTIONS (CREATE, TOGGLE, EDIT, DELETE)
// ----------------------------------------------------

/**
 * Handle adding a new task from the form.
 */
async function handleAddTask(e) {
  e.preventDefault();

  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();

  // Validate title
  if (!title) {
    titleError.textContent = 'Please provide a task title.';
    taskTitleInput.focus();
    return;
  }

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create task.');
    }

    // Reset input fields
    taskTitleInput.value = '';
    taskDescInput.value = '';
    titleError.textContent = '';

    showToast('Task added successfully! 🎉', 'success');

    // Reload tasks and stats from server
    await loadTasksAndStats();
  } catch (error) {
    console.error('Error adding task:', error);
    showToast(error.message, 'error');
  }
}

/**
 * Toggle the completed status of a task.
 */
async function toggleTask(id) {
  try {
    const response = await fetch(`/api/tasks/${id}/toggle`, {
      method: 'PATCH'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to update task.');
    }

    const isNowCompleted = result.data.completed === 1;
    showToast(isNowCompleted ? 'Task marked as completed! ✅' : 'Task marked as pending ⏳', 'info');

    await loadTasksAndStats();
  } catch (error) {
    console.error('Error toggling task:', error);
    showToast(error.message, 'error');
  }
}

/**
 * Open the modal to edit an existing task.
 */
function openEditModal(task) {
  editTaskId.value = task.id;
  editTaskTitle.value = task.title;
  editTaskDesc.value = task.description || '';
  editTaskCompleted.checked = task.completed === 1;

  editModal.classList.add('open');
  editModal.setAttribute('aria-hidden', 'false');
  editTaskTitle.focus();
}

/**
 * Close the edit modal.
 */
function closeEditModal() {
  editModal.classList.remove('open');
  editModal.setAttribute('aria-hidden', 'true');
  editForm.reset();
}

/**
 * Save the edited task changes to the server.
 */
async function handleSaveEdit(e) {
  e.preventDefault();

  const id = editTaskId.value;
  const title = editTaskTitle.value.trim();
  const description = editTaskDesc.value.trim();
  const completed = editTaskCompleted.checked;

  if (!title) {
    alert('Task title cannot be empty.');
    editTaskTitle.focus();
    return;
  }

  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, completed })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to update task.');
    }

    closeEditModal();
    showToast('Task updated successfully! ✏️', 'success');
    await loadTasksAndStats();
  } catch (error) {
    console.error('Error saving task edit:', error);
    showToast(error.message, 'error');
  }
}

/**
 * Delete a task with a confirmation prompt.
 */
async function deleteTask(id, title) {
  const confirmed = window.confirm(`Are you sure you want to delete the task:\n\n"${title}"?`);
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to delete task.');
    }

    showToast('Task deleted successfully 🗑️', 'info');
    await loadTasksAndStats();
  } catch (error) {
    console.error('Error deleting task:', error);
    showToast(error.message, 'error');
  }
}

// ----------------------------------------------------
// FILTERING & RENDERING
// ----------------------------------------------------

/**
 * Filters the cached tasks by current status tab and search query, then renders them.
 */
function applyFilterAndRender() {
  let filtered = [...tasksList];

  // 1. Filter by status (All, Pending, Completed)
  if (currentFilter === 'pending') {
    filtered = filtered.filter((t) => t.completed === 0);
  } else if (currentFilter === 'completed') {
    filtered = filtered.filter((t) => t.completed === 1);
  }

  // 2. Filter by search query (title or description)
  if (searchQuery) {
    filtered = filtered.filter((t) => {
      const matchTitle = (t.title || '').toLowerCase().includes(searchQuery);
      const matchDesc = (t.description || '').toLowerCase().includes(searchQuery);
      return matchTitle || matchDesc;
    });
  }

  renderTasks(filtered);
}

/**
 * Renders the filtered tasks into the DOM.
 */
function renderTasks(tasks) {
  tasksContainer.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.style.display = 'block';

    if (searchQuery) {
      emptyTitle.textContent = 'No matching tasks';
      emptySubtitle.textContent = `No tasks match your search for "${searchQuery}".`;
    } else if (currentFilter === 'completed') {
      emptyTitle.textContent = 'No completed tasks yet';
      emptySubtitle.textContent = 'Finish a task and check the box to see it here!';
    } else if (currentFilter === 'pending') {
      emptyTitle.textContent = 'All caught up! 🎉';
      emptySubtitle.textContent = 'You have no pending tasks. Great job!';
    } else {
      emptyTitle.textContent = 'No tasks yet';
      emptySubtitle.textContent = 'Create your first task above to get started!';
    }
    return;
  }

  emptyState.style.display = 'none';

  tasks.forEach((task) => {
    const card = createTaskCardElement(task);
    tasksContainer.appendChild(card);
  });
}

/**
 * Helper to construct the HTML card for a single task.
 */
function createTaskCardElement(task) {
  const isCompleted = task.completed === 1;

  const item = document.createElement('article');
  item.className = `task-item ${isCompleted ? 'completed' : ''}`;
  item.dataset.id = task.id;

  // Format date nicely (e.g. "Nov 2, 2:40 PM")
  let formattedDate = '';
  if (task.created_at) {
    try {
      const d = new Date(task.created_at);
      formattedDate = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      formattedDate = '';
    }
  }

  // Toggle button markup
  const checkIcon = isCompleted
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : '';

  item.innerHTML = `
    <button
      type="button"
      class="task-toggle-btn"
      title="${isCompleted ? 'Mark as pending' : 'Mark as complete'}"
      aria-label="Toggle task completion"
    >
      ${checkIcon}
    </button>
    
    <div class="task-content">
      <h3 class="task-title"></h3>
      <p class="task-description"></p>
      <div class="task-meta">
        <span class="status-badge ${isCompleted ? 'completed' : 'pending'}">
          ${isCompleted ? 'Completed' : 'Pending'}
        </span>
        ${formattedDate ? `<span class="date-badge">Created ${formattedDate}</span>` : ''}
      </div>
    </div>

    <div class="task-actions">
      <button type="button" class="btn-icon btn-edit" title="Edit task" aria-label="Edit task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button type="button" class="btn-icon btn-delete" title="Delete task" aria-label="Delete task">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  // Safely insert text content to prevent XSS
  item.querySelector('.task-title').textContent = task.title;
  const descEl = item.querySelector('.task-description');
  if (task.description && task.description.trim()) {
    descEl.textContent = task.description;
  } else {
    descEl.remove();
  }

  // Bind Events for this card
  const toggleBtn = item.querySelector('.task-toggle-btn');
  toggleBtn.addEventListener('click', () => toggleTask(task.id));

  const editBtn = item.querySelector('.btn-edit');
  editBtn.addEventListener('click', () => openEditModal(task));

  const deleteBtn = item.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', () => deleteTask(task.id, task.title));

  return item;
}

// ----------------------------------------------------
// UI HELPERS (SPINNER, TOAST)
// ----------------------------------------------------

function showLoading(show) {
  if (loadingSpinner) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Display a temporary toast notification message.
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Trigger smooth enter animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 3000);
}
