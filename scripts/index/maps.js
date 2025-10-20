// Map tiling; this will work locally but for production webpages, you will need to go to https://client.stadiamaps.com/dashboard/overview > "Manage Properties" > "Create a Property" > "Edit Domain" to allow your webpage's subdomain.domain to access the StadiaMaps
L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.{ext}', {
  minZoom: 0,
  maxZoom: 20,
  attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  ext: 'png'
}).addTo(map);
updateComparisonCount()

// Event Listeners 
map.on('click', async (e) => {
  callCurrentAqiAPI(e.latlng.lat, e.latlng.lng)
});

document.querySelector('.search-btn').addEventListener("click", () => {
  handleSearch()
})
document.querySelector('.search-bar').addEventListener("keydown", (e) => {
  if (e.key === 'Enter') {
    handleSearch()
  }
})
document.querySelector('.random-btn').addEventListener("click", async (e) => {
  e.stopPropagation()
  handleRandom()
})

document.querySelector('.comparison-btn').addEventListener('click', () => {
  window.location.href = 'compare.html'
})

// Disable map interactions
L.DomEvent.disableClickPropagation(document.querySelector('header'));
L.DomEvent.disableScrollPropagation(document.querySelector('header'));

