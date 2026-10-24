import firebase_admin
from firebase_admin import credentials, firestore_async

cred = credentials.Certificate("./serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore_async.client()