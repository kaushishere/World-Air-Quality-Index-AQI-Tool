// PLOTLY NOTES
// legend: {
//     x: 0.77,
//     y: 0.01,
//     orientation: 'h',
//     font: { size: 10 }

function plotAqiChart() {
    const aqichart = document.querySelector('.aqi-chart')
    const aqiChartData = []
    const ylimArr = []

    showData.forEach(place => {
        const x = place.data.hoursInfo.map(entry => entry.dateTime)
        const y = place.data.hoursInfo.map(entry => entry.indexes[0].aqi)
        const ylim = Math.max(...y) * 1.5
        ylimArr.push(ylim)

        let aqiCategories = place.data.hoursInfo.map(entry => entry.indexes[0].category)

        let trace = {
            x,
            y,
            text: aqiCategories,
            mode: 'lines+markers',
            name: place.cityName,
            hovertemplate: `Time: %{x}<br>AQI: %{y}<br>%{text}<br><extra></extra>`
        };
        aqiChartData.push(trace)
    })

    const superYLim = Math.max(...ylimArr)

    let layout = {
        title: {
            text: 'AQI'
        },
        xaxis: {
            title: {
                text: 'Time'
            },
            type: 'date'
        },
        yaxis: {
            title: {
                text: 'AQI'
            },
            range: [0, superYLim],
            showline: true
        },
        margin: {
            l: 45,
            r: 30,
            t: 60,
            b: 60
        },
        paper_bgcolor: '#EDF2F7',
        plot_bgcolor: '#EDF2F7',
        showlegend: false
    }
    Plotly.newPlot(aqichart, aqiChartData, layout, { responsive: true })
}

function plotPollutantsChart() {
    // constants
    const pChart = document.querySelector('.p-chart')
    const pChartData = []
    const ylimArr = []
    const pollutant = document.getElementById('pollutant-select').value
    let units;

    showData.forEach(place => {
        // get data for chosen pollutant only
        const hoursInfo = place.data.hoursInfo.map(hour => {
            return {
                ...hour,
                pollutants: hour.pollutants.filter(p => {
                    return p.displayName === pollutant
                })
            }
        })

        // units
        const units_long = hoursInfo[0].pollutants[0].concentration.units
        if (units_long === 'MICROGRAMS_PER_CUBIC_METER') {
            units = 'µg/m³'
        } else if (units_long === 'PARTS_PER_BILLION') {
            units = 'ppm'
        }

        // coordinates
        const x = place.data.hoursInfo.map(entry => entry.dateTime)
        const y = hoursInfo.map(hour => {
            return hour.pollutants[0].concentration.value
        })
        const ylim = Math.max(...y) * 1.5
        ylimArr.push(ylim)

        // construct trace
        let trace = {
            x,
            y,
            mode: 'lines+markers',
            name: place.cityName,
            hovertemplate: `Time: %{x}<br>${pollutant}: %{y}${units}<extra></extra>`
        };
        pChartData.push(trace)
    })

    // y limit
    const superYLim = Math.max(...ylimArr)


    let layout = {
        title: {
            text: pollutant
        },
        xaxis: {
            title: {
                text: 'Time'
            },
            type: 'date'
        },
        yaxis: {
            title: {
                text: `Concentration (${units})`,
                font: {
                    size: 10
                }
            },
            range: [0, superYLim],
            showline: true
        },
        margin: {
            l: 45,
            r: 30,
            t: 60,
            b: 60
        },
        paper_bgcolor: '#EDF2F7',
        plot_bgcolor: '#EDF2F7'
    }

    Plotly.newPlot(pChart, pChartData, layout, { responsive: true })
}

function showFacts(cityName) {

    // handle "Showing: 0"
    if (showData.length === 0) {
        handleNoShow()
        return
    }
    handleNoShow()

    // get latest place shown...
    const foundPlace = showData.find(place => {
        return place.cityName === cityName
    })
    // ... unless place got deleted from the user dropdown
    const place = foundPlace ? foundPlace : showData.at(-1)

    // AQI 
    const aqiArray = place.data.hoursInfo.map(hour => {
        return hour.indexes[0].aqi
    }).reverse()
    const dateArray = place.data.hoursInfo.map(hour => {
        return hour.dateTime
    }).reverse()

    const aqiMax = Math.max(...aqiArray)
    const dateMaxUnformatted = dateArray[aqiArray.indexOf(aqiMax)]
    const dateMax = formatDateForRender(dateMaxUnformatted)


    // Dominant Pollutant
    let counts = {}
    let maxCount = 0
    let dominantPollutantUnformatted;

    // [pm2.5, pm2.5, pm10 ...]
    const pArray = place.data.hoursInfo.map(hour => {
        return hour.indexes[0].dominantPollutant
    })

    // loop through array, changing the maxCount variable
    pArray.forEach((p) => {
        counts[p] = (counts[p] || 0) + 1
        if (counts[p] > maxCount) {
            maxCount = counts[p]
            dominantPollutantUnformatted = p
        }
    })

    // convert to display name
    toDisplayName = {
        'pm25': 'PM2.5',
        'pm10': 'PM10',
        'o3': 'O3',
        'no2': 'NO2',
        'so2': 'SO2',
        'co': 'CO'
    }
    dominantPollutant = toDisplayName[dominantPollutantUnformatted] || dominantPollutantUnformatted

    renderFacts(place.cityName, aqiMax, dateMax, dominantPollutant, maxCount)
}

function renderFacts(placeName, aqiMax, dateMax, dominantPollutant, maxCount) {
    document.querySelector('.place-name').innerHTML = placeName
    document.querySelector('.aqi-fact-value').innerHTML = aqiMax
    document.querySelector('.aqi-fact-time').innerHTML = dateMax
    document.querySelector('.pollutant-name').innerHTML = dominantPollutant
    document.querySelector('.pollutant-count').innerHTML = `Hours count: ${maxCount}`
}

function handleNoShow() {
    document.querySelector('.place-name').innerHTML = "Undefined"
    document.querySelector('.aqi-fact-value').innerHTML = "Undefined"
    document.querySelector('.aqi-fact-time').innerHTML = "Undefined"
    document.querySelector('.pollutant-name').innerHTML = "Undefined"
    document.querySelector('.pollutant-count').innerHTML = 'Hours count: Undefined'
}

