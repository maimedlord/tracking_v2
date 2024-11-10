from bson.objectid import ObjectId
from pymongo import MongoClient
from user import User
from werkzeug.security import check_password_hash

mongo_client = MongoClient()

db_users = mongo_client['tv2_users']
c_users = db_users['users']

# RETURNS None || User class
def user_is_active_by_id(id_str):
    response = c_users.find_one({'_id': ObjectId(id_str)}, {
        'active': 1,
        'username': 1
    })
    if not response or not response['active']:
        return None
    return User(id_str, response['username'])