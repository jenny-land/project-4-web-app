// ===== API Configuration =====
const WEATHER_API_URL =
  "https://c8b061f1-1fef-4c56-ab59-afffe7834ac3-00-38zmav078b4e0.kirk.replit.dev/get_weather";

// Advice Slip API - no key
const ADVICE_API_URL = "https://api.adviceslip.com/advice";

// ===== DOM Elements =====
// const newAdviceBtn = document.getElementById("new-advice-btn");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const dataDisplay = document.getElementById("data-display");

// ===== Persistance Layer =====
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

// Clock Function (Time Section)
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  document.getElementById("current-time").textContent = time;

  // Date Display
  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  document.getElementById("current-date").textContent = date;
}
setInterval(updateClock, 1000);
updateClock();

// Weather elements
const locationEl = document.getElementById("location");
const temperatureEl = document.getElementById("temperature");
const descriptionEl = document.getElementById("description");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const weatherIcon = document.getElementById("weather-icon");

// Advice element
const adviceText = document.getElementById("advice-text");

// ===== WEATHER API FUNCTION =====
/**
 * Fetches weather data for a given city
 * @param {string} city - The city name to search for
 * @returns {Promise<Object>} Weather data object
 */
async function fetchWeather(city) {
  // STEP 1: Build the URL with query parameters
  // encodeURIComponent() makes the city name URL-safe (handles spaces, special chars)
  const url = `${WEATHER_API_URL}/${city}`;

  try {
    // STEP 2: Make the fetch request
    const response = await fetch(url);

    // STEP 3: Check if the request was successful
    // HTTP status codes: 200-299 = success, 400-499 = client error, 500-599 = server error
    if (!response.ok) {
      // If status is not OK, error to jump to the catch block
      throw new Error(
        `City not found or API error (Status: ${response.status})`
      );
    }

    // STEP 4: Parse the JSON response
    const data = await response.json();

    // STEP 5: Return the parsed data
    return data;
  } catch (err) {
    // STEP 6: Handle any errors (network issues, invalid JSON, or our custom error)
    console.error("Weather fetch error:", err);
    throw err; // Re-throw so the calling function knows there was an error
  }
}

// ===== ADVICE API FUNCTION =====
/**
 * Fetches random advice from the Advice Slip API
 * @returns {Promise<Object>} Advice data object
 */
async function fetchAdvice() {
  try {
    // This API is simpler - no parameters needed, just fetch!
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
/**
 *run multiple async operations in parallel
 */
async function fetchAllData(city) {
  // Show loading state
  showLoading();
  hideError();

  try {
    // Promise.all() runs multiple Promises in PARALLEL (at the same time)

    const [weatherData, adviceData] = await Promise.all([
      fetchWeather(city),
      fetchAdvice(),
    ]);

    // If we get here, both fetches succeeded!
    console.log("Weather data:", weatherData);
    console.log("Advice data:", adviceData);

    // Update the UI with the fetched data
    displayWeather(weatherData);
    displayAdvice(adviceData);

    // Hide loading, show data
    hideLoading();
    showData();
  } catch (err) {
    // If either fetch fails, we end up here
    hideLoading();
    showError(err.message);
  }
}

// ===== WEATHER-ONLY FETCH (for when user just wants new advice) =====
// async function fetchNewAdvice() {
//   // Disable button during fetch
//   newAdviceBtn.disabled = true;
//   newAdviceBtn.textContent = "Loading...";

//   try {
//     const adviceData = await fetchAdvice();
//     displayAdvice(adviceData);
//   } catch (err) {
//     showError("Failed to fetch new advice. Please try again.");
//   } finally {
//     // "finally" always runs, whether there was an error or not
//     newAdviceBtn.disabled = false;
//     newAdviceBtn.textContent = "Get New Advice";
//   }
// }

// ===== UI DISPLAY FUNCTIONS =====

/**
 * Display weather data in the UI
 * @param {Object} data - Weather API response object
 */
function displayWeather(data) {
  // WeatherAPI.com response structure:
  // data.location.name, data.location.region, data.location.country
  // data.current.temp_f, data.current.condition.text, data.current.humidity, etc.

  const { location, current } = data;

  locationEl.textContent = `${location.name}, ${location.region}`;
  temperatureEl.textContent = `${Math.round(current.temp_f)}°F`;
  descriptionEl.textContent = current.condition.text;
  humidityEl.textContent = `Humidity: ${current.humidity}%`;
  windEl.textContent = `Wind: ${Math.round(current.wind_mph)} mph`;

  // Set weather icon based on condition
  weatherIcon.textContent = getWeatherEmoji(current.condition.text);
}

/**
 * Display advice in the UI
 * @param {Object} data - Advice API response object
 */
function displayAdvice(data) {
  document.getElementById("advice-text").textContent = `"${data.slip.advice}"`;
}

// function displayAdvice(data) {
//   // Advice Slip API response structure:
//   // data.slip.id, data.slip.advice
//   adviceText.textContent = data.slip.advice;
// }

/**
 * Get appropriate emoji for weather condition
 * @param {string} condition - Weather condition text
 * @returns {string} Emoji representing the weather
 */
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

  return "🌤️"; // Default: partly cloudy
}

// ===== UI state Managment =====
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

// ===== EVENT LISTENERS =====

// New advice button
// newAdviceBtn.addEventListener("click", fetchNewAdvice);

// ===== INITIAL LOAD =====
// Automatically fetch data for San Francisco when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Fetch initial data
  fetchAllData("San Francisco");
});

// Local Storage infastructure
function loadFromLocalStorage() {
  try {
    const savedMotivations = localStorage.getItem(STORAGE_KEYS.MOTIVATIONS);
    if (savedMotivations) {
      state.motivations = JSON.parse(savedMotivations);
    }
  } catch (err) {
    console.error("Error loading localStorage:", err);
  }
}

function saveToLocalStorage(key, value) {
  console.log("saveToLocalStorage", key, value);
  try {
    if (typeof value === "object") {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.setItem(key, value);
    }
  } catch (err) {
    console.error("Error saving to localStorage:", err);
  }
}
// motivations (show motivations list in mobile view)
function renderMotivations() {
  const list = document.getElementById("motivations-list");
  list.innerHTML = "";
  state.motivations.forEach((motivation) => {
    const li = document.createElement("li");
    li.textContent = motivation;
    list.appendChild(li);
  });
}

// Call in DOMContentLoaded
renderMotivations();

// Call on page load
document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  updateClock();
  setInterval(updateClock, 1000);
});

//Task Section
//"Add Task" Function
function addTask(taskText) {
  const newTask = {
    id: Date.now(),
    text: taskText,
    completed: false,
    timestamp: new Date().toISOString(),
  };

  state.currentTask = newTask;
  console.log("inside add task");
  saveToLocalStorage(STORAGE_KEYS.CURRENT_TASK, newTask);
  renderTasks();
}

// function renderTasks() {
//   const display = document.getElementById("task-display");
//   display.innerHTML = "";

//   if (state.currentTask) {
//     const taskEl = document.createElement("div");
//     taskEl.className = "task-item";
//     taskEl.innerHTML = `
//             <div class="task-checkbox" data-id="${state.currentTask.id}">☐</div>
//             <p class="task-text">${state.currentTask.text}</p>
//         `;
//     display.appendChild(taskEl);
//   }
// }

// Event listener
document.getElementById("task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("task-input");
  const text = input.value.trim();
  if (text) {
    addTask(text);
    input.value = "";
  }
});

//task checkbox

function renderTasks() {
  const display = document.getElementById("task-display");
  display.innerHTML = "";

  if (state.currentTask) {
    const taskEl = document.createElement("div");
    taskEl.className = "task-item";

    const checkbox = document.createElement("div");
    checkbox.className = "task-checkbox";
    checkbox.textContent = state.currentTask.completed ? "☑" : "☐";
    checkbox.addEventListener("click", () => toggleTask(state.currentTask.id));

    const text = document.createElement("p");
    text.className = "task-text";
    if (state.currentTask.completed) text.classList.add("completed");
    text.textContent = state.currentTask.text;

    taskEl.appendChild(checkbox);
    taskEl.appendChild(text);
    display.appendChild(taskEl);

    // updated render task
    if (state.currentTask.completed) {
      const prompt = document.createElement("p");
      prompt.className = "next-task-prompt";
      prompt.textContent = "Next task?";
      display.appendChild(prompt);
    }
  }

  // Render completed history
  state.completedTasks.forEach((task) => {
    const taskEl = document.createElement("div");
    taskEl.className = "task-item";
    taskEl.innerHTML = `
            <div class="task-checkbox">☑</div>
            <p class="task-text completed">${task.text}</p>
        `;
    display.appendChild(taskEl);
  });
}

// function renderTasks() {
//   const display = document.getElementById("task-display");
//   display.innerHTML = "";

//   // Render current task
//   if (state.currentTask) {
//     // ... existing code ...

//     // Add "Next task?" if completed
//     if (state.currentTask.completed) {
//       const prompt = document.createElement("p");
//       prompt.className = "next-task-prompt";
//       prompt.textContent = "Next task?";
//       display.appendChild(prompt);
//     }
//   }

//   // Render completed history
//   state.completedTasks.forEach((task) => {
//     const taskEl = document.createElement("div");
//     taskEl.className = "task-item";
//     taskEl.innerHTML = `
//             <div class="task-checkbox">☑</div>
//             <p class="task-text completed">${task.text}</p>
//         `;
//     display.appendChild(taskEl);
//   });
// }
//^fix this version ^ asee note 14

//-----

// function toggleTask(taskId) {
//   if (state.currentTask && state.currentTask.id === taskId) {
//     state.currentTask.completed = !state.currentTask.completed;
//     saveToLocalStorage(STORAGE_KEYS.CURRENT_TASK, state.currentTask);
//     renderTasks();
//   }

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

//confetti function
function triggerConfetti() {
  if (typeof confetti !== "undefined") {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }
}

//task history array
function moveToHistory(task) {
  state.completedTasks.unshift(task);
  state.completedTasks = state.completedTasks.slice(0, 3);
  console.log("aboutosavetolocalstorage");
  saveToLocalStorage(STORAGE_KEYS.COMPLETED_TASKS, state.completedTasks);
}

// // Update toggleTask to move to history when completed
// if (!wasCompleted && state.currentTask.completed) {
//   triggerConfetti();
//   moveToHistory(state.currentTask);
// }

//Make Time Zone Selector work- change zone, clock updates (note 16)
function initializeTimezone() {
  if (!state.timezone) {
    state.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    saveToLocalStorage(STORAGE_KEYS.TIMEZONE, state.timezone);
  }
  document.getElementById("timezone-select").value = state.timezone;
  updateTimezoneName();
}

function updateTimezoneName() {
  const select = document.getElementById("timezone-select");
  const selectedOption = select.options[select.selectedIndex];
  document.getElementById("timezone-name").textContent = selectedOption.text;
}

// function updateClock() {
//   const now = new Date();
//   const time = new Intl.DateTimeFormat("en-US", {
//     timeZone: state.timezone,
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: false,
//   }).format(now);

//   document.getElementById("current-time").textContent = time;

//   const date = new Intl.DateTimeFormat("en-US", {
//     timeZone: state.timezone,
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   }).format(now);

//   document.getElementById("current-date").textContent = date;
// }

// Event listeners
document.getElementById("timezone-button").addEventListener("click", () => {
  document.getElementById("timezone-select").classList.toggle("hidden");
});

document.getElementById("timezone-select").addEventListener("change", (e) => {
  state.timezone = e.target.value;
  saveToLocalStorage(STORAGE_KEYS.TIMEZONE, state.timezone);
  updateTimezoneName();
  updateClock();
  e.target.classList.add("hidden");
});

// Call in DOMContentLoaded
initializeTimezone();
