def generate_response(user_text, turn):
    text = user_text.lower()

    if turn == 1:
        return "That's interesting! What was the best part of your day?"

    if turn == 2:
        return "Nice! Can you tell me a little more about that?"

    if "college" in text or "class" in text or "study" in text:
        return "What are you currently learning, and why did you choose it?"

    if "project" in text:
        return "That sounds interesting. What problem does your project solve?"

    if "work" in text or "job" in text:
        return "What do you enjoy most about your work?"

    if "food" in text or "eat" in text:
        return "What kind of food do you usually enjoy?"

    if "movie" in text or "film" in text:
        return "What kind of movies do you usually watch?"

    return "That's interesting. Could you tell me more about that?"