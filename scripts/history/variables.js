const savedPlacesJSON = localStorage.getItem('savedPlaces')
const savedPlaces = savedPlacesJSON ? JSON.parse(savedPlacesJSON) : []
let showPlaces = []
let showData = []

defaultPlace = 'London'