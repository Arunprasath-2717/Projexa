from pymongo import MongoClient
import sys

connection_string = "mongodb+srv://Admin:9IqmNsXiX9nqRFzn@cluster0.njjmlsv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

try:
    print(f"Testing connection to {connection_string.split('@')[1]}...")
    client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
    client.server_info()
    print("SUCCESS: Connected to MongoDB Atlas!")
    db = client["student_projects"]
    collections = db.list_collection_names()
    print(f"Available collections: {collections}")
except Exception as e:
    print(f"FAILURE: {str(e)}")
    sys.exit(1)
