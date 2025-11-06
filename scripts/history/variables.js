const savedPlacesJSON = localStorage.getItem('savedPlaces')
const savedPlaces = savedPlacesJSON ? JSON.parse(savedPlacesJSON) : []

const showPlacesJSON = localStorage.getItem('showPlaces')
let showPlaces = showPlacesJSON ? JSON.parse(showPlacesJSON) : []
const showDataJSON = localStorage.getItem('showData')
let showData = showDataJSON ? JSON.parse(showDataJSON) : []

let historyTutorialWatched = localStorage.getItem('historyTutorialWatched') ? localStorage.getItem('historyTutorialWatched') : false

defaultPlace = 'London'