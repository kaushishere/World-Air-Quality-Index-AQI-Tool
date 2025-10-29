const map = L.map('map').setView([51.5, 0.13], 9);
L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
}).addTo(map);
let popup = L.popup({ className: 'my-popup' })

// EVENT LISTENERS
// handle search
document.querySelector('.search-btn').addEventListener('click', () => {
    handleSearch()
})
document.querySelector('.search-bar').addEventListener('keydown', (e => {
    if (e.key === 'Enter') {
        handleSearch()
    }
}))
modelSelect.addEventListener('change', () => {
    showModelInfo()
    clearFactsAndPlot()
})

// handle map click
map.on('click', async (e) => {
    getCurrent(e.latlng.lat, e.latlng.lng)
})

// search for London when the window first loads, and click the button when it finally appears in the DOM
window.addEventListener('load', () => {
    defaultSearch(defaultPlace);
});

