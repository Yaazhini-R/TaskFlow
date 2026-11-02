/**
 * database.js - SQLite Database Setup and Query Helpers
 * 
 * This file manages the SQLite connection using Node's built-in SQLite engine (node:sqlite).
 * It creates the "tasks" table automatically if it does not exist and provides
 * clean functions to Create, Read, Update, and Delete (CRUD) tasks.
 */

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Path to the SQLite database file
const dbPath = path.join(__dirname, 'tasks.db');

// Open or create the database file
const db = new DatabaseSync(dbPath);

// Initialize the database schema
function initDatabase() {
  // Create tasks table if it doesn't already exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if this is the first time the app is run (table is empty)
  // If so, add starter tasks so the user sees a helpful initial view
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM tasks');
  const result = countStmt.get();

  if (result && result.count === 0) {
    const seedInsert = db.prepare(`
      INSERT INTO tasks (title, description, completed)
      VALUES (?, ?, ?)
    `);

    seedInsert.run(
      'Welcome to TaskFlow! 👋',
      'This is a beginner-friendly full-stack task manager built with Node.js, Express, and SQLite.',
      0
    );

    seedInsert.run(
      'Try marking this task as complete ✅',
      'Click the circle checkbox on the left to toggle between pending and completed.',
      1
    );

    seedInsert.run(
      'Edit or delete any task ✏️ 🗑️',
      'Use the edit button to change the title/description or delete button to remove it.',
      0
    );
  }
}

// Initialize tables on load
initDatabase();

// ----------------------------------------------------
// DATABASE HELPER FUNCTIONS
// ----------------------------------------------------

/**
 * Retrieve tasks with optional status filtering.
 * @param {string} filter - 'all', 'pending', or 'completed'
 * @returns {Array} Array of task objects
 */
function getTasks(filter = 'all') {
  if (filter === 'completed') {
    const stmt = db.prepare('SELECT * FROM tasks WHERE completed = 1 ORDER BY id DESC');
    return stmt.all();
  } else if (filter === 'pending') {
    const stmt = db.prepare('SELECT * FROM tasks WHERE completed = 0 ORDER BY id DESC');
    return stmt.all();
  } else {
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY id DESC');
    return stmt.all();
  }
}

/**
 * Retrieve a single task by ID.
 * @param {number} id - Task ID
 * @returns {Object|null}
 */
function getTaskById(id) {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return stmt.get(Number(id)) || null;
}

/**
 * Create a new task.
 * @param {string} title - Task title (required)
 * @param {string} description - Optional description
 * @returns {Object} Newly created task
 */
function createTask(title, description = '') {
  const cleanTitle = String(title || '').trim();
  const cleanDesc = String(description || '').trim();

  const stmt = db.prepare(`
    INSERT INTO tasks (title, description, completed, created_at, updated_at)
    VALUES (?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const result = stmt.run(cleanTitle, cleanDesc);
  return getTaskById(result.lastInsertRowid);
}

/**
 * Update an existing task's title, description, and/or completed status.
 * @param {number} id - Task ID
 * @param {Object} updates - { title, description, completed }
 * @returns {Object|null} Updated task or null if not found
 */
function updateTask(id, updates = {}) {
  const existing = getTaskById(id);
  if (!existing) return null;

  const newTitle = updates.title !== undefined ? String(updates.title).trim() : existing.title;
  const newDesc = updates.description !== undefined ? String(updates.description).trim() : existing.description;
  const newCompleted = updates.completed !== undefined ? (updates.completed ? 1 : 0) : existing.completed;

  const stmt = db.prepare(`
    UPDATE tasks
    SET title = ?,
        description = ?,
        completed = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(newTitle, newDesc, newCompleted, Number(id));
  return getTaskById(id);
}

/**
 * Toggle the completed status of a task (0 -> 1, or 1 -> 0).
 * @param {number} id - Task ID
 * @returns {Object|null} Updated task or null
 */
function toggleTaskStatus(id) {
  const existing = getTaskById(id);
  if (!existing) return null;

  const newStatus = existing.completed === 1 ? 0 : 1;
  const stmt = db.prepare(`
    UPDATE tasks
    SET completed = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(newStatus, Number(id));
  return getTaskById(id);
}

/**
 * Delete a task by ID.
 * @param {number} id - Task ID
 * @returns {boolean} True if deleted, false if not found
 */
function deleteTask(id) {
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const result = stmt.run(Number(id));
  return result.changes > 0;
}

/**
 * Get summary counts for the dashboard stats.
 * @returns {Object} { total, pending, completed }
 */
function getTaskStats() {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed
    FROM tasks
  `);
  const row = stmt.get();
  return {
    total: row.total || 0,
    pending: row.pending || 0,
    completed: row.completed || 0
  };
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  getTaskStats
};
