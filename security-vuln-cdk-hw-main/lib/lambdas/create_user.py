import boto3
import subprocess
import logging
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


def lambda_handler(event, context):
    main(event)


def main(event):
    dynamodb = boto3.resource('dynamodb')
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    defaultpassword = 'welcometo98point6'
    logger.info('got event{}'.format(event))
    create_user(dynamodb, event['userid'], event['username'],
                defaultpassword, event['fullssn'], event['allccdetails'])


def create_user(dynamodb, uid, username, password, ssn, allccdetails):
    command = 'echo -n ' + password + '| md5sum | cut -d" " -f1'
    encpass = subprocess.check_output(command, shell=True).decode().rstrip()
    key = b'secretencryption'
    iv = b'\x50'*16
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    encryptedcc = encryptor.update(allccdetails.encode())
    userTable = dynamodb.Table('users')
    response = userTable.put_item(
        Item={
            'id': uid,
            'username': username,
            'password': password,
            'encryptedpassword': encpass,
            'ssn': ssn,
            'ccdetails': encryptedcc
        }
    )

    if response:
        print(f"User {username} with password {password} and encrypted credit card details {encryptedcc} was successfully created")
