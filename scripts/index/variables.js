let popup = L.popup({
    minWidth: 240
})
let flagHTML, aqi, res_status, regionCode, cityName, aqiColor, dominantPollutant;
let currentSaveShortcutHandler; // represents the event listener of the previous popup

let comparisonCount = 0
const savedPlacesJSON = localStorage.getItem('savedPlaces')
const savedPlaces = savedPlacesJSON ? JSON.parse(savedPlacesJSON) : []
let tutorialWatched = localStorage.getItem('tutorialWatched') ? localStorage.getItem('tutorialWatched') : false

// Create map 
const map = L.map('map').setView([52.5, 0.43], 7);
