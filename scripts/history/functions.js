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

function formatDateForRender(time) {
    const date = new Date(time);

    // Format parts manually
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // months start at 0
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}`;
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
    document.querySelector('.show-btn').addEventListener('click', () => {
        const startTime = document.getElementById('start-date').value + ':00Z'
        const endTime = document.getElementById('end-date').value + ':00Z'
        showBtnHandler(lat, lng, cityName, regionCode, startTime, endTime)
    })
}

function updateShowCount(lat, lng, cityName, regionCode, startTime, endTime) {
    const foundPlace = showPlaces.find(place => {
        return place.cityName === cityName
    })
    if (!foundPlace) {
        showPlaces.push(
            {
                cityName,
                lat,
                lng,
                regionCode
            }
        )
    }
    renderDropdown()

}

function renderDropdown() {
    // Dropdown list
    let html = ''
    showPlaces.forEach(place => {
        html += `
        <li>
            ${place.cityName}
            <button class="remove-btn" onclick="removeItem('${place.cityName}')">
                <i class="fa-solid fa-trash"></i>
            </button>

        </li>
    `
    })
    document.querySelector('#places-list').innerHTML = html

    // Showing: X
    document.querySelector('.show-count').innerHTML = `Showing: ${showPlaces.length}`
}

function removeItem(cityName) {

    // update data
    showPlaces = showPlaces.filter(place => {
        return place.cityName !== cityName
    })
    showData = showData.filter(place => {
        return place.cityName !== cityName
    })

    // update screen
    renderDropdown()
    showFacts(cityName)
    showPlots()
}

async function showPlots() {
    // let x = data.hoursInfo.map(entry => entry.dateTime)
    // plotAqiChart(data, x, cityName)
    // plotPollutantsChart(data, x, 'PM2.5', cityName)
    plotAqiChart()
    plotPollutantsChart('PM2.5')
}

async function showBtnHandler(lat, lng, cityName, regionCode, startTime, endTime) {

    updateShowCount(lat, lng, cityName, regionCode, startTime, endTime)

    // call API Gateway
    const baseURL = "https://4eg9e31cz4.execute-api.eu-north-1.amazonaws.com/dev"
    const endpoint = 'get-historical-aqi'
    const res = await fetch(`${baseURL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, regionCode, startTime, endTime })
    });

    // update data 
    const data = await res.json()

    const foundPlaceExact = showData.find(place => {
        return place.cityName === cityName && place.startTime === startTime && place.endTime === endTime;
    })
    if (!foundPlaceExact) {
        const foundIndex = showData.findIndex(place => {
            return place.cityName === cityName;
        })
        if (foundIndex !== -1) {
            showData[foundIndex] = {
                cityName,
                data,
                startTime,
                endTime
            }
        } else {
            showData.push({
                cityName,
                data,
                startTime,
                endTime
            })
        }
    }

    // update screen
    showFacts(cityName)

    showPlots()
}