# helpers.py
def format_conversation(messages):
    """
    Formats a list of message objects (skipping the first system message)
    into a single newline-separated string.
    """
    return "\n".join(f"{msg.type.upper()}: {msg.content}" for msg in messages[1:])
