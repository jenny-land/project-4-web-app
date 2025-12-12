// ===== API Configuration =====
const WEATHER_API_URL =
  "https://c8b061f1-1fef-4c56-ab59-afffe7834ac3-00-38zmav078b4e0.kirk.replit.dev/get_weather";

// Advice Slip API - no key
const ADVICE_API_URL = "https://api.adviceslip.com/advice";

// ===== DOM Elements =====
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const dataDisplay = document.getElementById("data-display");

// Weather elements
const locationEl = document.getElementById("location");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const weatherIcon = document.getElementById("weather-icon");

// Advice element
const adviceText = document.getElementById("advice-text");

// ===== PERSISTENCE LAYER =====
const STORAGE_KEYS = {
  TIMEZONE: "startpage_timezone",
  CURRENT_TASK: "startpage_current_task",
  COMPLETED_TASKS: "startpage_completed_tasks",
  MOTIVATIONS: "startpage_motivations",
};

const state = {
  timezone: null,
  currentTask: null,
  completedTasks: [],
  motivations: [
    "Build cool things",
    "Learn something new",
    "Create positive interactions",
  ],
};

// ===== LOCAL STORAGE FUNCTIONS =====
function loadFromLocalStorage() {
  try {
    // Load timezone
    const savedTimezone = localStorage.getItem(STORAGE_KEYS.TIMEZONE);
    if (savedTimezone) {
      state.timezone = savedTimezone;
    }

    // Load current task
    const savedTask = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK);
    if (savedTask) {
      state.currentTask = JSON.parse(savedTask);
    }

    // Load completed tasks
    const savedCompleted = localStorage.getItem(STORAGE_KEYS.COMPLETED_TASKS);
    if (savedCompleted) {
      state.completedTasks = JSON.parse(savedCompleted);
    }

    // Load motivations
    const savedMotivations = localStorage.getItem(STORAGE_KEYS.MOTIVATIONS);
    if (savedMotivations) {
      state.motivations = JSON.parse(savedMotivations);
    }
  } catch (err) {
    console.error("Error loading localStorage:", err);
  }
}

function saveToLocalStorage(key, value) {
  try {
    if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
    console.log("Saved to localStorage:", key);
  } catch (err) {
    console.error("Error saving to localStorage:", err);
  }
}

// ===== CLOCK FUNCTION =====
function updateClock() {
  const now = new Date();

  // Use timezone from state if available
  const timeZone =
    state.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  document.getElementById("current-time").textContent = time;

  // Date Display
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  document.getElementById("current-date").textContent = date;
}

// ===== TIMEZONE FUNCTIONS =====
function initializeTimezone() {
  if (!state.timezone) {
    state.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    saveToLocalStorage(STORAGE_KEYS.TIMEZONE, state.timezone);
  }
  document.getElementById("timezone-select").value = state.timezone;
}

// ===== WEATHER API FUNCTION =====
async function fetchWeather(city) {
  const url = `${WEATHER_API_URL}/${city}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `City not found or API error (Status: ${response.status})`
      );
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Weather fetch error:", err);
    throw err;
  }
}

// ===== ADVICE API FUNCTION =====
async function fetchAdvice() {
  try {
    const response = await fetch(ADVICE_API_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch advice (Status: ${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Advice fetch error:", err);
    throw err;
  }
}

// ===== COMBINED FETCH FUNCTION =====
async function fetchAllData(city) {
  showLoading();
  hideError();

  try {
    const [weatherData, adviceData] = await Promise.all([
      fetchWeather(city),
      fetchAdvice(),
    ]);

    console.log("Weather data:", weatherData);
    console.log("Advice data:", adviceData);

    displayWeather(weatherData);
    displayAdvice(adviceData);

    hideLoading();
    showData();
  } catch (err) {
    hideLoading();
    showError(err.message);
  }
}

// ===== UI DISPLAY FUNCTIONS =====
function displayWeather(data) {
  const { location, current } = data;

  locationEl.textContent = `${location.name}, ${location.region}`;
  temperatureEl.textContent = `${Math.round(current.temp_f)}°F`;
  descriptionEl.textContent = current.condition.text;
  humidityEl.textContent = `Humidity: ${current.humidity}%`;
  windEl.textContent = `Wind: ${Math.round(current.wind_mph)} mph`;

  weatherIcon.textContent = getWeatherEmoji(current.condition.text);
}

function displayAdvice(data) {
  adviceText.textContent = `"${data.slip.advice}"`;
}

function getWeatherEmoji(condition) {
  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes("sunny") || lowerCondition.includes("clear"))
    return "☀️";
  if (lowerCondition.includes("cloud")) return "☁️";
  if (lowerCondition.includes("rain")) return "🌧️";
  if (lowerCondition.includes("storm") || lowerCondition.includes("thunder"))
    return "⛈️";
  if (lowerCondition.includes("snow")) return "❄️";
  if (lowerCondition.includes("fog") || lowerCondition.includes("mist"))
    return "🌫️";
  if (lowerCondition.includes("wind")) return "💨";

  return "🌤️";
}

// ===== UI STATE MANAGEMENT =====
function showLoading() {
  loading.classList.remove("hidden");
  dataDisplay.classList.add("hidden");
}

function hideLoading() {
  loading.classList.add("hidden");
}

function showData() {
  dataDisplay.classList.remove("hidden");
}

function showError(message) {
  error.textContent = `Error: ${message}`;
  error.classList.remove("hidden");
}

function hideError() {
  error.classList.add("hidden");
}

// ===== MOTIVATIONS FUNCTIONS =====
function renderMotivations() {
  // Render mobile version
  const listMobile = document.getElementById("motivations-list");
  listMobile.innerHTML = "";
  state.motivations.forEach((motivation) => {
    const li = document.createElement("li");
    li.textContent = motivation;
    listMobile.appendChild(li);
  });

  // Render desktop version
  const listDesktop = document.getElementById("motivations-list-desktop");
  listDesktop.innerHTML = "";
  state.motivations.forEach((motivation) => {
    const li = document.createElement("li");
    li.textContent = motivation;
    listDesktop.appendChild(li);
  });
}

// ===== TASK FUNCTIONS =====
function addTask(taskText) {
  const newTask = {
    id: Date.now(),
    text: taskText,
    completed: false,
    timestamp: new Date().toISOString(),
  };

  state.currentTask = newTask;
  saveToLocalStorage(STORAGE_KEYS.CURRENT_TASK, newTask);
  renderTasks();
}

function renderTasks() {
  const display = document.getElementById("task-display");
  display.innerHTML = "";

  // Render current task
  if (state.currentTask) {
    const taskEl = document.createElement("div");
    taskEl.className = "task-item";

    const checkbox = document.createElement("div");
    checkbox.className = "task-checkbox";
    checkbox.textContent = state.currentTask.completed ? "☑" : "☐";
    checkbox.addEventListener("click", () => toggleTask(state.currentTask.id));

    const text = document.createElement("p");
    text.className = "task-text";
    if (state.currentTask.completed) {
      taskEl.classList.add("completed");
    }
    text.textContent = state.currentTask.text;

    taskEl.appendChild(checkbox);
    taskEl.appendChild(text);
    display.appendChild(taskEl);
  }

  // Render completed history
  state.completedTasks.forEach((task) => {
    const taskEl = document.createElement("div");
    taskEl.className = "task-item completed";

    const checkbox = document.createElement("div");
    checkbox.className = "task-checkbox";
    checkbox.textContent = "☑";

    const text = document.createElement("p");
    text.className = "task-text";
    text.textContent = task.text;

    taskEl.appendChild(checkbox);
    taskEl.appendChild(text);
    display.appendChild(taskEl);
  });
}

function toggleTask(taskId) {
  if (state.currentTask && state.currentTask.id === taskId) {
    const wasCompleted = state.currentTask.completed;
    state.currentTask.completed = !state.currentTask.completed;

    if (!wasCompleted && state.currentTask.completed) {
      // Just became completed!
      triggerConfetti();
      moveToHistory(state.currentTask);
    }

    saveToLocalStorage(STORAGE_KEYS.CURRENT_TASK, state.currentTask);
    renderTasks();
  }
}

function triggerConfetti() {
  if (typeof confetti !== "undefined") {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
}

function moveToHistory(task) {
  state.completedTasks.unshift(task);
  state.completedTasks = state.completedTasks.slice(0, 3);
  saveToLocalStorage(STORAGE_KEYS.COMPLETED_TASKS, state.completedTasks);
}

// ===== EVENT LISTENERS =====

// Task form submission
document.getElementById("task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("task-input");
  const text = input.value.trim();
  if (text) {
    addTask(text);
    input.value = "";
  }
});

// Timezone select - change timezone
document.getElementById("timezone-select").addEventListener("change", (e) => {
  state.timezone = e.target.value;
  saveToLocalStorage(STORAGE_KEYS.TIMEZONE, state.timezone);
  updateTimezoneName();
  updateClock();
  e.target.classList.add("hidden");
});

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  // Load saved data
  loadFromLocalStorage();

  // Initialize timezone
  initializeTimezone();

  // Start clock
  updateClock();
  setInterval(updateClock, 1000);

  // Render UI
  renderMotivations();
  renderTasks();

  // Fetch API data
  fetchAllData("San Francisco");
});
