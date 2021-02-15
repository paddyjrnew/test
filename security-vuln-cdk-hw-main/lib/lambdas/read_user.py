import boto3
from boto3.dynamodb.conditions import Key


def lambda_handler(event, context):
    main(event)


def main(event):
    dynamodb = boto3.resource('dynamodb')
    user = read_user(dynamodb, event['username'])
    return user


def read_user(dynamodb, username):
    userTable = dynamodb.Table('users')
    user = userTable.query(
        KeyConditionExpression=Key('id').eq(username)
    )['Items']
    if user:
        print(f"{user[0]['username']},{user[0]['encryptedpassword']}")
    else:
        print(f"{username} does not exist")

    return user
