// --------------------------
// Task & TaskManager
// --------------------------
const Priority = { low: "low", medium: "medium", high: "high" };

class Task {
  constructor(id, name, notes, date, time, priority) {
    this.id = id;
    this.name = name;
    this.notes = notes;
    this.date = date;
    this.time = time;
    this.priority = priority || Priority.low;
  }
}

class TaskManager {
  constructor() {
    this.tasks = [];
    this.id = 0;
  }

  addTask(name, notes, date, time, priority) {
    this.id++;
    const task = new Task(this.id, name, notes, date, time, priority);
    this.tasks.push(task);
    this.saveTasks();
    return task;
  }

  updateTask(id, name, notes, date, time, priority) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    task.name = name;
    task.notes = notes;
    task.date = date;
    task.time = time;
    task.priority = priority;

    this.saveTasks();
    return task;
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
  }

  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks));
  }

  loadTasks() {
    const saved = JSON.parse(localStorage.getItem("tasks") || "[]");
    this.tasks = saved.map(
      t => new Task(t.id, t.name, t.notes, t.date, t.time, t.priority)
    );
    this.id = this.tasks.length ? Math.max(...this.tasks.map(t => t.id)) : 0;
  }
}

const taskManager = new TaskManager();
taskManager.loadTasks();

// --------------------------
// DOM Elements
// --------------------------
const Taskscreen = document.getElementById("Taskscreen");
const taskButton = document.getElementById("addTask");
const closeTaskWindow = document.getElementById("closeTaskWindow");
const form = document.getElementById("taskForm");
const upComing = document.getElementById("upComing");
const calendar = document.getElementById("calendar");
const setIcon = document.getElementById("setIcon");
const settingsTab = document.getElementById("settingsTab");
const setBack = document.getElementById("setBack");

// --------------------------
// State
// --------------------------
const tasksByDate = {};
let editingTaskId = null;

// --------------------------
// Sidebar
// --------------------------
function addTaskToSidebar(task) {
  const div = document.createElement("div");
  div.dataset.id = task.id;

  div.innerHTML = `
    <strong>${task.name}</strong> ${task.date} ${task.time ? "(" + task.time + ")" : ""}
    <p>${task.notes}</p>
    <p>Priority: ${task.priority}</p>
    <div style="display:flex; gap:.5rem; justify-content:flex-end;">
      <button class="editTask">Edit</button>
      <button class="deleteTask">Delete</button>
    </div>
  `;

  div.querySelector(".deleteTask").addEventListener("click", () => {
    taskManager.removeTask(task.id);
    div.remove();
    removeTaskFromCalendar(task);
  });

  div.querySelector(".editTask").addEventListener("click", () => {
    openEditTask(task);
  });

  upComing.appendChild(div);
}

function openEditTask(task) {
  editingTaskId = task.id;

  form.taskName.value = task.name;
  form.taskNotes.value = task.notes;
  form.taskDate.value = task.date;
  form.taskTime.value = task.time;
  form.taskPriority.value = task.priority;

  Taskscreen.style.display = "block";
}

// --------------------------
// Calendar
// --------------------------
function removeTaskFromCalendar(task) {
  if (!tasksByDate[task.date]) return;
  tasksByDate[task.date] = tasksByDate[task.date].filter(
    t => !(t.title === task.name && t.time === task.time)
  );
  renderCalendarDay(task.date);
}

function generateCalendar(yearsAhead = 3) {
  const today = new Date();
  calendar.innerHTML = "";

  for (let y = today.getFullYear(); y <= today.getFullYear() + yearsAhead; y++) {
    for (let m = 0; m < 12; m++) {
      const monthDiv = document.createElement("div");
      monthDiv.className = "month";

      const title = document.createElement("div");
      title.className = "month-title";
      title.textContent = new Date(y, m).toLocaleString("default", { month: "long", year: "numeric" });
      monthDiv.appendChild(title);

      for (let d = 1; d <= new Date(y, m + 1, 0).getDate(); d++) {
        const day = document.createElement("div");
        day.className = "day";
        day.innerHTML = `<div class="day-number">${d}</div>`;
        monthDiv.appendChild(day);
      }

      calendar.appendChild(monthDiv);
    }
  }
}

function renderCalendarDay(date) {
  const [y, m, d] = date.split("-").map(Number);
  const monthName = new Date(y, m - 1).toLocaleString("default", { month: "long", year: "numeric" });

  const monthDiv = [...calendar.querySelectorAll(".month")].find(
    m => m.querySelector(".month-title").textContent === monthName
  );
  if (!monthDiv) return;

  const cell = [...monthDiv.querySelectorAll(".day")].find(
    c => Number(c.querySelector(".day-number")?.textContent) === d
  );
  if (!cell) return;

  cell.querySelectorAll(".task").forEach(n => n.remove());

  (tasksByDate[date] || []).forEach(t => {
    const div = document.createElement("div");
    div.className = "task";
    div.textContent = `${t.title} ${t.time || ""}`;
    cell.appendChild(div);
  });
}

// --------------------------
// Events
// --------------------------
taskButton.addEventListener("click", () => {
  editingTaskId = null;
  form.reset();
  Taskscreen.style.display = "block";
});

closeTaskWindow.addEventListener("click", () => {
  Taskscreen.style.display = "none";
});

form.addEventListener("submit", e => {
  e.preventDefault();

  const name = form.taskName.value.trim();
  const notes = form.taskNotes.value.trim();
  const date = form.taskDate.value;
  const time = form.taskTime.value;
  const priority = form.taskPriority.value;

  if (!name || !date) return alert("Task name and date required");

  if (editingTaskId !== null) {
    const oldTask = taskManager.tasks.find(t => t.id === editingTaskId);
    removeTaskFromCalendar(oldTask);

    taskManager.updateTask(editingTaskId, name, notes, date, time, priority);
    upComing.innerHTML = "";
    taskManager.tasks.forEach(addTaskToSidebar);
  } else {
    const task = taskManager.addTask(name, notes, date, time, priority);
    addTaskToSidebar(task);
  }

  tasksByDate[date] ??= [];
  tasksByDate[date].push({ title: name, time, label: priority });
  renderCalendarDay(date);

  editingTaskId = null;
  form.reset();
  Taskscreen.style.display = "none";
});

// --------------------------
// Init
// --------------------------
generateCalendar();
taskManager.tasks.forEach(t => {
  addTaskToSidebar(t);
  tasksByDate[t.date] ??= [];
  tasksByDate[t.date].push({ title: t.name, time: t.time, label: t.priority });
  renderCalendarDay(t.date);
});