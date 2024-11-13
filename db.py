import json

from bson.objectid import ObjectId
from datetime import datetime, timezone

from flask import Response
from pymongo import MongoClient

import utility
from user import User
from werkzeug.security import check_password_hash, generate_password_hash

# pymongo variables:
mongo_client = MongoClient()
db_measurables = mongo_client['tv2_measurables'] # not in use yet
db_notes = mongo_client['tv2_notes']
db_tasks = mongo_client['tv2_tasks'] # not in use yet
db_users = mongo_client['tv2_users']
c_users = db_users['users']


# other variables:
noteLog_num_elements: int = 100
userLog_num_elements: int = 100

# RETURN None if creating note fails || insert_one object if successful
def note_create(id_str: str, note_obj: dict):
    try:
        collection = db_notes[id_str]
        response = collection.insert_one(note_obj)
        if response and response.acknowledged:
            return response
        raise Exception('unable to create note in database...')
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return None


# RETURN None if deleting note fails || delete_one object if successful
def note_delete(user_id_str: str, note_id_str: str):
    try:
        collection = db_notes[user_id_str]
        response = collection.delete_one({'_id': ObjectId(note_id_str)})
        if response and response.acknowledged:
            return response
        raise Exception('unable to delete note in database...')
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return None


# RETURN True if note updated || False if any errors encountered
# confirmed working 24/11/12
def note_update(user_id_str: str, note_id_str: str, note_obj: dict) -> bool:
    try:
        collection = db_notes[user_id_str]
        response = collection.update_one({'_id': ObjectId(note_id_str)}, {
            '$set': {
                'title': note_obj['title'],
                'location': note_obj['location'],
                'tags': note_obj['tags'],
                'text': note_obj['text']
            },
            '$push': {
                'noteLog': {
                    'logDate': datetime.now(timezone.utc),
                    'logCode': 0,
                    'logMessage': 'note updated'
                }
            }
        })
        # check if userLog updated
        if not response.acknowledged:
            raise Exception('Unable to update userLog with new logEvent')
        # check size of userLog and pop oldest element if too many elements
        response = list(collection.aggregate([
            {'$match': {'_id': ObjectId(note_id_str)}},
            {'$project': {'_id': 0, 'noteLog_size': {'$size': '$noteLog'}}}
        ]))
        if response and response[0]['noteLog_size'] > noteLog_num_elements:
            response = collection.update_one({'_id': ObjectId(note_id_str)}, {'$pop': {'noteLog': -1}})
            if not response.acknowledged:
                raise Exception('Unable to update noteLog by popping earliest logEvent')
        return True
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return False


# RETURN None if error or no docs || list of all docs if exist
def notes_get_all(user_id_str: str):
    collection = db_notes[user_id_str]
    response = collection.find()
    if response:
        # convert all ObjectId's to strings
        for note in response:
            note['_id'] = str(note['_id'])
        return list(response)
    return None


# RETURN None
# confirmed working 24/11/12
def user_update_userLog(key: str, logCode: int, logMessage: str, logTags: list[str]) -> None:
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
            user_update_userLog(
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
    # print(notes_get_all('67327892c32490cdcec4ff2b'))

    # print(note_create('67327892c32490cdcec4ff2b',{
    #     'dateCreated': datetime.now(timezone.utc),
    #     'title': 'the title of the note',
    #     'location': 'location as string',
    #     'noteLog': [{
    #         'logDate': datetime.now(timezone.utc),
    #         'logCode': 0,
    #         'logMessage': 'note first created'
    #     }],
    #     'tags': ['tag1', 'tag2'],
    #     'text': 'text of de note my boy'
    # }))
    # print(note_delete('67327892c32490cdcec4ff2b', '6733f09710745e9c7d549d30'))
    # print('the note update was: ' + str(note_update('67327892c32490cdcec4ff2b', '6733fbf412982d5587dca55b', {
    #     'title': 'this title has been updated!',
    #     'location': 'location as string UPDATED UPDATEDUPDATEDUPDATEDUPDATEDUPDATED',
    #     'tags': ['tag1', 'tag2', 'TAG3'],
    #     'text': 'text of de note my boy UPDATED!'
    # })))
    print(json.dumps({
        'dateCreated': datetime.now(timezone.utc),
        'title': 'the title of the note',
        'location': 'location as string',
        'noteLog': [{
            'logDate': datetime.now(timezone.utc),
            'logCode': 0,
            'logMessage': 'note first created'
        }],
        'tags': ['tag1', 'tag2'],
        'text': 'text of de note my boy'
    }))
    pass