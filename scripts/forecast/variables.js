const savedPlacesJSON = localStorage.getItem('savedPlaces')
const savedPlaces = savedPlacesJSON ? JSON.parse(savedPlacesJSON) : []
let showPlaces = []
let showData = []
let modelSelect = document.getElementById('model-select')

defaultPlace = 'London'

const models = [{
    name: 'DeepAR_2W',
    description: "DeepAR is an AWS built-in algorithm for predicting timeseries data. The model's hyperparameters include a context window of 24 hours, and a prediction window of 24 hours also. This model has been deployed to a serverless endpoint and so it can take up to 10 seconds to yield the first set of predicted values.",
    trainingSize: "Training dataset size: 2 weeks",
    endpointName: "deepar2w-aqi-serverless-endpoint"
}
]


// default text for html elements
const defaultAQIDescrText = 'Highest AQI in forecast window:'
const defaultModelTrainingTimeText = 'Training dataset size: Undefined'