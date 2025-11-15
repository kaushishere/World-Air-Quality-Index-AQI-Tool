import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function getLocationInfo(lat, lng) {
  const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const res = await fetch(geoUrl);
  const data = await res.json();

  if (data.status === "OK") {
    const components = data.results[0].address_components;

    // Find country
    const countryComp = components.find(comp => comp.types.includes("country"));
    const regionCode = countryComp ? countryComp.short_name.toLowerCase() : null;

    // Find city (locality)
    let cityComp = components.find(comp => comp.types.includes("locality")) ||
      components.find(comp => comp.types.includes('postal_town'));

    // If no "locality" is found, fallback to admin levels (useful for rural areas)
    if (!cityComp) {
      cityComp = components.find(comp => comp.types.includes("administrative_area_level_2")) ||
        components.find(comp => comp.types.includes("administrative_area_level_1"));
    }
    if (!cityComp) {
      cityComp = components.find(comp => comp.types.includes("administrative_area_level_2")) ||
        components.find(comp => comp.types.includes("administrative_area_level_1"));
    }

    const cityName = cityComp ? cityComp.long_name : null;
    return { regionCode, cityName };
  } else {
    console.error("Failed to fetch region info:", data.status);
    return { regionCode: null, cityName: null };
  }
}

async function getCurrent(lat, lng) {
  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
  ({ regionCode, cityName } = await getLocationInfo(lat, lng))
  const customAQI = 'usa_epa'
  const pollutantCodetoName = {
    'o3': 'O3',
    'pm10': 'PM10',
    'pm25': 'PM2.5'
  }

  try {
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: {
          latitude: lat,
          longitude: lng
        },
        extraComputations: [
          "LOCAL_AQI",
          "POLLUTANT_CONCENTRATION"  // retrieves pollutant in its default units (e.g. PM10: MICROGRAMS_PER_CUBIC_METER)
        ],
        universalAqi: false,
        customLocalAqis: {
          regionCode: regionCode,
          'aqi': customAQI
        }
      })
    })
    res_status = response.status
    if (response.status === 200) {
      const data = await response.json()
      const custom_index = data.indexes.find(index => index.code === customAQI)
      aqi = custom_index.aqi
      aqiColor = toRGB(custom_index.color)
      dominantPollutant = pollutantCodetoName[custom_index.dominantPollutant]
    }
    return { lat, lng, aqi, res_status, regionCode, cityName, aqiColor, dominantPollutant }
  } catch (err) {
    alert(`Error fetching AQI data, potential causes:\nAPI key is invalid`)
  }
}

async function getHistorical(lat, lng, regionCode, startTime, endTime) {
  const customAQI = 'usa_epa'
  const url = `https://airquality.googleapis.com/v1/history:lookup?key=${apiKey}`;

  try {
    let response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageSize: 168,
        location: {
          latitude: lat,
          longitude: lng
        },
        period: {
          startTime,
          endTime
        },
        extraComputations: [
          'LOCAL_AQI',
          'POLLUTANT_CONCENTRATION'
        ],
        universalAqi: false,
        customLocalAqis: {
          regionCode: regionCode,
          'aqi': customAQI
        }
      })
    })
    if (response.status === 200) {
      console.log("Response succeeded ", response.status)
      const data = await response.json()

      // data cleaning
      const cleanedHoursInfo = data['hoursInfo'].map(hour => ({
        ...hour,
        indexes: (hour.indexes || []).map(({ code, displayName, aqiDisplay, ...rest }) => rest),
        pollutants: (hour.pollutants || []).map(({ code, ...rest }) => rest)
      }));
      data['hoursInfo'] = cleanedHoursInfo

      return data
    } else {
      console.log("Response failed ", response.status)
    }
  }
  catch (err) {
    console.log("Error fetching AQI data: ", err)
  }
}

function toRGB(color) {
  const r = Math.round((color.red ?? 0) * 255)
  const g = Math.round((color.green ?? 0) * 255)
  const b = Math.round((color.blue ?? 0) * 255)
  return `rgb(${r},${g},${b})`
}

async function getLatLng(place) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${place}&key=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()
  return data.results[0].geometry.location
}

// global variables
let aqi, res_status, regionCode, cityName, aqiColor, dominantPollutant;
let lat, lng, startTime, endTime;

// API Configuration
const secretId = "prod/aqi/google/apikey";
const secretKey = "Air Quality Index Tool APIKEY";
const client = new SecretsManagerClient({ region: "eu-north-1" });
const command = new GetSecretValueCommand({ SecretId: secretId });
const response = await client.send(command);
const secretObj = JSON.parse(response.SecretString);
const apiKey = secretObj[secretKey];

export const handler = async (event) => {
  // OPTIONS method is dealt by API Gateway
  console.log(`Received event (${typeof event}): `, JSON.stringify(event))
  let response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*"
    }
  }

  try {
    switch (event.path) {
      case "/get-current-aqi":
        ({ lat, lng } = JSON.parse(event.body))
        response.body = JSON.stringify(await getCurrent(lat, lng))
        break;

      case "/get-lat-lng":
        const { place } = JSON.parse(event.body);
        response.body = JSON.stringify(await getLatLng(place));
        break

      case "/get-historical-aqi":
        ({ lat, lng, regionCode, startTime, endTime } = JSON.parse(event.body))
        response.body = JSON.stringify(await getHistorical(lat, lng, regionCode, startTime, endTime))
        break
    }
  } catch (error) {
    response.body = JSON.stringify({ message: error.message })
  }
  return response
};