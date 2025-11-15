# tells Lambda where it can find any additional dependencies
import sys
sys.path.insert(0, '/var/task/my_deployment_package.zip')

import boto3
import json
from utils import get_lat_lng, get_historical_data, get_location_info
from datetime import datetime, timedelta, timezone
import requests

runtime = boto3.client('sagemaker-runtime')
endpoint_name = "deepar2w-aqi-serverless-endpoint"

def lambda_handler(event, context):
    print(f'Received event (${type(event)}): ', json.dumps(event))

    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": json.dumps("Preflight OK"),
        }
    
    lambda_response = {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    }

    # event properties
    body = json.loads(event['body'])
    place = body['place']
    endpoint_name = body['endpointName']


    # invoke endpoint
    lat, lng = get_lat_lng(place)
    region_code, city_name = get_location_info(lat,lng)
    end_time = (datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) - timedelta(hours = 2))
    start_time = (end_time - timedelta(hours=23)).isoformat(timespec='seconds').replace('+00:00', 'Z')
    end_time = end_time.isoformat(timespec='seconds').replace('+00:00', 'Z')
    custom_aqi = 'usa_epa'
    next_page_token = None

    data = get_historical_data(lat,lng,start_time,end_time,region_code,custom_aqi,next_page_token)
    aqi_values = [hour['indexes'][0]['aqi'] if 'indexes' in hour else None for hour in data['hoursInfo']]
    aqi_values.reverse() # get in chronological order

    start_time_for_endpoint = start_time.replace("T", " ").replace("Z", "")
    payload = {
        "instances": [
            {
                "start": start_time_for_endpoint,
                "target": aqi_values 
            }
        ]
    }

    response = runtime.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType='application/json',
        Body=json.dumps(payload)
    )

    result = json.loads(response['Body'].read())
    predictions = result['predictions'][0]['mean']
    lambda_response['body'] = json.dumps({
            "start": start_time_for_endpoint,
            "history": aqi_values,
            "predictions": predictions
            })
    
    return lambda_response
