// DOM ELEMENTS
const elements = {
    cityInput: document.querySelector('.city-input'),
    searchBtn: document.querySelector('.input-btn'),

    weatherInfoSection: document.querySelector('.weather-info'),
    searchCitySection: document.querySelector('.search-city'),
    notFoundSection: document.querySelector('.not-found'),

    countryTxt: document.querySelector('.country-txt'),
    tempTxt: document.querySelector('.temp-txt'),
    feelsLikeTxt: document.querySelector('.feels-like-txt'),
    conditionTxt: document.querySelector('.condition-txt'),
    humidityValueTxt: document.querySelector('.humidity-value-txt'),
    windValueTxt: document.querySelector('.wind-value-txt'),
    weatherSummaryImg: document.querySelector('.weather-summary-img'),
    currentLocalTime: document.querySelector('.current-date-txt'),
    sunriseTxt: document.querySelector('.sunrise-txt'),
    sunsetTxt: document.querySelector('.sunset-txt'),

    forecastItemsContainer: document.querySelector('.forecast-items-container'),

    weatherTipText: document.querySelector('.tip-text'),
    tipIcon: document.querySelector('.tip-icon'),
    tipContainer: document.querySelector('.weather-tips'),

    pinButton: document.querySelector('.header-pin'),
};

// CONSTS
const apiKey = 'd7729a8df9660f0d1023e8339e7403a9';
const FORECAST_TIME = '12:00:00';
const LOCALE_DATE = 'en-GB';
const LOCALE_FORECAST = 'en-US';

// EVENTS HANDLERS
if (elements.pinButton) {
    elements.pinButton.addEventListener('click', useCurrentLocation)
}

elements.searchBtn.addEventListener('click', () => {
    const city = elements.cityInput.value.trim()
    if (city) {
        updateWeatherInfo(city)
        elements.cityInput.value = ''
        elements.cityInput.blur()
    }
})

elements.cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const city = elements.cityInput.value.trim()
        if (city) {
            updateWeatherInfo(city)
            elements.cityInput.value = ''
            elements.cityInput.blur()
        }
    }
})

// TOAST NOTIFICATIONS
function createToastContainer() {
    let container = document.getElementById('toast-container')
    if (!container) {
        container = document.createElement('div')
        container.id = 'toast-container'
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '300px',
        })
        document.body.appendChild(container)
    }
    return container
}

// SHOW TOAST
function showToast(message, type = 'info') {
    const container = createToastContainer()

    const toast = document.createElement('div')
    toast.textContent = message
    Object.assign(toast.style, {
        minWidth: '200px',
        padding: '12px 20px',
        color: '#fff',
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        opacity: '0.9',
        fontFamily: 'sans-serif',
        cursor: 'pointer',
        transition: 'opacity 0.5s ease',
        userSelect: 'none',
    })

    if (type === 'error') {
        toast.style.backgroundColor = '#e74c3c'
    } else if (type === 'success') {
        toast.style.backgroundColor = '#2ecc71'
    } else {
        toast.style.backgroundColor = '#3498db'
    }

    // CLICK CLOSE
    toast.addEventListener('click', () => {
        toast.style.opacity = '0'
        setTimeout(() => container.removeChild(toast), 500)
    })

    container.appendChild(toast)

    // AUTOMATIC CLOSE AFTER 3 SECONDS
    setTimeout(() => {
        toast.style.opacity = '0'
        setTimeout(() => {
            if (toast.parentElement) container.removeChild(toast)
        }, 500)
    }, 3000)
}

// FETCH DATA
async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }
    return data;
}

async function getFetchDataByCoords(endPoint, lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
    }
    return data;
}


// WEATHER ICON
function getWeatherIcon(id) {
    if (id <= 232) return 'thunderstorm.svg'
    if (id <= 321) return 'drizzle.svg'
    if (id <= 531) return 'rain.svg'
    if (id <= 622) return 'snow.svg'
    if (id <= 781) return 'atmosphere.svg'
    if (id === 800) return 'clear.svg'
    if (id >= 801 && id <= 804) return 'clouds.svg'
}

// SUNRISE/SUNSET TIME
function getTimeSun(unix, timezoneOffset) {
    const date = new Date((unix + timezoneOffset) * 1000)
    return date.toLocaleTimeString(LOCALE_DATE, { hour: '2-digit', minute: '2-digit' })
}

// CURRENT DATE
function getCurrentDate() {
    const currentDate = new Date()
    const options = { weekday: 'short', day: '2-digit', month: 'short' }
    return currentDate.toLocaleDateString(LOCALE_DATE, options)
}

// CURRENT TIME (LOCAL TIME)
function getLocalTime(timezoneOffset) {
    const utc = Date.now() + new Date().getTimezoneOffset() * 60000
    const localDate = new Date(utc + timezoneOffset * 1000);
    return localDate.toLocaleTimeString(LOCALE_DATE, { hour: '2-digit', minute: '2-digit' })
}

// WEATHER TIPS
function getWeatherTip(condition) {
    const tips = {
        Clear: "Great weather for a walk! Don't forget your sunglasses.",
        Clouds: "It might be cool — take a light jacket.",
        Rain: "Take an umbrella with you.",
        Snow: "Dress warmly, it’s slippery outside.",
        Thunderstorm: "Better to stay indoors.",
        Drizzle: "Light rain, but an umbrella will come in handy.",
        Atmosphere: "Visibility is poor — be careful."
    };
    return tips[condition] || "Have a nice day!";
}

// RENDER WEATHER
function renderWeatherData(weatherData) {
    const {
        name: cityName,
        sys: { country },
        main: { temp, humidity, feels_like },
        weather: [{ id, main }],
        wind: { speed },
        sys: { sunrise, sunset },
        timezone
    } = weatherData;

    elements.countryTxt.textContent = `${cityName}, ${country}`;
    elements.tempTxt.textContent = Math.round(temp) + '°C';
    elements.feelsLikeTxt.textContent = `Feels like: ${Math.round(feels_like)}°C`;
    elements.conditionTxt.textContent = main;
    elements.humidityValueTxt.textContent = humidity + '%';
    elements.windValueTxt.textContent = speed + ' M/s';

    elements.sunriseTxt.textContent = `Sunrise: ${getTimeSun(sunrise, timezone)}`;
    elements.sunsetTxt.textContent = `Sunset: ${getTimeSun(sunset, timezone)}`;

    elements.weatherTipText.textContent = getWeatherTip(main);
    elements.tipIcon.src = `assets/weather/${getWeatherIcon(id)}`;
    elements.tipContainer.style.display = 'flex';

    elements.currentLocalTime.textContent = `${getCurrentDate()} ${getLocalTime(timezone)}`;
    elements.weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;
}

// UPDATE WEATHER BY CITY NAME
async function updateWeatherInfo(city) {
    try {
        const weatherData = await getFetchData('weather', city);
        renderWeatherData(weatherData);
        await updateForecastsInfo(city);
        showDisplaySection(elements.weatherInfoSection);
    } catch (error) {
        handleError(error);
    }
}

// UPDATE WEATHER BY COORDINATES
async function updateWeatherInfoByCoords(lat, lon) {
    try {
        const weatherData = await getFetchDataByCoords('weather', lat, lon);
        renderWeatherData(weatherData);
        await updateForecastsInfoByCoords(lat, lon);
        showDisplaySection(elements.weatherInfoSection);
    } catch (error) {
        handleError(error);
    }
}

// ERRORS
function handleError(error) {
    if (error.message === 'city not found') {
        showToast('City not found. Please check the city name.', 'error');
        showDisplaySection(elements.notFoundSection);
    } else if (error instanceof TypeError) {
        showToast('Error: No internet connection. Please check your connection and try again.', 'error');
        showDisplaySection(elements.searchCitySection);
    } else {
        showToast('An error occurred while fetching the weather data.', 'error');
        showDisplaySection(elements.searchCitySection);
    }
}


// =UPDATE FORECAST BY CITY NAME
async function updateForecastsInfo(city) {
    try {
        const forecastsData = await getFetchData('forecast', city);
        renderForecasts(forecastsData);
    } catch {
    }
}

// UPDATE FORECAST BY COORDINATES
async function updateForecastsInfoByCoords(lat, lon) {
    try {
        const forecastsData = await getFetchDataByCoords('forecast', lat, lon);
        renderForecasts(forecastsData);
    } catch {
    }
}

// RENDER FORECAST
function renderForecasts(forecastsData) {
    const todayDate = new Date().toISOString().split('T')[0];
    elements.forecastItemsContainer.innerHTML = '';

    forecastsData.list.forEach(forecastWeather => {
        if (forecastWeather.dt_txt.includes(FORECAST_TIME) && !forecastWeather.dt_txt.includes(todayDate)) {
            updateForecastItem(forecastWeather);
        }
    });
}

//RENDER FORECAST ITEM
function updateForecastItem(weatherData) {
    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = weatherData;

    const dateTaken = new Date(date);
    const dateOption = { day: '2-digit', month: 'short' };
    const dateResult = dateTaken.toLocaleDateString(LOCALE_FORECAST, dateOption);

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeatherIcon(id)}" alt="Forecast" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
        </div>
    `;
    elements.forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
}

// SHOE DISPLAY SECTION
function showDisplaySection(sectionToShow) {
    const sections = [elements.weatherInfoSection, elements.searchCitySection, elements.notFoundSection];
    sections.forEach(section => {
        if (section === sectionToShow) {
            section.style.display = 'flex';
            Array.from(section.children).forEach((child, index) => {
                child.style.opacity = '0';
                child.style.transform = 'translateY(30px)';
                child.style.animation = `fadeInUp 0.5s ease forwards`;
                child.style.animationDelay = `${index * 0.1}s`;
            });
        } else {
            section.style.display = 'none';
        }
    });
}

// USER LOCATION
function useCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                updateWeatherInfoByCoords(latitude, longitude);
            },
            () => {
                showToast('Unable to retrieve your location.', 'error');
            }
        );
    } else {
        showToast('Geolocation is not supported by this browser.', 'error');
    }
}

// STYLES
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeInUp {
    0% {
        opacity: 0;
        transform: translateY(30px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}
`;
document.head.appendChild(styleSheet);
