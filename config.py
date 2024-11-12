from pymongo import mongo_client


SECRET_KEY = 'secret!'

# Flask-Session:
SESSION_MONGODB = mongo_client
SESSION_MONGODB_DB = 'session'
SESSION_MONGODB_COLLECT = 'session'
SESSION_PERMANENT = False
SESSION_TYPE = 'mongodb'