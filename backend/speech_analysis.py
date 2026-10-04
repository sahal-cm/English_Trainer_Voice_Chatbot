import re


def analyze_speech(transcription, duration):
    words = transcription.split()
    word_count = len(words)

    # Words per minute
    if duration > 0:
        speaking_rate = (word_count / duration) * 60
    else:
        speaking_rate = 0

    # Common filler words
    filler_pattern = r"\b(um|uh|like|you know|actually|basically)\b"

    fillers = re.findall(
        filler_pattern,
        transcription.lower()
    )

    return {
        "word_count": word_count,
        "duration_seconds": round(duration, 2),
        "speaking_rate_wpm": round(speaking_rate, 2),
        "filler_word_count": len(fillers),
        "filler_words": fillers,
    }