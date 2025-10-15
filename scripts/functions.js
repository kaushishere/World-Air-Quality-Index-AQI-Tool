function countryCodeToFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2 || !/^[a-zA-Z]+$/.test(countryCode)) {
        return '🏳️'; // fallback
    }

    const code = countryCode.toUpperCase();
    const offset = 127397;
    return Array.from(code)
        .map(letter => String.fromCodePoint(letter.charCodeAt(0) + offset))
        .join('');
}

function handleShortcut(e, flagHTML, cityName, aqiColor, aqi, dominantPollutant) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveForComparison(flagHTML, cityName, aqiColor, aqi, dominantPollutant)
    }
}

function saveForComparison(flagHTML, cityName, aqiColor, aqi, dominantPollutant) {
    saveBtnElement = document.querySelector('.js-save-btn')
    if (saveBtnElement) {
        L.DomEvent.disableClickPropagation(saveBtnElement)
    }

    let placeFound;
    placeFound = savedPlaces.find(place => place.cityName === cityName)
    if (!placeFound) {
        savedPlaces.push({
            flagHTML,
            cityName,
            aqiColor,
            aqi,
            dominantPollutant
        })

        // save to local storage
        localStorage.setItem('savedPlaces', JSON.stringify(savedPlaces))

        updateComparisonCount();

        // update html
        const buttonContainerElement = document.querySelector('.save-btn-container')
        buttonContainerElement.style.color = 'green'
        buttonContainerElement.innerHTML = 'Saved'
    }
}

function updateComparisonCount() {
    const comparisonCountElement = document.querySelector('.comparison-count')
    if (savedPlaces.length > 0) {
        comparisonCountElement.style.opacity = 1
    } else {
        comparisonCountElement.style.opacity = 0
    }
    if (savedPlaces.length >= 10) {
        comparisonCountElement.style['font-size'] = '9px';
        comparisonCountElement.style.padding = '1px 4px';
    }
    document.querySelector('.comparison-count').innerHTML = savedPlaces.length
}