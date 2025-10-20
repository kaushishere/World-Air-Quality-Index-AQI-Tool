// Map click 
async function callCurrentAqiAPI(lat, lng) {
    const baseURL = "https://4eg9e31cz4.execute-api.eu-north-1.amazonaws.com/dev"
    const endpoint = 'get-current-aqi'
    const res = await fetch(`${baseURL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
    });
    const data = await res.json() // data = { lat, lng, aqi, res_status, regionCode, cityName, aqiColor, dominantPollutant }
    showPopup(data)
}

async function handleRandom() {
    res_status = 400
    let lat, lng;
    let data;
    while (res_status !== 200) {
        lat = (Math.random() * 180) - 90; // Random latitude between -90 and 90
        lng = (Math.random() * 360) - 180; // Random longitude between -180 and 180

        // call API
        const baseURL = "https://4eg9e31cz4.execute-api.eu-north-1.amazonaws.com/dev"
        const endpoint = 'get-current-aqi'
        const res = await fetch(`${baseURL}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng })
        });
        data = await res.json()
        res_status = data['res_status']
    }
    showPopup(data)
    map.flyTo([lat, lng], 5)
}

// Search by place name
async function handleSearch() {
    const place = document.querySelector('.search-bar').value.trim()
    data = await callLatLngAPI(place);
    const { lat, lng } = data
    callCurrentAqiAPI(lat, lng)
    map.flyTo([lat, lng], 5)
}