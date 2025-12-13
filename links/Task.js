// --------------------------
// Task & TaskManager
// --------------------------
const Priority = { low: "low", medium: "medium", high: "high" };

class Task {
  constructor(id, name, notes, date, time, priority) {
    this.id = id;
    this.name = name;
    this.notes = notes;
    this.date = date; // yyyy-mm-dd
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
    this.id = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) : 0;
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

// --------------------------
// Global Calendar Data
// --------------------------
const tasksByDate = {}; // { "yyyy-mm-dd": [{label,title,time}] }

// --------------------------
// Render Functions
// --------------------------
function addTaskToSidebar(task) {
  const div = document.createElement("div");
  div.setAttribute("data-id", task.id);
  div.style.border = "1px solid #aaa";
  div.style.margin = "0.5rem";
  div.style.padding = "0.5rem";
  div.style.borderRadius = "5px";
  div.innerHTML = `
    <strong>${task.name}</strong> ${task.date} ${task.time ? "(" + task.time + ")" : ""}
    <p>${task.notes}</p>
    <p>Priority: ${task.priority}</p>
    <button class="deleteTask">Delete</button>
  `;
  div.querySelector(".deleteTask").addEventListener("click", () => {
    taskManager.removeTask(task.id);
    div.remove();
    removeTaskFromCalendar(task);
  });
  upComing.appendChild(div);
}

function removeTaskFromCalendar(task) {
  if (!tasksByDate[task.date]) return;
  tasksByDate[task.date] = tasksByDate[task.date].filter(
    t => !(t.title === task.name && t.time === task.time)
  );
  renderCalendarDay(task.date);
}

// --------------------------
// Calendar Functions
// --------------------------
function generateCalendar(yearsAhead = 3) {
  const today = new Date();
  const startYear = today.getFullYear();
  const endYear = startYear + yearsAhead;
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let thisMonthElement = null;
  calendar.innerHTML = "";

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const monthDiv = document.createElement("div");
      monthDiv.className = "month";

      if (year === today.getFullYear() && month === today.getMonth()) thisMonthElement = monthDiv;

      // month title
      const title = document.createElement("div");
      title.className = "month-title";
      title.textContent = firstDay.toLocaleString("default", { month: "long", year: "numeric" });
      monthDiv.appendChild(title);

      // day labels
      dayLabels.forEach(label => {
        const labelDiv = document.createElement("div");
        labelDiv.className = "day-label";
        labelDiv.textContent = label;
        monthDiv.appendChild(labelDiv);
      });

      const firstWeekday = (firstDay.getDay() + 6) % 7;

      // leading filler days
      for (let i = 0; i < firstWeekday; i++) {
        const filler = document.createElement("div");
        filler.className = "day filler";
        filler.textContent = new Date(year, month, -(firstWeekday - 1 - i)).getDate();
        filler.style.opacity = "0.35";
        monthDiv.appendChild(filler);
      }

      // actual days
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const day = document.createElement("div");
        day.className = "day";
        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) day.classList.add("today");
        day.innerHTML = `<div class="day-number">${d}</div>`;
        monthDiv.appendChild(day);
      }

      // trailing filler days
      const totalCells = firstWeekday + lastDay.getDate();
      const remainder = totalCells % 7;
      if (remainder !== 0) {
        const trailing = 7 - remainder;
        for (let i = 1; i <= trailing; i++) {
          const filler = document.createElement("div");
          filler.className = "day filler";
          filler.textContent = i;
          filler.style.opacity = "0.35";
          monthDiv.appendChild(filler);
        }
      }

      calendar.appendChild(monthDiv);
    }
  }

  if (thisMonthElement) setTimeout(() => thisMonthElement.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
}

// render tasks for a single day
function renderCalendarDay(date) {
  const dayTasks = tasksByDate[date] || [];
  const [year, month, day] = date.split("-").map(Number);

  // find month div
  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" });
  const monthDiv = Array.from(calendar.querySelectorAll(".month")).find(
    m => m.querySelector(".month-title")?.textContent === monthName
  );
  if (!monthDiv) return;

  const dayCells = monthDiv.querySelectorAll(".day");
  dayCells.forEach(cell => {
    const cellNumber = Number(cell.querySelector(".day-number").textContent);
    if (cellNumber === day) {
      // clear old tasks
      cell.querySelectorAll(".task, .task-blur-overlay").forEach(n => n.remove());
      const maxVisible = 3;

      dayTasks.slice(0, maxVisible).forEach(t => {
        const tDiv = document.createElement("div");
        tDiv.className = "task";
        tDiv.innerHTML = `
          <div class="task-label">${t.label}</div>
          <div class="task-title">${t.title}</div>
          <div class="task-time">${t.time}</div>
        `;
        cell.appendChild(tDiv);
      });

      if (dayTasks.length > maxVisible) {
        const blurOverlay = document.createElement("div");
        blurOverlay.className = "task-blur-overlay";
        cell.appendChild(blurOverlay);
      }
    }
  });
}

// --------------------------
// Event Listeners
// --------------------------

// open modal
taskButton.addEventListener("click", e => { Taskscreen.style.display = "block"; e.stopPropagation(); });
// close modal
closeTaskWindow.addEventListener("click", e => { Taskscreen.style.display = "none"; e.stopPropagation(); });
window.addEventListener("click", e => { if (Taskscreen.style.display === "block" && !Taskscreen.contains(e.target) && e.target !== taskButton) Taskscreen.style.display = "none"; });
Taskscreen.addEventListener("click", e => e.stopPropagation());

// form submit
form.addEventListener("submit", e => {
  e.preventDefault();
  const name = form.taskName.value.trim();
  const notes = form.taskNotes.value.trim();
  const date = form.taskDate.value;
  const time = form.taskTime.value;
  const priority = form.taskPriority ? form.taskPriority.value : "low";

  if (!name || !date) return alert("Task name and date are required.");

  const task = taskManager.addTask(name, notes, date, time, priority);

  // add to sidebar
  addTaskToSidebar(task);

  // add to calendar
  if (!tasksByDate[date]) tasksByDate[date] = [];
  tasksByDate[date].push({ label: priority, title: name, time: time });
  renderCalendarDay(date);

  form.reset();
  Taskscreen.style.display = "none";
});

// --------------------------
// Initial render
// --------------------------
generateCalendar();
taskManager.tasks.forEach(task => {
  addTaskToSidebar(task);
  if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
  tasksByDate[task.date].push({ label: task.priority, title: task.name, time: task.time });
  renderCalendarDay(task.date);
});