
// --------------------------
// App Settings (defaults)
// --------------------------
const defaultSettings = {
  theme: "dark",
  defaultPriority: "low",
  weekStartsOn: "monday",
};

let appSettings = { ...defaultSettings };

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("settings"));
    if (saved) appSettings = { ...defaultSettings, ...saved };
  } catch {
    localStorage.removeItem("settings");
  }
}

function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(appSettings));
}

function applyTheme() {
  document.body.dataset.theme = appSettings.theme; // "dark" or "light"
}

loadSettings();
applyTheme();

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
    this.time = time || "";
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
    try {
      // Protect corrupted localStorage
      const saved = JSON.parse(localStorage.getItem("tasks") || "[]");
      this.tasks = saved.map(
        t => new Task(t.id, t.name, t.notes, t.date, t.time, t.priority)
      );
      // Restore ID counter
      this.id = this.tasks.length ? Math.max(...this.tasks.map(t => t.id)) : 0;
    } catch {
      // Fail-safe
      this.tasks = [];
      this.id = 0;
      localStorage.removeItem("tasks");
    }
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

// Settings controls
const themeSelect = document.getElementById("themeSelect");
const defaultPrioritySelect = document.getElementById("defaultPriority");
const weekStartSelect = document.getElementById("weekStart");

// Form controls (no name attributes needed)
const taskNameEl = document.getElementById("taskName");
const taskDateEl = document.getElementById("taskDate");
const taskNotesEl = document.getElementById("taskNotes");
const taskTimeEl = document.getElementById("taskTime");
const taskPriorityEl = document.getElementById("taskPriority");

// --------------------------
// Settings UI init
// --------------------------
if (themeSelect) themeSelect.value = appSettings.theme;
if (defaultPrioritySelect) defaultPrioritySelect.value = appSettings.defaultPriority;
if (weekStartSelect) weekStartSelect.value = appSettings.weekStartsOn;

themeSelect?.addEventListener("change", () => {
  appSettings.theme = themeSelect.value;
  saveSettings();
  applyTheme();
});

defaultPrioritySelect?.addEventListener("change", () => {
  appSettings.defaultPriority = defaultPrioritySelect.value;
  saveSettings();
});

weekStartSelect?.addEventListener("change", () => {
  appSettings.weekStartsOn = weekStartSelect.value;
  saveSettings();
  generateCalendar();
  reRenderAllCalendarTasks();
});

// --------------------------
// Global Calendar Data
// --------------------------
const tasksByDate = {};
let editingTaskId = null;

// --------------------------
// Render Functions
// --------------------------
function addTaskToSidebar(task) {
  const div = document.createElement("div");
  div.dataset.id = task.id;

  div.style.cssText =
    "border:1px solid #aaa;margin:0.5rem;padding:0.5rem;border-radius:5px;";

  const title = document.createElement("strong");
  title.textContent = task.name;

  const meta = document.createElement("span");
  meta.textContent = ` ${task.date}${task.time ? ` (${task.time})` : ""}`;

  const notes = document.createElement("p");
  notes.textContent = task.notes;

  const pri = document.createElement("p");
  pri.textContent = `Priority: ${task.priority}`;

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.type = "button";

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.type = "button";

  editBtn.addEventListener("click", () => {
    editingTaskId = task.id;

    // Populate form (no HTML changes needed)
    taskNameEl.value = task.name;
    taskNotesEl.value = task.notes;
    taskDateEl.value = task.date;
    taskTimeEl.value = task.time;
    taskPriorityEl.value = task.priority;

    Taskscreen.style.display = "block";
  });

  deleteBtn.addEventListener("click", () => {
    taskManager.removeTask(task.id);
    div.remove();
    removeTaskFromCalendar(task);
  });

  div.append(title, meta, notes, pri, editBtn, deleteBtn);
  upComing.appendChild(div);
}

function removeTaskFromCalendar(task) {
  if (!tasksByDate[task.date]) return;
  tasksByDate[task.date] = tasksByDate[task.date].filter(t => t.id !== task.id);
  renderCalendarDay(task.date);
}

// --------------------------
// Calendar Functions
// --------------------------
function generateCalendar(yearsAhead = 3) {
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth(); // 0-11
  const todayD = today.getDate();

  calendar.innerHTML = "";

  // Weekday labels based on setting
  const weekdays =
    appSettings.weekStartsOn === "monday"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let year = today.getFullYear(); year <= today.getFullYear() + yearsAhead; year++) {
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const monthDiv = document.createElement("div");
      monthDiv.className = "month";

      // Use data-year/month for later lookup
      monthDiv.dataset.year = year;
      monthDiv.dataset.month = month + 1;

      const title = document.createElement("div");
      title.className = "month-title";
      title.textContent = firstDay.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      monthDiv.appendChild(title);

      // Weekday header row
      weekdays.forEach(w => {
        const label = document.createElement("div");
        label.className = "day-label";
        label.textContent = w;
        monthDiv.appendChild(label);
      });

      // Monday-start => +6 mod 7; Sunday-start => +0
      const offset = appSettings.weekStartsOn === "monday" ? 6 : 0;
      const firstWeekday = (firstDay.getDay() + offset) % 7;
      const lastDay = new Date(year, month + 1, 0).getDate();

      // Leading fillers before day 1
      for (let i = 0; i < firstWeekday; i++) {
        const filler = document.createElement("div");
        filler.className = "day filler";
        filler.style.opacity = "0.35";
        monthDiv.appendChild(filler);
      }

      // Day cells
      for (let d = 1; d <= lastDay; d++) {
        const day = document.createElement("div");
        day.className = "day";
        day.innerHTML = `<div class="day-number">${d}</div>`;

        // ✅ Highlight today
        const isToday = year === todayY && month === todayM && d === todayD;
        if (isToday) {
          day.classList.add("today");
          day.setAttribute("aria-current", "date");
          day.dataset.today = "true";
        }

        monthDiv.appendChild(day);
      }

      const totalCellsAfterTitle = 7 + firstWeekday + lastDay;
      const remainder = totalCellsAfterTitle % 7;
      if (remainder !== 0) {
        for (let i = 0; i < 7 - remainder; i++) {
          const filler = document.createElement("div");
          filler.className = "day filler";
          filler.style.opacity = "0.35";
          monthDiv.appendChild(filler);
        }
      }

      calendar.appendChild(monthDiv);
    }
  }
}

function renderCalendarDay(date) {
  const dayTasks = tasksByDate[date] || [];
  const [year, month, day] = date.split("-").map(Number);

  const monthDiv = calendar.querySelector(
    `.month[data-year="${year}"][data-month="${month}"]`
  );
  if (!monthDiv) return;

  monthDiv.querySelectorAll(".day").forEach(cell => {
    const num = Number(cell.querySelector(".day-number")?.textContent);
    if (num === day) {
      cell.querySelectorAll(".task, .task-blur-overlay").forEach(n => n.remove());

      dayTasks.slice(0, 3).forEach(t => {
        const tDiv = document.createElement("div");
        tDiv.className = "task";
        tDiv.textContent = `${t.label}: ${t.title} ${t.time}`;
        cell.appendChild(tDiv);
      });

      if (dayTasks.length > 3) {
        const blur = document.createElement("div");
        blur.className = "task-blur-overlay";
        cell.appendChild(blur);
      }
    }
  });
}

function reRenderAllCalendarTasks() {
  Object.keys(tasksByDate).forEach(renderCalendarDay);
}

// --------------------------
// Event Listeners
// --------------------------
taskButton?.addEventListener("click", () => {
  if (editingTaskId === null) {
    taskPriorityEl.value = appSettings.defaultPriority || Priority.low;
    taskNameEl.value = "";
    taskNotesEl.value = "";
    taskDateEl.value = "";
    taskTimeEl.value = "";
  }
  Taskscreen.style.display = "block";
});

closeTaskWindow?.addEventListener("click", () => {
  editingTaskId = null;
  form.reset();
  Taskscreen.style.display = "none";
});

setIcon?.addEventListener("click", () => {
  settingsTab.style.display = "block";
  setIcon.style.display = "none";
});

setBack?.addEventListener("click", () => {
  settingsTab.style.display = "none";
  setIcon.style.display = "block";
});

// --------------------------
// Form Submit
// --------------------------
form?.addEventListener("submit", e => {
  e.preventDefault();

  const name = taskNameEl.value.trim();
  const date = taskDateEl.value;
  if (!name || !date) return alert("Task name and date are required.");

  const notes = taskNotesEl.value.trim();
  const time = taskTimeEl.value.trim();
  const priority = taskPriorityEl.value || appSettings.defaultPriority || Priority.low;

  // ----- EDIT MODE -----
  if (editingTaskId !== null) {
    const task = taskManager.tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    // Remove old calendar entry
    removeTaskFromCalendar(task);

    // Update task
    task.name = name;
    task.notes = notes;
    task.date = date;
    task.time = time;
    task.priority = priority;

    taskManager.saveTasks();

    // Update sidebar
    upComing.querySelector(`[data-id="${task.id}"]`)?.remove();
    addTaskToSidebar(task);

    // Add to new date
    if (!tasksByDate[date]) tasksByDate[date] = [];
    tasksByDate[date].push({ id: task.id, label: priority, title: name, time });

    renderCalendarDay(date);

    editingTaskId = null;
    form.reset();
    Taskscreen.style.display = "none";
    return;
  }

  // ----- ADD MODE -----
  const task = taskManager.addTask(name, notes, date, time, priority);
  addTaskToSidebar(task);

  if (!tasksByDate[date]) tasksByDate[date] = [];
  tasksByDate[date].push({ id: task.id, label: task.priority, title: task.name, time: task.time });

  renderCalendarDay(date);
  form.reset();
  Taskscreen.style.display = "none";
});

// --------------------------
// Initial Render
// --------------------------
generateCalendar();
taskManager.tasks.forEach(task => {
  addTaskToSidebar(task);
  if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
  tasksByDate[task.date].push({
    id: task.id,
    label: task.priority,
    title: task.name,
    time: task.time,
  });
  renderCalendarDay(task.date);
});
