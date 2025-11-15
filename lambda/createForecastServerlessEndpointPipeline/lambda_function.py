import json
import boto3

sm = boto3.client("sagemaker")
s3 = boto3.client("s3")

# get training dataset length so we can name the endpoint appropriately (e.g. "deepar2w-aqi-serverless-endpoint")
bucket = 'sagemaker-aqi-tool-pipeline'
train_key = 'data/train/data.json'

get_object_response = s3.get_object(
    Bucket = bucket,
    Key = train_key
)

training_data_json_strings = get_object_response['Body'].read().decode('utf-8').splitlines()
training_data = [json.loads(line) for line in training_data_json_strings]
london_obj = next((item for item in training_data if item.get('place') == 'London'), None)

no_weeks = round(len(london_obj['target'])/ (7 * 24))

def lambda_handler(event, context):
    # TODO implement
    print("Event received: ", event)
    model_name = event['model_name']

    endpoint_config_name = f"deepar{no_weeks}w-aqi-endpoint-serverless-config"
    endpoint_config_response = sm.create_endpoint_config(
        EndpointConfigName=endpoint_config_name,
        ProductionVariants=[
            {
                "VariantName": "AllTraffic",
                "ModelName": model_name,
                'ServerlessConfig': {
                    'MemorySizeInMB': 2048,
                    'MaxConcurrency': 1,
            }
            }
        ]
    )
    print("Endpoint Config ARN: ", endpoint_config_response['EndpointConfigArn'])

    endpoint_name = f"deepar{no_weeks}w-aqi-serverless-endpoint"
    create_endpoint_response = sm.create_endpoint(
        EndpointName=endpoint_name,
        EndpointConfigName=endpoint_config_name
    )
    print("Endpoint Arn: " + create_endpoint_response["EndpointArn"])
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }

