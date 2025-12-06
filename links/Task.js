const Priority = {
  low: "low",
  medium: "medium",
  high: "high"
};

class Task {
  constructor(id, name, notes, time, priority) {
    this.id = id;
    this.name = name;
    this.notes = notes;
    this.time = time;

    switch (priority) {
      case "low":
        this.priority = Priority.low;
        break;
      case "medium":
        this.priority = Priority.medium;
        break;
      case "high":
        this.priority = Priority.high;
        break;
      default:
        this.priority = Priority.low; 
        break;
    }
  }
}

class TaskManager {
  constructor() {
    this.id = 0;
    this.tasks = [];
  }

  addTask(name, notes, time, priority) {
    this.id++;

    const task = new Task(
      this.id,
      name,
      notes,
      time,
      priority
    );

    this.tasks.push(task);
  }

  editTask(id, name, notes, time, priority) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    task.name = name;
    task.notes = notes;
    task.time = time;
    task.priority = priority;
  }

  viewTasks() {
    this.tasks.forEach(t => {
      console.log(t.name);
      console.log(t.time);
      console.log(t.notes);
    });
  }
}
