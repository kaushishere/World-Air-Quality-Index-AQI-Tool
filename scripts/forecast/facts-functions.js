function showModelInfo() {
    // get elements
    const modelTitleElem = document.querySelector('.facts-container .title')
    const modelTrainingTimeElem = document.querySelector('.model-training-time')
    const modelDescriptionElem = document.querySelector('.model-description')
    const selectedModel = modelSelect.value
    const model = models.find(m => {
        return m.name === selectedModel
    })

    // set content
    modelTitleElem.firstChild.textContent = selectedModel
    modelTrainingTimeElem.textContent = model.trainingSize
    modelDescriptionElem.textContent = model.description
}

function showFacts(aqiFact, timeFact) {
    aqiFactValueElem = document.querySelector('.aqi-fact-value')
    aqiFactTimeElem = document.querySelector('.aqi-fact-time')

    aqiFactValueElem.textContent = aqiFact
    aqiFactTimeElem.textContent = timeFact
}

function clearFactsAndPlot() {
    const aqiDescrElem = document.querySelector('.aqi-description')
    const aqiFactValueElem = document.querySelector('.aqi-fact-value')
    const aqiFactTimeElem = document.querySelector('.aqi-fact-time')

    aqiDescrElem.textContent = 'Please click the show button in the map window to render facts and plots'
    aqiDescrElem.classList.add('flash-message')
    aqiFactValueElem.textContent = ''
    aqiFactTimeElem.textContent = ''

    const chartDiv = document.querySelector('.aqi-chart');
    Plotly.purge(chartDiv);
}