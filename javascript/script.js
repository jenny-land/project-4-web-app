// ===== API Configuration =====
const WEATHER_API_CONFIG = "";
const WEATHER_API_URL = "https://api.weatherapi.com/v1/current.json";

// Advice Slip API - no key
const ADVICE_API_URL = "https://api.adviceslip.com/advice";

// ===== DOM Elements =====
const cityInput = document.getElementById("city-input");
const fetchBtn = document.getElementById("fetch-btn");
const newAdviceBtn = document.getElementById("new-advice-btn");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const dataDisplay = document.getElementById("data-display");

// Clock Function (Time Section)
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  document.getElementById("current-time").textContent = time;
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
  const url = `${WEATHER_API_URL}?key=${WEATHER_API_CONFIG}&q=${encodeURIComponent(
    city
  )}&aqi=no`;

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
async function fetchNewAdvice() {
  // Disable button during fetch
  newAdviceBtn.disabled = true;
  newAdviceBtn.textContent = "Loading...";

  try {
    const adviceData = await fetchAdvice();
    displayAdvice(adviceData);
  } catch (err) {
    showError("Failed to fetch new advice. Please try again.");
  } finally {
    // "finally" always runs, whether there was an error or not
    newAdviceBtn.disabled = false;
    newAdviceBtn.textContent = "Get New Advice";
  }
}

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
  // Advice Slip API response structure:
  // data.slip.id, data.slip.advice
  adviceText.textContent = data.slip.advice;
}

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

// ===== EVENT LISTENERS =====

// Main fetch button
fetchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name");
    return;
  }

  fetchAllData(city);
});

// Allow Enter key to trigger fetch
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    fetchBtn.click();
  }
});

// New advice button
newAdviceBtn.addEventListener("click", fetchNewAdvice);

// ===== INITIAL LOAD =====
// Automatically fetch data for San Francisco when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Check if API key is set
  if (WEATHER_API_KEY === "YOUR_API_KEY_HERE") {
    showError("Please add your WeatherAPI.com API key to script.js");
    return;
  }

  // Fetch initial data
  fetchAllData("San Francisco");
});
