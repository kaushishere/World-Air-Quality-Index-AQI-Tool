import boto3
import requests
import json

# Define secret info
secret_id = "prod/aqi/google/apikey"
secret_key = "Air Quality Index Tool APIKEY"
client = boto3.client("secretsmanager", region_name="eu-north-1")

# Retrieve the secret value
response = client.get_secret_value(SecretId=secret_id)

# Parse the secret string
secret_obj = json.loads(response["SecretString"])

# Extract the API key and construct URL
api_key = secret_obj[secret_key]

def get_lat_lng(place):
    url = f'https://maps.googleapis.com/maps/api/geocode/json?address={place}&key={api_key}'
    response = requests.get(url)
    data = response.json()
    location = data['results'][0]['geometry']['location']
    return location['lat'], location['lng']

def get_location_info(lat, lng):
    """
    Fetches region code and city name from Google Maps Geocoding API.

    Args:
        lat (float): Latitude
        lng (float): Longitude

    Returns:
        dict: {'region_code': str or None, 'city_name': str or None}
    """
    geo_url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={api_key}"
    response = requests.get(geo_url)
    
    if response.status_code != 200:
        print(f"Failed to fetch region info: HTTP {response.status_code}")
        return {"regionCode": None, "cityName": None}
    
    data = response.json()
    
    if data.get("status") == "OK" and data.get("results"):
        components = data["results"][0]["address_components"]

        # Find country
        country_comp = next((comp for comp in components if "country" in comp.get("types", [])), None)
        region_code = country_comp["short_name"].lower() if country_comp else None

        # Find city (locality)
        city_comp = next(
            (comp for comp in components if "locality" in comp.get("types", [])),
            None
        ) or next(
            (comp for comp in components if "postal_town" in comp.get("types", [])),
            None
        )

        # Fallback to admin levels if no locality found
        if not city_comp:
            city_comp = next(
                (comp for comp in components if "administrative_area_level_2" in comp.get("types", [])),
                None
            ) or next(
                (comp for comp in components if "administrative_area_level_1" in comp.get("types", [])),
                None
            )

        city_name = city_comp["long_name"] if city_comp else None
        return region_code, city_name

    else:
        print("Failed to fetch region info:", data.get("status"))

def get_historical_data(lat,lng,start_time_str,end_time_str,region_code,custom_aqi,next_page_token):
        
        url = f"https://airquality.googleapis.com/v1/history:lookup?key={api_key}"
        headers = {
            "Content-Type": "application/json"
        }

        # construct payload
        payload = {
        "pageSize": 168,
        "pageToken": next_page_token,
        "location": {
            "latitude": lat,
            "longitude": lng
        },
        "period": {
            "startTime": start_time_str,
            "endTime": end_time_str
        },
        "extraComputations": ["LOCAL_AQI"],
        "universalAqi": False,
        "customLocalAqis": {
            "regionCode": region_code,
            "aqi": custom_aqi
            }
        }

        # POST request
        data = requests.post(
        url, 
        headers=headers, 
        data=json.dumps(payload)
        ).json()
        return data