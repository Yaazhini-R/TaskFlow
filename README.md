# TaskFlow — Full-Stack Task Management Web Application

TaskFlow is a modern, responsive, and beginner-friendly full-stack task management application designed for productivity and learning. Built with vanilla web technologies, Node.js, Express, and an SQLite relational database, this project demonstrates core full-stack web development principles without the complexity of heavy frameworks.

---

## 🌟 Features

1. **Create Tasks**: Add new tasks with a required title and optional description.
2. **View All Tasks**: Real-time display of all stored tasks ordered by creation time.
3. **Edit Tasks**: Update the title, description, or status of existing tasks via an interactive dialog modal.
4. **Delete Tasks**: Remove tasks with safety confirmation to prevent accidental loss.
5. **Status Toggle**: Mark tasks as completed or pending with an instant status indicator.
6. **Task Filtering**: Filter tasks by **All**, **Pending**, and **Completed** with live counter badges.
7. **Live Search**: Quickly search through tasks by title or description in real time.
8. **Persistent Database**: All data is saved directly to a local SQLite database (`tasks.db`), ensuring data persists across server restarts.
9. **Responsive Design**: Clean, modern CSS layout that works on mobile phones, tablets, and desktop displays.
10. **Toast Notifications**: Smooth visual feedback for all user actions (create, edit, delete, status change).

---

## 🛠️ Tech Stack

- **Frontend**:
  - Semantic **HTML5** for accessible and clear structure
  - Custom **CSS3** (Flexbox, CSS Grid, CSS Variables, smooth transitions, responsive breakpoints)
  - **Vanilla JavaScript (ES6+)** for DOM manipulation and asynchronous `fetch()` API calls
- **Backend**:
  - **Node.js**: Asynchronous JavaScript runtime environment
  - **Express.js**: Lightweight web framework for RESTful routing and static file serving
- **Database**:
  - **SQLite**: Self-contained, serverless relational database engine stored as a single file (`tasks.db`)
- **Version Control**:
  - **Git & GitHub** for source code tracking and portfolio showcasing

---

## 📁 Project Architecture & File Structure

```text
TaskFlow/
├── public/                 # Static frontend assets served by Express
│   ├── index.html          # Web application structure & semantic layout
│   ├── style.css           # Modern design tokens, responsive styling, and animations
│   └── app.js              # Vanilla JS handling API calls, state, and DOM updates
├── database.js             # SQLite schema, connection, and CRUD helper functions
├── server.js               # Express application, REST API endpoints, and static file server
├── package.json            # Node.js project metadata and dependencies
├── .gitignore              # Files excluded from Git version control (node_modules, db, logs)
└── README.md               # Complete documentation and setup guide
```

### What Each Important File Does:

1. **`server.js`**:
   - The heart of the backend. It initializes Express, sets up JSON body parsing, serves the `public/` directory, logs incoming requests, and routes API requests to appropriate database functions.
2. **`database.js`**:
   - Manages the SQLite database (`tasks.db`). It creates the `tasks` table if it doesn't already exist, seeds initial sample tasks on first launch, and exports clean methods: `getTasks()`, `getTaskById()`, `createTask()`, `updateTask()`, `toggleTaskStatus()`, and `deleteTask()`.
3. **`public/index.html`**:
   - The user interface structure. Defines the header, statistics summary cards, progress bar, task creation form, filter tabs, live search input, task list container, and edit modal.
4. **`public/style.css`**:
   - Provides a clean, modern aesthetic using CSS variables, card shadows, responsive grids, and subtle micro-interactions.
5. **`public/app.js`**:
   - Client-side logic. Makes HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) to the backend API, updates the UI in real time, manages filters and search, and handles user feedback via toasts.

---

## 🔌 REST API Reference

The backend provides a clean RESTful API:

| Method | Endpoint | Description | Request Body Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Get all tasks (supports query `?filter=all\|pending\|completed`) | *None* |
| `GET` | `/api/tasks/:id` | Get a single task by ID | *None* |
| `GET` | `/api/stats` | Get counts (`total`, `pending`, `completed`) | *None* |
| `POST` | `/api/tasks` | Create a new task | `{"title": "Buy groceries", "description": "Milk, eggs, fruit"}` |
| `PUT` | `/api/tasks/:id` | Update an existing task | `{"title": "Updated Title", "description": "Updated Notes", "completed": true}` |
| `PATCH` | `/api/tasks/:id/toggle` | Toggle task completion | *None* |
| `DELETE` | `/api/tasks/:id` | Delete a task | *None* |

---

## 🚀 How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### 1. Install Dependencies
Open your terminal in the `TaskFlow` project directory and run:
```bash
npm install
```

### 2. Start the Application
Run:
```bash
npm start
```
Or for development with automatic restart on file changes:
```bash
npm run dev
```

### 3. Open in Browser
Visit [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🐙 Git & GitHub Setup Guide

To push this project to your GitHub account:

1. **Initialize Git repository**:
   ```bash
   git init
   ```
2. **Add and commit all project files**:
   ```bash
   git add .
   git commit -m "Initial commit: TaskFlow full-stack task manager"
   ```
3. **Create a new repository on GitHub** (e.g., named `taskflow`).
4. **Link local repository and push**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/taskflow.git
   git push -u origin main
   ```
