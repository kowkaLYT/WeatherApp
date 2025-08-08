const cityInput = document.querySelector('.city-input')
const searchBtn = document.querySelector('.input-btn')

const weatherInfoSection = document.querySelector('.weather-info')
const searchCitySection = document.querySelector('.search-city')
const notFoundSection = document.querySelector('.not-found')

const countryTxt = document.querySelector('.country-txt')
const tempTxt = document.querySelector('.temp-txt')
const feelsLikeTxt = document.querySelector('.feels-like-txt')
const conditionTxt = document.querySelector('.condition-txt')
const humidityValueTxt = document.querySelector('.humidity-value-txt')
const windValueTxt = document.querySelector('.wind-value-txt')
const weatherSummaryImg = document.querySelector('.weather-summary-img')
const currentDateTxt = document.querySelector('.current-date-txt')
const sunriseTxt = document.querySelector('.sunrise-txt')
const sunsetTxt = document.querySelector('.sunset-txt')

const forecastItemsContainer = document.querySelector('.forecast-items-container')

// API KEY
const apiKey = 'd7729a8df9660f0d1023e8339e7403a9'

// SEARCH
searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() != '') {
        updateWeatherInfo(cityInput.value)
        cityInput.value = ''
        cityInput.blur()
    }
})
cityInput.addEventListener('keydown', (event) => {
    if (event.key == 'Enter' && cityInput.value.trim()) {
        updateWeatherInfo(cityInput.value)
        cityInput.value = ''
        cityInput.blur()
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
            if (toast.parentElement) {
                container.removeChild(toast)
            }
        }, 500)
    }, 3000)
}

// FETCH DATA
async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`
    const response = await fetch(apiUrl)
    return response.json()
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
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

// CURRENT DATE
function getCurrentDate() {
    const currentDate = new Date()
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    }
    return currentDate.toLocaleDateString('en-GB', options)
}

// UPDATE WEATHER INFO
async function updateWeatherInfo(city) {
    try {
        const weatherData = await getFetchData('weather', city)

        if (weatherData.cod != 200) {
            showDisplaySection(notFoundSection)
            return
        }

        const {
            name: country,
            main: { temp, humidity, feels_like },
            weather: [{ id, main }],
            wind: { speed },
            sys: { sunrise, sunset },
            timezone
        } = weatherData

        countryTxt.textContent = country
        tempTxt.textContent = Math.round(temp) + '°C'
        feelsLikeTxt.textContent = `Feels like: ${Math.round(feels_like)}°C`
        conditionTxt.textContent = main
        humidityValueTxt.textContent = humidity + '%'
        windValueTxt.textContent = speed + ' M/s'

        sunriseTxt.textContent = `Sunrise: ${getTimeSun(sunrise, timezone)}`
        sunsetTxt.textContent = `Sunset: ${getTimeSun(sunset, timezone)}`

        currentDateTxt.textContent = getCurrentDate()
        weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`

        await updateForecastsInfo(city)

        showDisplaySection(weatherInfoSection)

    } catch (error) {
        if (error instanceof TypeError) {
            showToast('Error: No internet connection. Please check your connection and try again.', 'error')
        } else {
            showToast('An error occurred while fetching the weather data.', 'error')
        }

        showDisplaySection(searchCitySection)
    }
}

// UPDATE FORECAST
async function updateForecastsInfo(city) {
    const forecastsData = await getFetchData('forecast', city)
    const timeTaken = '12:00:00'
    const todayDate = new Date().toISOString().split('T')[0]
    forecastItemsContainer.innerHTML = ''
    forecastsData.list.forEach(forecastWeather => {
        if (forecastWeather.dt_txt.includes(timeTaken) && !forecastWeather.dt_txt.includes(todayDate)) {
            UpdateForecastItems(forecastWeather)
        }
    })
}

// UPDATE FORECAST FOR NEXT DAYS
function UpdateForecastItems(weatherData) {
    const {
        dt_txt: date,
        weather: [{ id }],
        main: { temp }
    } = weatherData
    const dateTaken = new Date(date)
    const dateOption = {
        day: '2-digit',
        month: 'short'
    }
    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption)
    const forecastItem = `
     <div class="forecast-item">
         <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
        <img src="assets/weather/${getWeatherIcon(id)}" alt="Forecast" class="forecast-item-img">
        <h5 class="forecast-item-temp">${Math.round(temp)} °C</h5>
        </div>
    `
    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem)
}

// DISPLAY SECTIONS
function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection].forEach(sec => sec.style.display = 'none')
    section.style.display = 'flex'
}