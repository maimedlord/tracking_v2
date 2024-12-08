import json
# from crypt import methods
from datetime import datetime

from bson import ObjectId

import db
from flask import abort, Flask, redirect, render_template, request, session, url_for
from flask_cors import CORS
from flask_login import LoginManager, current_user, login_user, login_required, logout_user
from flask_session import Session # not using this...
import re
from urllib.parse import urlparse, urljoin
import utility
from werkzeug.security import generate_password_hash

from config import http_500, http_204
from db import c_users
from utility import log_write

# ...
app = Flask(__name__)
app.config.from_pyfile('config.py')

Session(app)
# CORS(app, resources={r"/api/*": {"origins": "*"}}) # will need this for APIs to work with non-local resources

# ...
login_mgr = LoginManager()
login_mgr.init_app(app)
#login_mgr.login_message = ''
#login_mgr.login_view = ''

# ...
@login_mgr.user_loader
def user_loader(user_id):
    return db.user_is_active_by_id(user_id)


@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')


@app.route('/account')
@login_required
def account():
    return render_template('account.html', current_user_id=current_user.id_str)


@app.route('/error_page')
def error_page():
    return render_template('error_page.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    try:
        # logged-in users redirected to index
        if current_user.is_authenticated:
            return redirect('/index')
        # if user just created
        if 'message' in session.keys() and session['message'] is not None:
            usr_message = session['message']
            session['message'] = None # remove message from session as it has been received
            return render_template('login.html', usr_message=usr_message)
        # user tries logging in
        err_messages: list[str] = []
        if request.method == "POST":
            email: str = request.form['input_email']
            if not utility.validation_is_email(email):
                err_messages.append('The email you entered is invalid.')
            password = request.form['input_password']
            if not utility.validation_is_password(password):
                err_messages.append('The password you entered is invalid.')
            if not err_messages:
                response = db.user_authenticate(email, password)
                if response:
                    login_user(response) # login user
                    # NEED the entire following sequence needs to be fully understood:
                    next = request.args.get('next')
                    print('YOU NEED TO MAKE SURE THAT THIS LOGIN PROCEDURE IS SAFE: NEXT IS_SAFE_URL(NEXT)')
                    print(next)
                    if not utility.is_safe_url(next):
                        return abort(400)
                    return redirect(url_for('account'))
                err_messages.append('unable to log in with email/password combination. try again.')
        # if any errors in creating account redraw the page and inform user of errors
        if err_messages:
            return render_template('login.html', err_messages=err_messages)
        return render_template('login.html') # default render
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return redirect(url_for('error_page'))


@app.route('/logout')
@login_required
def logout():
    try:
        user_id: str = current_user.id_str
        logout_user()
        db.user_update_userLog(key=user_id, logCode=0, logMessage='used logged out', logTags=[
            'user',
            'logged-out',
            'user'
        ])
        return render_template('logout.html')
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return redirect(url_for('error_page'))


@app.route('/notes')
@login_required
def notes():
    return render_template('notes.html')


@app.route('/tasks')
@login_required
def tasks():
    return render_template('tasks.html')


@app.route('/user_create', methods=['GET', 'POST'])
def user_create():
    try:
        # logged-in users redirected to index
        if current_user.is_authenticated:
            return redirect('/index')
        # handle form submission
        err_messages: list[str] = []
        # user tries creating account
        if request.method == 'POST':
            email: str = request.form['input_user_email']
            if not utility.validation_is_email(email) or db.user_is_email_exists(email):
                err_messages.append('The email you entered already exists or is not a legitimate email.')
            username: str = request.form['input_user_username']
            if not utility.validation_is_username(username):
                err_messages.append(str(
                    'The username you entered is not valid. Usernames must start with an alpha or a number, '
                    'cannot contain any special characters and must be between 2 and 20 characters long.'
                ))
            password_1: str = request.form['input_user_password_1']
            password_2: str = request.form['input_user_password_2']
            if password_1 != password_2 or not utility.validation_is_password(password_1):
                err_messages.append(str(
                    'The passwords you entered do not match or are invalid. Passwords must contain one of '
                    'following special characters: @$!%*?&, must have at least one digit, one uppercase, '
                    'one lowercase character, and be between 12 or 32 characters long.'
                ))
            # create user
            if not err_messages:
                response = db.user_create(email, password_1, username)
                if response:
                    # session check in login page and message displayed if found
                    session['message'] = 'Your account was created successfully. Please login.'
                    return redirect('/login')
        # if any errors in creating account redraw the page and inform user of errors
        if err_messages:
            return render_template('user_create.html', err_messages=err_messages)
        return render_template('user_create.html') # default render
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return redirect(url_for('error_page'))


# API routes ##
@app.route('/api/note_create/<note_obj>')
@login_required
def api_note_create(note_obj):
    try:
        print('note_create: ' + note_obj)
        response = db.note_create(current_user.id_str, json.loads(note_obj))
        if response:
            print(response)
            return json.dumps({
                'status': 'success',
                'statusCode': 200,
                'data': []
            })
        return json.dumps(http_500)
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)


@app.route('/api/note_delete/<note_id>')
@login_required
def note_delete(note_id):
    try:
        response = db.note_delete(current_user.id_str, note_id)
        if response:
            print(response)
            return json.dumps({
                'status': 'success',
                'statusCode': 200,
                'data': []
            })
        return json.dumps(http_500)
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)


@app.route('/api/note_update/<note_obj>')
@login_required
def api_note_update(note_obj):
    try:
        response = db.note_update(current_user.id_str, json.loads(note_obj))
        if response:
            print(response)
            return json.dumps({
                'status': 'success',
                'statusCode': 200,
                'data': []
            })
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)


# confirmed working 24/11/13
@app.route('/api/notes_get_all')
@login_required
def api_notes_get_all():
    try:
        response = db.notes_get_all(current_user.id_str)
        # if other than None or empty list response has notes
        if response:
            response = utility.convert_datetimes_to_string(response) # convert datetime to string recursively
            response = utility.convert_objectids_to_string(response) # convert ObjectId to string recursively
            return json.dumps({
                'status': 'success',
                'statusCode': 200,
                'data': response
            })
        # handle empty list
        if isinstance(response, list):
            return json.dumps(http_204)
        # None indicates error
        return json.dumps(http_500)
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)


@app.route('/api/task_create/<task_obj>')
@login_required
def api_task_create(task_obj):
    try:
        print('task_create: ' + task_obj)
        response = db.task_create(current_user.id_str, json.loads(task_obj))
        if response:
            print(response)
            return json.dumps({
                'status': 'success',
                'statusCode': 200,
                'data': []
            })
        return json.dumps(http_500)
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)


@app.route('/api/task_delete/<task_id>')
@login_required
def api_task_delete(task_id):
    try:
        response = db.task_delete(current_user.id_str, task_id)
        if response:
            print(response)
            return json.dumps({
                'status': 'success',
                'statusCode': 200,
                'data': []
            })
        return json.dumps(http_500)
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)

@app.route('/api/task_update/<task_obj>')
@login_required
def api_task_update(task_obj):
    try:
        response = db.task_update(current_user.id_str, json.loads(task_obj))
        if response:
            print(response)
            return json.dumps({
                'status': 'success',
                'statusCode': 200,
                'data': []
            })
        return json.dumps(http_500)
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)


@app.route('/api/tasks_get_all')
@login_required
def api_tasks_get_all():
    try:
        response = db.tasks_get_all(current_user.id_str)
        # if other than None or empty list response has notes
        if response:
            response = utility.convert_datetimes_to_string(response)  # convert datetime to string recursively
            response = utility.convert_objectids_to_string(response)  # convert ObjectId to string recursively
            return json.dumps({
                'status': 'success',
                'statusCode': 200,
                'data': response
            })
        # handle empty list
        if isinstance(response, list):
            return json.dumps(http_204)
        # None indicates error
        return json.dumps(http_500)
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)


@app.route('/api/view_get/<target>')
@login_required
def api_view_get(target):
    try:
        response = db.view_get(current_user.id_str, target)
        print(response)
        if response:
            response = response['view_configs']['notes']
            return json.dumps({
                'status': 'success',
                'statusCode': 200,
                'data': response
            })
        return json.dumps(http_500)
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)


@app.route('/api/view_update/<view_obj>')
@login_required
def api_view_update(view_obj):
    try:
        response = db.view_update(current_user.id_str, json.loads(view_obj))
        if response:
            if response:
                print('api_view_update response' + str(response))
                return json.dumps({
                    'status': 'success',
                    'statusCode': 200,
                    'data': []
                })
        return json.dumps(http_500)
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps(http_500)

# TESTING
# if __name__ == '__main__':
#     # temp = db.notes_get_all('67327892c32490cdcec4ff2b')
#     # print(json.dumps(temp))
#     pass
