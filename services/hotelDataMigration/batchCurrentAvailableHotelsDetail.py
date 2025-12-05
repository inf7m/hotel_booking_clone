import os
import requests
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

def createAMongodbConnection():
    connectionString = f"mongodb+srv://{os.environ['MONGODB_USERNAME']}:{os.environ['MONGODB_PASSWD']}@cluster0.qsa9hsq.mongodb.net/?appName=Cluster0"
    client = MongoClient(connectionString, server_api=ServerApi('1')) ## Establish the connection
    try:
        client.admin.command('ping')
    except Exception as e:
        print(e)
    return client


def getTheCurrentAvailableIds() -> list:
    # create a valid URI fron system env
    uri = f"mongodb+srv://{os.environ['MONGODB_USERNAME']}:{os.environ['MONGODB_PASSWD']}@cluster0.qsa9hsq.mongodb.net/?appName=Cluster0"
    mongodbConnection = createAMongodbConnection()
    # Send a ping to confirm a successful connection
    db = mongodbConnection["metadata"]
    collection = db["currentAvailableHotelMetadata"]
    location_ids = [
        doc["location_id"]
        for doc in collection.find({}, {"location_id": 1, "_id": 0})
    ]
    mongodbConnection.close() # Close the connection
    return location_ids


def updateCurrentAvailableHotels(locationIDs: list):
    mongodbConnection = createAMongodbConnection()
    for id_ in locationIDs:
        url = f'https://api.content.tripadvisor.com/api/v1/location/{id_}/details?language=en&currency=USD&key={os.environ['TRIPADVISORAPI_KEY']}'
        data = requests.get(url).json()
        print(f"Getting from locationID {id_} successfully ") # Using for logging feature
        writeToCollection = mongodbConnection["hotel_info"]['currentAvailableHotelsDetail']
        print(f"Overwrite the information of {id_} to Collection.currentAvailableHotelsDetail successfully ") # Using for logging feature
        writeToCollection.insert_one(data)
    mongodbConnection.close() # Close the connection


updateCurrentAvailableHotels(getTheCurrentAvailableIds())
