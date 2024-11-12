from bson.objectid import ObjectId
from datetime import datetime, timezone
from pymongo import MongoClient

import utility
from user import User
from werkzeug.security import check_password_hash, generate_password_hash

# pymongo variables:
mongo_client = MongoClient()
db_users = mongo_client['tv2_users']
c_users = db_users['users']

# other variables:
userLog_num_elements: int = 100


# RETURN None
# confirmed working 24/11/12
def update_userLog(key: str, logCode: int, logMessage: str, logTags: list[str]) -> None:
    try:
        key_type: str = ''
        if '@' in key:
            key_type = 'email'
        else:
            key_type = '_id'
            key = ObjectId(key)
        response = c_users.update_one({key_type: key}, {"$push": {"userLog": {
            'logCode': logCode,
            'logDate': datetime.now(timezone.utc),
            'logMessage': logMessage,
            'logTags': logTags,
        }}})
        # check if userLog updated
        if not response.acknowledged:
            raise Exception('Unable to update userLog with new logEvent')
        # check size of userLog and pop oldest element if too many elements
        response = list(c_users.aggregate([
            {'$match': {key_type: key}},
            {'$project': {'_id': 0, 'userLog_size': {'$size': '$userLog'}}}
        ]))
        if response and response[0]['userLog_size'] > userLog_num_elements:
            response = c_users.update_one({key_type: key}, {'$pop': {'userLog': -1}})
            if not response.acknowledged:
                raise Exception('Unable to update userLog by popping earliest logEvent')
        return None
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return None


# RETURN None if user not found || User object if found
def user_authenticate(email: str, password: str):
    try:
        response = c_users.find_one({'email': email}, {
            'active': 1,
            '_id': 1,
            'passwordHash': 1,
            'userName': 1
        })
        if response and response['active'] and check_password_hash(response['passwordHash'], password):
            # update user document userLog with logEvent for successful login
            update_userLog(
                email,
                logCode=0,
                logMessage='User logged in successfully',
                logTags=['account', 'logged-in', 'user']
            )
            return User(str(response['_id']), response['userName'])
        return response
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return None


# RETURN True if account created || False if otherwise
def user_create(email: str, password: str, username: str) -> bool:
    new_user_obj = {
        'active': True,
        'confirmed': False,
        'dateCreated': datetime.now(),
        'email': email,
        'passwordHash': generate_password_hash(password),
        'userLog': [{
            'logCode': 0,
            'logDate': datetime.now(timezone.utc),
            'logMessage': 'user account created for the first time',
            'logTags': ['account', 'create', 'user']
        }],
        'userName': username,
    }
    try:
        response = c_users.insert_one(new_user_obj)
        if response.acknowledged:
            return True
        return False
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return False


# RETURN None if no mapping || email string if mapping found
def user_logout_by_id(id_str):
    try:
        id_obj: ObjectId = ObjectId(id_str)
        response = c_users.find_one({'_id': id_obj}, {
            'email': 1,
        })
        if response and response['email']:
            return response['email']
        return None
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return None


# RETURN None || User class
def user_is_active_by_id(id_str):
    try:
        response = c_users.find_one({'_id': ObjectId(id_str)}, {
            'active': 1,
            'userName': 1
        })
        if not response or not response['active']:
            return None
        return User(id_str, response['userName'])
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return None


# RETURN True if email exists || False if email does not exist
def user_is_email_exists(email):
    try:
        response = c_users.find_one({'email': email})
        if response:
            return True
        return False
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return None


# TESTING
if __name__ == '__main__':
    print(user_get_email_by_id('67327892c32490cdcec4ff2b'))