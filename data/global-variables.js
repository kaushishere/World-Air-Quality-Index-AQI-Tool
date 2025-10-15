let popup = L.popup({
    minWidth: 240
})
let flagHTML, aqi, res_status, regionCode, cityName, aqiColor, dominantPollutant;
let currentSaveShortcutHandler; // represents the event listener of the previous popup

let comparisonCount = 0
const savedPlacesJSON = localStorage.getItem('savedPlaces')
const savedPlaces = savedPlacesJSON ? JSON.parse(savedPlacesJSON) : []

// Create map centered on the world
const map = L.map('map').setView([51.5, 0.43], 9);

// functions
// const handleSaveShortcut = (e) => handleShortcut(e, flagHTML, cityName, aqiColor, aqi, dominantPollutant)