async function updateDetailedWeather() {
    // Your OpenWeatherMap API key (replace with your own if needed)
    const apiKey = '7bdd3993098661ed0ba759934ad5097b';
    const lat = 28.8163;  // Muktinath latitude
    const lon = 83.8715;  // Muktinath longitude
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const tempElement = document.getElementById('temp-large');
    const windElement = document.getElementById('wind-speed');
    const iconElement = document.getElementById('weather-icon');
    const container = document.getElementById('weather-footer');

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        const data = await response.json();

        // Extract data
        const temp = Math.round(data.main.temp);
        const windMps = data.wind.speed;          // meters per second
        const windKmph = (windMps * 3.6).toFixed(1); // convert to km/h
        const condition = data.weather[0].main.toLowerCase();

        // Update text
        tempElement.innerText = `${temp}°C`;
        windElement.innerText = `${windKmph} km/h`;

        // Choose emoji and background class
        let emoji = '☀️';
        container.classList.remove('bg-chilly', 'bg-hot', 'bg-rainy', 'bg-standard');

        if (condition.includes('rain')) {
            emoji = '🌧️';
            container.classList.add('bg-rainy');
        } else if (condition.includes('cloud')) {
            emoji = '☁️';
            container.classList.add('bg-standard');
        } else if (temp <= 10) {
            emoji = '❄️';
            container.classList.add('bg-chilly');
        } else if (temp >= 25) {
            emoji = '☀️';
            container.classList.add('bg-hot');
        } else {
            container.classList.add('bg-standard');
        }

        iconElement.innerText = emoji;

    } catch (error) {
        console.error('Weather fetch failed:', error);
        // Show fallback data so the section doesn't look broken
        tempElement.innerText = '--°C';
        windElement.innerText = '-- km/h';
        iconElement.innerText = '🌡️';
        container.classList.remove('bg-chilly', 'bg-hot', 'bg-rainy', 'bg-standard');
        container.classList.add('bg-standard');
    }
}

document.addEventListener('DOMContentLoaded', updateDetailedWeather);