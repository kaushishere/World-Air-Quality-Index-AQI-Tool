async function defaultSearch(place) {
    data = await callLatLngAPI(place);
    let { lat, lng } = data

    getCurrent(lat, lng)
    map.flyTo([lat + 2.5, lng], 5)
}

async function handleSearch() {
    // get lat,lng
    const place = document.querySelector('.search-bar').value.trim()
    data = await callLatLngAPI(place);
    let { lat, lng } = data

    getCurrent(lat, lng)
    map.flyTo([lat + 2.5, lng], 5)
}

async function getForecast(place) {
    const baseURL = "https://4eg9e31cz4.execute-api.eu-north-1.amazonaws.com/dev" // API Gateway Endpoint
    const endpoint = 'get-forecast-aqi' // API Gateway Endpoint
    const selectedModel = modelSelect.value // Sagemaker Endpoint
    const model = models.find(m => {
        return m.name === selectedModel
    })
    const endpointName = model.endpointName // Sagemaker Endpoint

    const res = await fetch(`${baseURL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place, endpointName })
    });
    const data = await res.json()
    data.place = place
    return data
}



async function getCurrent(lat, lng) {
    // get aqi & place info
    const baseURL = "https://4eg9e31cz4.execute-api.eu-north-1.amazonaws.com/dev"
    const endpoint = 'get-current-aqi'
    const res = await fetch(`${baseURL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
    });
    ({ lat, lng, aqi, res_status, regionCode, cityName, aqiColor, dominantPollutant } = await res.json()) // data = { lat, lng, aqi, res_status, regionCode, cityName, aqiColor, dominantPollutant }

    // get flag
    const flag = countryCodeToFlag(regionCode);
    // call twitter's open source emoji project to convert unicode emoji to a html image tag containing the svg file
    flagHTML = twemoji.parse(flag, {
        folder: 'svg',  // optional: use SVG for sharp scaling
        ext: '.svg'     // or '.png'
    });

    // render
    popup
        .setLatLng([lat, lng])
        .setContent(`
            <div class="popup-card">
                <div class="popup-header">
                ${flagHTML}
                <span class="city-name">${cityName}</span>
                </div>
                <div class="popup-body">
                <div class="aqi-row">
                    <span class="label">Current AQI</span>
                    <span class="aqi-value" style="background-color: ${aqiColor}">${aqi}</span>
                </div>
                </div>
                <div class="popup-footer">
                <div class="show-btn-container">
                    <button class="show-btn">
                    Show
                    <div class="tooltip">
                    Show historical readings
                    </div>
                    </button>
                </div>
                </div>
            </div>
            `)
        .openOn(map)

    // show btn handler
    document.querySelector('.show-btn').addEventListener('click', async () => {

        // reset content
        const aqiDescrElem = document.querySelector('.aqi-description')
        aqiDescrElem.textContent = defaultAQIDescrText
        aqiDescrElem.classList.remove('flash-message')

        const modelDescrElem = document.querySelector('.model-description')
        modelDescrElem.classList.remove('flash-message')
        modelDescrElem.textContent = "Loading..."

        // 🔄 plot updating...
        const status = document.getElementById('statusMessage');
        status.textContent = '🔄 Plot updating...'; // reset text content
        status.classList.add('show');

        const warmupTimeout = setTimeout(() => {
            status.textContent = '🔄 Model endpoint is warming up...';
        }, 2000);

        try {
            const data = await getForecast(cityName);
            showPlot(data);
        } catch {
            alert('Problem retrieving forecast data. Try another place.');
            status.textContent = '❌ Failed to update plots.';
        } finally {
            clearTimeout(warmupTimeout);
            status.classList.remove('show');
        }

    })
}


