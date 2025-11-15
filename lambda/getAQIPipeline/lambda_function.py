# tells Lambda where it can find any additional dependencies
import sys
sys.path.insert(0, '/var/task/my_deployment_package.zip')

import boto3
import requests
import json
from datetime import datetime, timedelta, timezone



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
url = f"https://airquality.googleapis.com/v1/history:lookup?key={api_key}"

# s3 client
s3 = boto3.client('s3')
sm = boto3.client('sagemaker')

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

def write_dicts_to_file(path,data):
    """
    Serialises and converts data to binary format before writing to a json file at path 'path'
    """
    with open(path,"wb") as f:
        for d in data:
            f.write(json.dumps(d).encode("utf-8"))
            f.write("\n".encode())

def read_json_lines_from_s3(bucket, key):
    response = s3.get_object(Bucket=bucket, Key=key)
    content = response['Body'].read().decode('utf-8')  # read bytes and decode to str
    records = [json.loads(line) for line in content.splitlines()]
    return records
    
    
def lambda_handler(event, context):
    print(f'Received event ({type(event)}): ', json.dumps(event))
    
    # response template
    response = {
        "statusCode": 200,
        "headers": {
        "Access-Control-Allow-Origin": "*"
        }
    }

    # UPDATE TRAIN.JSON
    try:
        train_records = read_json_lines_from_s3("sagemaker-aqi-tool-pipeline","data/train/data.json")
        test_records = read_json_lines_from_s3("sagemaker-aqi-tool-pipeline","data/test/data.json")
        train_by_place = {rec["place"]: rec for rec in train_records}
        for test_rec in test_records:
            place = test_rec["place"]
            if place in train_by_place:
                train_rec = train_by_place[place]
                # Extend the target from train with the latest week from test dataset
                train_rec["target"].extend(test_rec["target"][-168:])
            else:
                # If this place is not in train, optionally add it
                train_by_place[place] = test_rec

        new_train_data = '\n'.join([json.dumps(rec) for rec in train_by_place.values()])
        s3.put_object(Bucket = "sagemaker-aqi-tool-pipeline", Key = 'data/train/data.json', Body = new_train_data.encode('utf-8'))

        # UPDATE TEST.JSON

        # POST request parameters
        test_by_place = {rec['place']:rec for rec in test_records}
        for place in test_by_place:
            lat,lng = get_lat_lng(place)
            region_code, city_name = get_location_info(lat, lng)
            custom_aqi = 'usa_epa'
            test_end_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) - timedelta(hours = 2)
            test_start_time = test_end_time - timedelta(weeks=1) + timedelta(hours=1)
            test_end_time_str = test_end_time.isoformat(timespec='seconds').replace('+00:00', 'Z')
            test_start_time_str = test_start_time.isoformat(timespec='seconds').replace('+00:00', 'Z')
            next_page_token = None
            data = get_historical_data(lat,lng,test_start_time_str,test_end_time_str,region_code,custom_aqi, next_page_token)
            aqi_values = [hour['indexes'][0]['aqi'] if 'indexes' in hour and hour['indexes'] else None
                                    for hour in data['hoursInfo']]
            test_rec = test_by_place[place]
            test_rec['target'].extend(aqi_values)

        new_test_data = '\n'.join([json.dumps(rec) for rec in test_by_place.values()])
        s3.put_object(Bucket = "sagemaker-aqi-tool-pipeline", Key = 'data/test/data.json', Body = new_test_data.encode('utf-8'))

        # execute pipeline
        sm.start_pipeline_execution(
            PipelineName = 'aqi-pipeline'
        ) 

        response['body'] = f"Training and test data updated in S3. Pipeline executed."

    except Exception as e:
        response['body'] = f"{e}"
        print(e)
    
    
    return response


## FIRST RUN 
# def lambda_handler(event, context):
#     print(f'Received event ({type(event)}): ', json.dumps(event))
    
#     # response template
#     response = {
#         "statusCode": 200,
#         "headers": {
#         "Access-Control-Allow-Origin": "*"
#         }
#     }

#     try:
#         places = ['London', 'Paris', 'Sydney', 'München', 'New Delhi']
#         training_data = []
#         test_data = []

#         for place in places:

#             # POST request parameters
#             lat,lng = get_lat_lng(place)
#             region_code, city_name = get_location_info(lat, lng)
#             custom_aqi = 'usa_epa'

#             test_end_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) - timedelta(hours = 2)
#             training_end_time = test_end_time - timedelta(weeks=1)
#             training_start_time = training_end_time - timedelta(weeks= 2) + timedelta(hours=1)
            
#             test_end_time_str = test_end_time.isoformat(timespec='seconds').replace('+00:00', 'Z')
#             training_end_time_str = training_end_time.isoformat(timespec='seconds').replace('+00:00', 'Z')
#             training_start_time_str = training_start_time.isoformat(timespec='seconds').replace('+00:00', 'Z')

#             # to use in data
#             start_time = training_start_time.replace(tzinfo=None).strftime('%Y-%m-%d %H:%M:%S')  
            
#             # get aqi values for first page
#             next_page_token = None
#             data = get_historical_data(lat,lng,training_start_time_str,training_end_time_str,region_code,custom_aqi, next_page_token)
#             aqi_values_training = [hour['indexes'][0]['aqi'] for hour in data['hoursInfo']]
#             next_page_token = data.get('nextPageToken')
        
#             # get next page results if it exists
#             while next_page_token:
#                 data = get_historical_data(lat,lng,training_start_time_str,training_end_time_str,region_code,custom_aqi, next_page_token)
#                 # append aqi values 
#                 aqi_values_training.extend(hour['indexes'][0]['aqi'] if 'indexes' in hour and hour['indexes'] else None
#                                 for hour in data['hoursInfo'])
#                 # update "next page token" 
#                 next_page_token = data.get('nextPageToken')
                
            

#             # IMPORTANT - converts aqi values into chronological order
#             aqi_values_training.reverse()
#             training_data.append(
#                 {
#                     'start': start_time,
#                     'target': aqi_values_training,
#                     'place': place
#                 }
#             )

#             # test data 
#             data = get_historical_data(lat,lng,training_start_time_str,test_end_time_str,region_code,custom_aqi, next_page_token)
#             aqi_values = [hour['indexes'][0]['aqi'] if 'indexes' in hour and hour['indexes'] else None
#                                 for hour in data['hoursInfo']]
#             aqi_values.reverse()
#             aqi_values_test = aqi_values_training + aqi_values
#             test_data.append(
#                 {
#                     'start': start_time,
#                     'target': aqi_values_test,
#                     'place': place
#                 }
#             )
        
#             # upload data to s3
#             bucket = 'sagemaker-aqi-tool-pipeline'
#             train_data_body = '\n'.join([json.dumps(rec) for rec in training_data])
#             test_data_body = '\n'.join([json.dumps(rec) for rec in test_data])
#             s3.put_object(Bucket = bucket, Key = 'data/train/data.json', Body = train_data_body.encode('utf-8')) 
#             s3.put_object(Bucket = bucket, Key = 'data/test/data.json', Body = test_data_body.encode('utf-8')) 

#         # execute pipeline
#         sm.start_pipeline_execution(
#                 PipelineName = 'aqi-pipeline'
#             ) 

#         response['body'] = f"Training and test data for {places} uploaded to S3. Pipeline executed."


#     except Exception as e:
#         response['body'] = f"{e}"
    
    
#     return response