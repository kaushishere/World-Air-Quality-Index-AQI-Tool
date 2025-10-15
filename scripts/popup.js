function showPopup({ lat, lng, aqi, res_status, regionCode, cityName, aqiColor, dominantPollutant }) {
    if (currentSaveShortcutHandler) {
        document.removeEventListener('keydown', currentSaveShortcutHandler);
        currentSaveShortcutHandler = null
    }
    if (res_status === 200) {
        // get unicode emoji
        const flag = countryCodeToFlag(regionCode);
        // call twitter's open source emoji project to convert unicode emoji to a html image tag containing the svg file
        flagHTML = twemoji.parse(flag, {
            folder: 'svg',  // optional: use SVG for sharp scaling
            ext: '.svg'     // or '.png'
        });

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
                    <span class="label">AQI</span>
                    <span class="aqi-value" style="background-color: ${aqiColor}">${aqi}</span>
                </div>
                <div class="pollutant-row">
                    <span class="label">Dominant Pollutant</span>
                    <span class="pollutant-value">${dominantPollutant}</span>
                </div>
                </div>
                <div class="popup-footer">
                <div class="save-btn-container">
                    <button class="save-btn js-save-btn">
                    Save
                    <div class="tooltip">
                    Save to compare with other places (shortcut: ctrl+s)
                    </div>
                    </button>
                </div>
                </div>
            </div>
            `)
            .openOn(map)

        // save event listener (click)
        const saveBtnElement = document.querySelector('.js-save-btn')
        saveBtnElement.addEventListener('click', () => {
            saveForComparison(flagHTML, cityName, aqiColor, aqi, dominantPollutant)
        })
        // save event listener (ctrl+s)
        let handleSaveShortcut = (e) => handleShortcut(e, flagHTML, cityName, aqiColor, aqi, dominantPollutant);
        currentSaveShortcutHandler = handleSaveShortcut;
        document.addEventListener('keydown', handleSaveShortcut)
        document.querySelector('.leaflet-popup-close-button').addEventListener('click', () => {
            document.removeEventListener('keydown', handleSaveShortcut)
        })
    } else {
        popup
            .setLatLng([lat, lng])
            .setContent("Response failed. Choose another location.")
            .openOn(map)
    }
}