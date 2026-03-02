// js/weather.js
let dailyDetails = [];

async function loadWeatherForecast() {
    const apiKey = '7bdd3993098661ed0ba759934ad5097b';
    const lat = 28.8163;
    const lon = 83.8715;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const forecastContainer = document.getElementById('forecast-container');
    if (!forecastContainer) return;

    try {
        console.log('Fetching weather forecast...');
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log('Forecast data received:', data);

        // Get current weather
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        const currentResponse = await fetch(currentUrl);
        const currentData = await currentResponse.json();
        const currentTemp = Math.round(currentData.main.temp);
        const currentDesc = currentData.weather[0].description;
        const currentIcon = currentData.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${currentIcon}@2x.png`;

        let html = `
            <div class="col-12 mb-3">
                <div class="alert alert-info text-center d-flex align-items-center justify-content-center">
                    <img src="${iconUrl}" alt="${currentDesc}" width="40" class="me-2" onerror="this.onerror=null; this.src=''; this.outerHTML='<span>🌡️</span>';">
                    <span><strong>Current: ${currentTemp}°C</strong> – ${currentDesc}</span>
                </div>
            </div>
        `;

        // Group forecast by day
        const dailyMap = new Map();
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
            if (!dailyMap.has(dayKey)) {
                dailyMap.set(dayKey, {
                    dayName: dayKey,
                    entries: []
                });
            }
            dailyMap.get(dayKey).entries.push(item);
        });

        dailyDetails = [];

        // Convert map to array and take first 5 days
        const daily = Array.from(dailyMap.values()).slice(0, 5);
        daily.forEach((day, index) => {
            const entries = day.entries;
            const noonEntry = entries[Math.floor(entries.length / 2)];

            const minTemp = Math.round(Math.min(...entries.map(e => e.main.temp)));
            const maxTemp = Math.round(Math.max(...entries.map(e => e.main.temp)));
            const icon = noonEntry.weather[0].icon;
            const description = noonEntry.weather[0].description;
            const iconUrl = `https://openweathermap.org/img/wn/${icon}.png`; // Use .png instead of @2x for smaller size

            // Fallback emoji based on description
            const emoji = getWeatherEmoji(noonEntry.weather[0].main);

            dailyDetails.push({
                dayName: day.dayName,
                date: new Date(noonEntry.dt * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                temp: Math.round(noonEntry.main.temp),
                minTemp: minTemp,
                maxTemp: maxTemp,
                feelsLike: Math.round(noonEntry.main.feels_like),
                windSpeed: noonEntry.wind.speed,
                windDeg: noonEntry.wind.deg,
                humidity: noonEntry.main.humidity,
                pressure: noonEntry.main.pressure,
                description: description,
                icon: icon,
                iconUrl: iconUrl,
                emoji: emoji
            });

            html += `
                <div class="col-md text-center mb-2" data-day-index="${index}">
                    <div class="card shadow-sm forecast-card" style="cursor: pointer;">
                        <div class="card-body p-2">
                            <h6 class="card-title">${day.dayName}</h6>
                            <div class="weather-icon-container">
                                <img src="${iconUrl}" alt="${description}" width="40" onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML='<span style=\'font-size:2rem;\'>${emoji}</span>';">
                            </div>
                            <p class="mb-0"><strong>${maxTemp}°</strong> / ${minTemp}°</p>
                            <small class="text-muted">${description}</small>
                        </div>
                    </div>
                </div>
            `;
        });

        forecastContainer.innerHTML = html;

        document.querySelectorAll('[data-day-index]').forEach(card => {
            card.addEventListener('click', function() {
                const index = this.getAttribute('data-day-index');
                showWeatherDetail(parseInt(index));
            });
        });

    } catch (error) {
        console.error('Weather forecast error:', error);
        forecastContainer.innerHTML = '<div class="col-12 text-center text-muted">Weather forecast unavailable.</div>';
    }
}

function getWeatherEmoji(main) {
    switch(main.toLowerCase()) {
        case 'clear': return '☀️';
        case 'clouds': return '☁️';
        case 'rain': return '🌧️';
        case 'snow': return '❄️';
        case 'thunderstorm': return '⛈️';
        case 'drizzle': return '🌦️';
        case 'mist': case 'fog': case 'haze': return '🌫️';
        default: return '🌡️';
    }
}

function showWeatherDetail(index) {
    const day = dailyDetails[index];
    if (!day) return;

    const modalBody = document.getElementById('weatherDetailBody');
    const modalTitle = document.getElementById('weatherDetailModalLabel');
    const modalElement = document.getElementById('weatherDetailModal');

    modalTitle.textContent = `Weather Details for ${day.dayName}`;
    modalBody.innerHTML = `
        <div class="text-center mb-3">
            <div style="font-size: 4rem;">${day.emoji}</div>
            <h4>${day.minTemp}°C to ${day.maxTemp}°C</h4>
            <p class="lead">${day.description}</p>
        </div>
        <ul class="list-group">
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Feels Like
                <span>${day.feelsLike}°C</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Wind
                <span>${day.windSpeed} m/s (${day.windDeg}°)</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Humidity
                <span>${day.humidity}%</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Pressure
                <span>${day.pressure} hPa</span>
            </li>
        </ul>
    `;

    const modal = new bootstrap.Modal(modalElement);
    
    // Blur any focused element inside the modal before it hides to avoid aria-hidden warning
    const onHide = function() {
        if (document.activeElement && modalElement.contains(document.activeElement)) {
            document.activeElement.blur();
        }
        modalElement.removeEventListener('hide.bs.modal', onHide);
    };
    modalElement.addEventListener('hide.bs.modal', onHide);

    modal.show();
}

document.addEventListener('DOMContentLoaded', loadWeatherForecast);