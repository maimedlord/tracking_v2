import re


# RETURN True if danger chars found | False if no danger chars found
def has_danger_chars(input_str: str) -> bool:
    danger_chars: list[str] = [';']
    if any(char in input_str for char in danger_chars):
        return True
    return False


# RETURN input string minus danger characters
def sanitize_chars(input: str) -> str:
    return re.sub("[;#:&?*%<>{}|,^\"]", '', input)