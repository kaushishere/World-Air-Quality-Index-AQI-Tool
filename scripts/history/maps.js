const map = L.map('map').setView([51.5, 0.13], 9);
L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
}).addTo(map);
let popup = L.popup({ className: 'my-popup' })

// EVENT LISTENERS
const placesListElem = document.getElementById('places-list')

// handle search
document.querySelector('.search-btn').addEventListener('click', () => {
    handleSearch()
})
document.querySelector('.search-bar').addEventListener('keydown', (e => {
    if (e.key === 'Enter') {
        handleSearch()
    }
}))
document.getElementById('pollutant-select').addEventListener('change', () => {
    plotPollutantsChart()
})

// handle map click
map.on('click', async (e) => {
    getCurrent(e.latlng.lat, e.latlng.lng)
})

// toggle dropdown
document.getElementById('places-btn').addEventListener('click', () => {
    const arrowIconElem = document.getElementById('arrow-icon')

    placesListElem.classList.toggle('dropdown-hidden')
    arrowIconElem.classList.toggle('fa-angle-down')
    arrowIconElem.classList.toggle('fa-angle-up')
})

// cart mode activate
// const cartBtnElem = document.querySelector('.cart-btn')
// const placesBtnElem = document.getElementById('places-btn')

// cartBtnElem.addEventListener('click', () => {
//     cartBtnElem.classList.toggle('btn-active')
//     placesBtnElem.classList.toggle('btn-active')

//     const tooltipElem = document.querySelector('.tooltip-cart-icon')
//     if (cartBtnElem.classList.contains('btn-active')) {
//         tooltipElem.innerHTML = 'Switch to Explore Mode'
//     } else {
//         tooltipElem.innerHTML = 'Switch to Cart Mode'
//     }
// })

// date range changes
document.getElementById('start-date').addEventListener('change', () => {

    // get latest place
    const { cityName, lat, lng, regionCode } = showPlaces.at(-1)
    const startTime = document.getElementById('start-date').value + ':00Z'
    const endTime = document.getElementById('end-date').value + ':00Z'
    showBtnHandler(lat, lng, cityName, regionCode, startTime, endTime)
})
document.getElementById('end-date').addEventListener('change', () => {

    // get latest place
    const { cityName, lat, lng, regionCode } = showPlaces.at(-1)
    const startTime = document.getElementById('start-date').value + ':00Z'
    const endTime = document.getElementById('end-date').value + ':00Z'
    showBtnHandler(lat, lng, cityName, regionCode, startTime, endTime)
})





// search for London when the window first loads, and click the button when it finally appears in the DOM
if (!historyTutorialWatched) {
    window.addEventListener('load', () => {
        defaultSearch(defaultPlace);

        const interval = setInterval(() => {
            const showBtn = document.querySelector('.show-btn');
            if (showBtn) {
                showBtn.click();
                clearInterval(interval); // stop checking
            }
        }, 200); // check every 200ms
    });
    localStorage.setItem("historyTutorialWatched", true)
}
