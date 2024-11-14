from pymongo import mongo_client


SECRET_KEY = 'secret!'

# Flask-Session:
SESSION_MONGODB = mongo_client
SESSION_MONGODB_DB = 'session'
SESSION_MONGODB_COLLECT = 'session'
SESSION_PERMANENT = False
SESSION_TYPE = 'mongodb'

# HTTP status codes
http_204: object = {
    'status': 'success',
    'status_code': 204,
    'data': 'no data to return'
}
http_500: object = {
    'status': 'fail',
    'status_code': 500,
    'data': 'server encountered error'
}