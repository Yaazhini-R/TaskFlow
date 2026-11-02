/**
 * server.js - Express Server and REST API
 * 
 * This file sets up the Express web server, serves static frontend files,
 * and handles all REST API endpoints for tasks.
 */

const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------------------------
// MIDDLEWARE
// ----------------------------------------------------

// Parse incoming JSON payloads
app.use(express.json());

// Parse incoming URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files (HTML, CSS, JS) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Simple request logger for terminal debugging (great for learning)
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

/**
 * GET /api/tasks
 * Retrieve tasks with optional filter query: ?filter=all|pending|completed
 */
app.get('/api/tasks', (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const tasks = db.getTasks(filter);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks from database.' });
  }
});

/**
 * GET /api/stats
 * Get overall task statistics (total, pending, completed counts)
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getTaskStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task statistics.' });
  }
});

/**
 * GET /api/tasks/:id
 * Retrieve a specific task by its ID
 */
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task.' });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 * Request Body: { title: string, description?: string }
 */
app.post('/api/tasks', (req, res) => {
  try {
    const { title, description } = req.body;

    // Validation: Title is required and cannot be only whitespace
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required and cannot be empty.'
      });
    }

    const newTask = db.createTask(title, description || '');
    res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      data: newTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Failed to create task.' });
  }
});

/**
 * PUT /api/tasks/:id
 * Update an existing task (title, description, completed status)
 * Request Body: { title?: string, description?: string, completed?: boolean|number }
 */
app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    // Check if task exists
    const existing = db.getTaskById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    // Validation if title is provided
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title cannot be empty.'
      });
    }

    const updatedTask = db.updateTask(id, { title, description, completed });
    res.json({
      success: true,
      message: 'Task updated successfully!',
      data: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: 'Failed to update task.' });
  }
});

/**
 * PATCH /api/tasks/:id/toggle
 * Quickly toggle task between completed and pending
 */
app.patch('/api/tasks/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = db.toggleTaskStatus(id);

    if (!updatedTask) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    res.json({
      success: true,
      message: `Task marked as ${updatedTask.completed === 1 ? 'completed' : 'pending'}!`,
      data: updatedTask
    });
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle task status.' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task by ID
 */
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteTask(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task.' });
  }
});

// ----------------------------------------------------
// FALLBACK ROUTE
// ----------------------------------------------------
// For any unhandled GET request, serve index.html (works across Express 4 and Express 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 TaskFlow server is running!`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`📂 Database: SQLite (${path.join(__dirname, 'tasks.db')})`);
    console.log(`=========================================`);
  });
}

module.exports = app;
