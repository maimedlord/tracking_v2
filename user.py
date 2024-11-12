from flask_login import UserMixin


class User(UserMixin):
    def __init__(self, id_str: str, username: str):
        #self.email = email
        #self.id_obj = id_obj
        self.id_str = id_str
        self.is_active() # NEED to validate that this is okay. was new for this project...
        self.username = username

    def is_active(self):
        return True

    def is_anonymous(self):
        return False

    def is_authenticated(self):
        return True

    def get_id(self):
        return self.id_str
