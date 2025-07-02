// calendar.js - Event Calendar Module
console.log("calendar.js loaded");

// Calendar state
let currentDate = new Date();
let selectedDate = null;
let events = [];
let isEditingEvent = false;
let editingEventId = null;

// Calendar utility functions
function getDaysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(date) {
  const options = { year: "numeric", month: "long" };
  return date.toLocaleDateString("en-US", options);
}

// Load calendar events from storage
async function loadCalendarEvents() {
  try {
    const response = await fetch("data/calendar.json");
    if (response.ok) {
      events = await response.json();
    } else {
      // If file doesn't exist, start with empty events array
      events = [];
    }
  } catch (error) {
    console.log("No existing calendar data found, starting fresh");
    events = [];
  }
  renderCalendar();
}

// Save calendar events
async function saveCalendarEvents() {
  try {
    const response = await fetch("http://localhost:3000/save-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: events }),
    });

    const result = await response.json();
    if (result.success) {
      alert("Calendar events saved successfully!");
    } else {
      alert("Failed to save events: " + (result.error || "Unknown error"));
    }
  } catch (error) {
    alert("Failed to save events: " + error.message);
  }
}

// Render the calendar grid
function renderCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  const currentMonthSpan = document.getElementById("currentMonth");

  if (!calendarGrid || !currentMonthSpan) return;

  // Update month display
  currentMonthSpan.textContent = formatDisplayDate(currentDate);

  // Clear previous calendar
  calendarGrid.innerHTML = "";

  // Add day headers
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayHeaders.forEach((day) => {
    const dayHeader = document.createElement("div");
    dayHeader.textContent = day;
    dayHeader.style.cssText = `
      padding: 8px;
      background: #f5f5f5;
      font-weight: bold;
      text-align: center;
      border: 1px solid #ddd;
    `;
    calendarGrid.appendChild(dayHeader);
  });

  // Get calendar data
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.style.cssText = `
      min-height: 100px;
      background: #f9f9f9;
      border: 1px solid #ddd;
    `;
    calendarGrid.appendChild(emptyDay);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement("div");
    const cellDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    const dateStr = formatDate(cellDate);
    const isToday = isCurrentMonth && day === today.getDate();

    // Get events for this day
    const dayEvents = events.filter((event) => event.date === dateStr);

    dayCell.style.cssText = `
      min-height: 100px;
      background: ${isToday ? "#e3f2fd" : "white"};
      border: 1px solid #ddd;
      padding: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;

    // Day number
    const dayNumber = document.createElement("div");
    dayNumber.textContent = day;
    dayNumber.style.cssText = `
      font-weight: bold;
      margin-bottom: 4px;
      color: ${isToday ? "#1976d2" : "#333"};
    `;
    dayCell.appendChild(dayNumber);

    // Events for this day
    dayEvents.forEach((event) => {
      const eventDiv = document.createElement("div");
      eventDiv.textContent = event.title;
      eventDiv.style.cssText = `
        background: ${getEventColor(event.type)};
        color: white;
        padding: 2px 4px;
        margin: 1px 0;
        border-radius: 3px;
        font-size: 11px;
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;
      eventDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        editEvent(event);
      });
      dayCell.appendChild(eventDiv);
    });

    // Click handler for day cell
    dayCell.addEventListener("click", () => {
      selectDate(cellDate);
    });

    dayCell.addEventListener("mouseenter", () => {
      if (!isToday) dayCell.style.background = "#f5f5f5";
    });

    dayCell.addEventListener("mouseleave", () => {
      if (!isToday) dayCell.style.background = "white";
    });

    calendarGrid.appendChild(dayCell);
  }
}

// Get color for event type
function getEventColor(type) {
  const colors = {
    Webinar: "#4caf50",
    Workshop: "#2196f3",
    Conference: "#ff9800",
    "User Group": "#9c27b0",
    "Executive Event": "#f44336",
    Other: "#607d8b",
  };
  return colors[type] || "#607d8b";
}

// Select a date on the calendar
function selectDate(date) {
  selectedDate = date;
  showEventForm();

  // Set the date in the form
  const eventDateInput = document.getElementById("eventDate");
  if (eventDateInput) {
    eventDateInput.value = formatDate(date);
  }
}

// Show event form
function showEventForm(event = null) {
  const eventDetails = document.getElementById("eventDetails");
  if (!eventDetails) return;

  eventDetails.style.display = "block";

  if (event) {
    // Editing existing event
    isEditingEvent = true;
    editingEventId = event.id;

    document.getElementById("eventTitle").value = event.title || "";
    document.getElementById("eventDate").value = event.date || "";
    document.getElementById("eventType").value = event.type || "";
    document.getElementById("eventRegion").value = event.region || "";
    document.getElementById("eventDescription").value = event.description || "";
    document.getElementById("eventStatus").value = event.status || "Planning";
  } else {
    // Creating new event
    isEditingEvent = false;
    editingEventId = null;

    document.getElementById("eventTitle").value = "";
    document.getElementById("eventDate").value = selectedDate
      ? formatDate(selectedDate)
      : "";
    document.getElementById("eventType").value = "";
    document.getElementById("eventRegion").value = "";
    document.getElementById("eventDescription").value = "";
    document.getElementById("eventStatus").value = "Planning";
  }
}

// Hide event form
function hideEventForm() {
  const eventDetails = document.getElementById("eventDetails");
  if (eventDetails) {
    eventDetails.style.display = "none";
  }
  isEditingEvent = false;
  editingEventId = null;
  selectedDate = null;
}

// Edit existing event
function editEvent(event) {
  showEventForm(event);
}

// Save event
function saveEvent() {
  const title = document.getElementById("eventTitle").value.trim();
  const date = document.getElementById("eventDate").value;
  const type = document.getElementById("eventType").value;
  const region = document.getElementById("eventRegion").value;
  const description = document.getElementById("eventDescription").value.trim();
  const status = document.getElementById("eventStatus").value;

  if (!title || !date) {
    alert("Please enter both title and date for the event.");
    return;
  }

  const eventData = {
    id: isEditingEvent ? editingEventId : `event-${Date.now()}`,
    title,
    date,
    type,
    region,
    description,
    status,
    createdAt: isEditingEvent
      ? events.find((e) => e.id === editingEventId)?.createdAt ||
        new Date().toISOString()
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isEditingEvent) {
    // Update existing event
    const eventIndex = events.findIndex((e) => e.id === editingEventId);
    if (eventIndex !== -1) {
      events[eventIndex] = eventData;
    }
  } else {
    // Add new event
    events.push(eventData);
  }

  hideEventForm();
  renderCalendar();

  // Auto-save after adding/editing event
  saveCalendarEvents();
}

// Delete selected events
function deleteSelectedEvents() {
  // For now, this could be enhanced to allow multi-selection
  // Currently it would work with the last edited event
  if (isEditingEvent && editingEventId) {
    if (confirm("Are you sure you want to delete this event?")) {
      events = events.filter((e) => e.id !== editingEventId);
      hideEventForm();
      renderCalendar();
      saveCalendarEvents();
    }
  } else {
    alert("Please select an event to delete by clicking on it first.");
  }
}

// Navigation functions
function goToPrevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function goToNextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

function goToToday() {
  currentDate = new Date();
  renderCalendar();
}

// Populate region dropdown
function populateRegionDropdown() {
  const regionSelect = document.getElementById("eventRegion");
  if (!regionSelect) return;

  // Get regions from planning module if available
  const regions = window.planningModule?.constants?.regionOptions || [
    "JP & Korea",
    "South APAC",
    "SAARC",
  ];

  // Clear existing options except the first one
  while (regionSelect.children.length > 1) {
    regionSelect.removeChild(regionSelect.lastChild);
  }

  // Add region options
  regions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
  });
}

// Initialize calendar functionality
function initializeCalendar() {
  console.log("Initializing calendar...");

  // Populate region dropdown
  populateRegionDropdown();

  // Set up event listeners
  const addEventBtn = document.getElementById("addCalendarEvent");
  const deleteEventBtn = document.getElementById("deleteCalendarEvent");
  const saveEventsBtn = document.getElementById("saveCalendarEvents");
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");
  const todayBtn = document.getElementById("todayBtn");
  const saveEventBtn = document.getElementById("saveEvent");
  const cancelEventBtn = document.getElementById("cancelEvent");

  if (addEventBtn) {
    addEventBtn.addEventListener("click", () => {
      selectedDate = new Date();
      showEventForm();
    });
  }

  if (deleteEventBtn) {
    deleteEventBtn.addEventListener("click", deleteSelectedEvents);
  }

  if (saveEventsBtn) {
    saveEventsBtn.addEventListener("click", saveCalendarEvents);
  }

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", goToPrevMonth);
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", goToNextMonth);
  }

  if (todayBtn) {
    todayBtn.addEventListener("click", goToToday);
  }

  if (saveEventBtn) {
    saveEventBtn.addEventListener("click", saveEvent);
  }

  if (cancelEventBtn) {
    cancelEventBtn.addEventListener("click", hideEventForm);
  }

  // Load events and render calendar
  loadCalendarEvents();
}

// Handle calendar tab routing
function handleCalendarRouting() {
  const hash = location.hash;
  if (hash === "#calendar") {
    // Refresh calendar when tab is viewed
    setTimeout(renderCalendar, 100);
  }
}

// Module exports
const calendarModule = {
  initializeCalendar,
  handleCalendarRouting,
  loadCalendarEvents,
  saveCalendarEvents,
  renderCalendar,
  goToToday,
  populateRegionDropdown,
};

// Export to window for access from other modules
window.calendarModule = calendarModule;

export default calendarModule;
