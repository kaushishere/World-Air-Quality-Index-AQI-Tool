// Load data
async function loadData() {
    const res = await fetch('./forecast.json');
    const { start, history, predictions } = await res.json();
    return { start, history, predictions }
}

function generateHourlyTimestamps(start, hours = 48) {
    const startDate = new Date(start.replace(" ", "T")); // convert to ISO format
    const timestamps = [];

    for (let i = 0; i < hours; i++) {
        const next = new Date(startDate);
        next.setHours(startDate.getHours() + i);

        // Format back to "YYYY-MM-DD HH:mm:ss"
        const formatted =
            next.getFullYear() + '-' +
            String(next.getMonth() + 1).padStart(2, '0') + '-' +
            String(next.getDate()).padStart(2, '0') + ' ' +
            String(next.getHours()).padStart(2, '0') + ':' +
            String(next.getMinutes()).padStart(2, '0') + ':' +
            String(next.getSeconds()).padStart(2, '0');

        timestamps.push(formatted);
    }

    return timestamps;
}

async function showPlot({ start, history, predictions, place }) {

    // Derive timestamps and data statistics
    const timestamps = generateHourlyTimestamps(start)
    const yLim = Math.max(...history, ...predictions) * 1.35
    const y = [...history, ...predictions]

    // facts
    const forecastMax = Math.max(...predictions)
    const forecastMaxTimestamp = timestamps[history.length + predictions.indexOf(forecastMax)]

    // render
    showModelInfo()
    showFacts(Math.round(forecastMax), forecastMaxTimestamp)

    // define context/prediction windows
    const splitLength = history.length
    const contextTagXPosition = Math.floor(splitLength / 2)
    const predictionTagXPosition = splitLength + Math.floor(predictions.length / 2)
    const splitTimestamp = timestamps[splitLength - 1]

    // Line Chart
    linechart = document.querySelector('.aqi-chart')

    var trace1 = {
        x: timestamps,
        y: [...history, ...predictions],
        mode: 'lines+markers',
        name: place
    };

    var linechartData = [trace1];

    var layout = {
        title: {
            text: `${place}'s Forecast`
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
            range: [0, yLim]
        },
        height: 400,
        paper_bgcolor: '#EDF2F7',
        plot_bgcolor: '#EDF2F7',
        margin: {
            l: 45
        },

        // shapes for context/prediction windows
        shapes: [
            {
                type: 'rect',
                yref: 'paper',
                x0: timestamps[0],
                x1: splitTimestamp,
                y0: 0,
                y1: 1,
                fillcolor: 'rgba(135, 206, 250, 0.2)',
                line: { width: 0 }
            },
            {
                type: 'rect',
                yref: 'paper',
                x0: splitTimestamp,
                x1: timestamps[timestamps.length - 1],
                y0: 0,
                y1: 1,
                fillcolor: 'rgba(152, 133, 236, 0.2)',
                line: { width: 0 }
            }
        ],
        annotations: [
            {
                xref: 'x',
                yref: 'paper',   // use paper coordinates
                x: timestamps[contextTagXPosition],
                y: 1.05,         // just above the top of the chart
                text: 'Context',
                showarrow: false,
                font: { color: 'rgb(30,30,30)', size: 14 }
            },
            {
                xref: 'x',
                yref: 'paper',   // use paper coordinates
                x: timestamps[predictionTagXPosition],
                y: 1.05,         // just above the top of the chart
                text: 'Prediction',
                showarrow: false,
                font: { color: 'rgb(30,30,30)', size: 14 }
            }
        ]
    };

    Plotly.newPlot(linechart, linechartData, layout, {
        responsive: true,
        modeBarButtonsToAdd: [
            {
                name: 'Download CSV',
                icon: Plotly.Icons.disk, // or any Plotly icon
                click: function (gd) {
                    // Extract data from the plot
                    const data = gd.data;
                    let csvContent = 'data:text/csv;charset=utf-8,';

                    // Build CSV header
                    csvContent += 'Type,Time,AQI\n';

                    data.forEach(trace => {
                        const { x, y } = trace;
                        for (let i = 0; i < x.length; i++) {
                            const type = i < splitLength ? 'Context' : 'Prediction'
                            const time = x[i];
                            const aqi = y[i];
                            csvContent += `${type},${time},${aqi}\n`;
                        }
                    });

                    // Trigger download
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `${place}_forecast.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        ]
    });
}



