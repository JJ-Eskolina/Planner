// tasks grouped by date (YYYY-MM-DD)
// you'll replace this with saved data later
const tasks = {
  "2025-11-15": [
    { label: "Work", title: "Meeting", time: "10:00" },
    { label: "Gym", title: "Leg Day", time: "18:00" },
    { label: "Study", title: "JS Project", time: "20:00" },
    { label: "Extra", title: "Overflow", time: "22:00" }
  ]
};

function generateCalendar(yearsAhead = 3) {
  const calendar = document.getElementById("calendar");
  const today = new Date();
  const startYear = today.getFullYear();
  const endYear = startYear + yearsAhead;

  // weekday labels for each month grid
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // stores the DOM element of the current month,
  // so we can scroll to it after generating everything
  let thisMonthElement = null;

  // loop through multiple years
  for (let year = startYear; year <= endYear; year++) {
    // loop through all 12 months
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);        // first day of the month
      const lastDay = new Date(year, month + 1, 0);     // last day of the month

      const monthDiv = document.createElement("div");
      monthDiv.className = "month";

      // detect the current month so we can auto-scroll to it later
      if (year === today.getFullYear() && month === today.getMonth()) {
        thisMonthElement = monthDiv;
      }

      // month title (ex. "November 2025")
      const title = document.createElement("div");
      title.className = "month-title";
      title.textContent = firstDay.toLocaleString("default", {
        month: "long",
        year: "numeric"
      });
      monthDiv.appendChild(title);

      // add weekday header row (Mon → Sun)
      dayLabels.forEach(label => {
        const labelDiv = document.createElement("div");
        labelDiv.className = "day-label";
        labelDiv.textContent = label;
        monthDiv.appendChild(labelDiv);
      });

      // convert JS weekday (Sun = 0) to Monday-based index
      const firstWeekday = (firstDay.getDay() + 6) % 7;

      // leading filler days from previous month
      for (let i = 0; i < firstWeekday; i++) {
        const filler = document.createElement("div");
        filler.className = "day filler";
        filler.textContent = new Date(year, month, -(firstWeekday - 1 - i)).getDate();
        filler.style.opacity = "0.35";
        monthDiv.appendChild(filler);
      }

      // loop through all actual days
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const day = document.createElement("div");
        day.className = "day";

        // highlight today's date visually
        if (
          d === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear()
        ) {
          day.classList.add("today");
        }

        // number in the top-left corner of a cell
        day.innerHTML = `<div class="day-number">${d}</div>`;

        // check if this day has saved tasks
        const taskKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayTasks = tasks[taskKey] || [];

        // show tasks inside the day cell
        if (dayTasks.length > 0) {
          const maxVisible = 3;  // only show first 3 tasks

          // add the first 3 tasks normally
          dayTasks.slice(0, maxVisible).forEach(t => {
            const tDiv = document.createElement("div");
            tDiv.className = "task";

            tDiv.innerHTML = `
              <div class="task-label">${t.label}</div>
              <div class="task-title">${t.title}</div>
              <div class="task-time">${t.time}</div>
            `;
            day.appendChild(tDiv);
          });

          // if there are more than 3 tasks, add a blur indicator
          if (dayTasks.length > maxVisible) {
            const blurOverlay = document.createElement("div");
            blurOverlay.className = "task-blur-overlay";
            day.appendChild(blurOverlay);
          }
        }

        monthDiv.appendChild(day);
      }

      // trailing filler days from next month
      const totalCells = firstWeekday + lastDay.getDate(); // how many cells filled
      const remainder = totalCells % 7;

      if (remainder !== 0) {
        const trailing = 7 - remainder; // number of cells to complete grid row
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

  // once all months exist → scroll to current month
  if (thisMonthElement) {
    setTimeout(() => {
      thisMonthElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }
}

generateCalendar();