import json
from datetime import datetime

from bson import ObjectId

import db
from flask import abort, Flask, redirect, render_template, request, session, url_for
from flask_login import LoginManager, current_user, login_user, login_required, logout_user
from flask_session import Session # not using this...
import re
from urllib.parse import urlparse, urljoin
import utility
from werkzeug.security import generate_password_hash

from db import c_users
from utility import log_write

# ...
app = Flask(__name__)
app.config.from_pyfile('config.py')

Session(app)

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


# API routes
# HERE NEED TO CONVERT OBJECTIDS AND DATES TO STRINGS BEFORE JSON.DUMPS...
@app.route('/api/note_create/<note_obj>', methods=['GET', 'POST'])
@login_required
def api_note_create(note_obj):
    try:
        response = db.notes_get_all(current_user.id_str)
        if response:
            return json.dumps({
                'status': 'success',
                'status_code': 200,
                'data': response
            })
        return json.dumps({
            'status': 'fail',
            'status_code': 204,
            'data': 'Failed to retrieve notes...'
        })
    except Exception as e:
        print(str(e))
        utility.log_write(str(e))
        return json.dumps({
            'status': 'fail',
            'status_code': 400,
            'data': 'There was a server failure...'
        })

# TESTING
# if __name__ == '__main__':
#     # temp = db.notes_get_all('67327892c32490cdcec4ff2b')
#     # print(json.dumps(temp))
#     pass
