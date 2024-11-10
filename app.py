import json
from datetime import datetime
import db
from flask import abort, Flask, redirect, render_template, request, session, url_for
from flask_login import LoginManager, current_user, login_user, login_required, logout_user
# from flask_session import Session
import re
from urllib.parse import urlparse, urljoin
from utility import sanitize_chars
from werkzeug.security import generate_password_hash

# ...
app = Flask(__name__)
app.config.from_pyfile('config.py')

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


@app.route('/user_create')
def user_create():
    # logged-in users redirected to index
    if current_user.is_authenticated:
        return redirect('/index')
    if request.method == 'POST':
        # NEED input validation
        email: str = request.form['input_user_email']
        # NEED input validation
        username: str = request.form['input_user_username']
        # NEED input validation
        password_1: str = request.form['input_user_password_1']
        # NEED input validation
        password_2: str = request.form['input_user_password_2']
        pass
    return render_template('user_create.html')