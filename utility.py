from bson import ObjectId
from flask import request
import re
from datetime import datetime, timezone
from urllib.parse import urlparse, urljoin

# log variables:
log_path: str = 'C:/Users/liste/PycharmProjects/tracking_v2/logs/tracking_v2_log.csv' # SYSTEM DEPENDENT

# other variables
date_format: str = '%Y-%m-%dT%H:%M:%S' # 2024-10-10T11:05:55

# RETURN object
# recursively changes datetime objects to strings
def convert_datetimes_to_string(obj) -> object:
    if isinstance(obj, datetime):
        return obj.strftime(date_format)  # Convert datetime to string in desired format
    elif isinstance(obj, dict):  # If it's a dictionary, process each value
        for key, value in obj.items():
            obj[key] = convert_datetimes_to_string(value)  # Update with converted value
    elif isinstance(obj, (list, tuple, set)):  # If it's a list, tuple, or set, iterate and update
        obj = type(obj)(convert_datetimes_to_string(item) for item in obj)
    return obj


# RETURN object
# recursively changes ObjectId objects to strings
def convert_objectids_to_string(obj):
    if isinstance(obj, ObjectId):
        return str(obj)  # Convert ObjectId to string
    elif isinstance(obj, dict):  # If it's a dictionary, process each value
        for key, value in obj.items():
            obj[key] = convert_objectids_to_string(value)  # Update with converted value
    elif isinstance(obj, (list, tuple, set)):  # If it's a list, tuple, or set, iterate and update
        obj = type(obj)(convert_objectids_to_string(item) for item in obj)
    return obj


# RETURN True if danger chars found | False if no danger chars found
def has_danger_chars(input_str: str) -> bool:
    danger_chars: list[str] = [';']
    if any(char in input_str for char in danger_chars):
        return True
    return False


# RETURN ???
# for logging in user... // MIGHT NEED TO GET PRESENT FOR ALL REDIRECTS???
def is_safe_url(target):
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ('http', 'https') and ref_url.netloc == test_url.netloc


# RETURN None
def log_write(err_message: str) -> None:
    now_date: datetime = datetime.now(timezone.utc)
    # Safely open a file for reading
    with open(log_path, 'a') as file:
        file.write(now_date.strftime(date_format) + ',' + err_message + '\n')


# RETURN input string minus danger characters
def sanitize_chars(input_str: str) -> str:
    return re.sub("[;#:&?*%<>{}|,^\"]", '', input_str)


# RETURN True if email is legit || False otherwise
def validation_is_email(email: str) -> bool:
    # Regular expression for a simple email validation
    email_regex = r'^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))


# RETURN True if legit password || False otherwise
def validation_is_password(password: str) -> bool:
    # Regex Explanation:
    # - ^: Start of the string
    # - (?=.*[A-Z]): At least one uppercase letter
    # - (?=.*[a-z]): At least one lowercase letter
    # - (?=.*\d): At least one digit
    # - (?=.*[@$!%*?&]): At least one special character from @$!%*?&
    # - [A-Za-z\d@$!%*?&]{20,32}: Allowed characters (letters, digits, special), min length 12, max length 32
    # - $: End of the string
    password_regex = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,32}$'
    return bool(re.match(password_regex, password))


# RETURN True if legit username || False otherwise
# keep in mind usernames are not unique!
def validation_is_username(username: str) -> bool:
    # Regular expression for a simple email validation
    username_regex = r'^[a-zA-Z0-9]\w{1,19}$' # 2..20 chars. must start with alpha or digit. no specials allowed.
    return bool(re.match(username_regex, username))


# TESTING
if __name__ == '__main__':
    print(validation_is_email('t1@t1.com'))
