import re


def analyze_speech(transcription, duration, segments):
    words = transcription.split()
    word_count = len(words)

    # Words per minute
    if duration > 0:
        speaking_rate = (word_count / duration) * 60
    else:
        speaking_rate = 0

    # Filler words
    filler_pattern = r"\b(um|uh|like|you know|actually|basically)\b"

    fillers = re.findall(
        filler_pattern,
        transcription.lower()
    )

    # Pause analysis
    pauses = []

    for i in range(1, len(segments)):
        previous_end = segments[i - 1]["end"]
        current_start = segments[i]["start"]

        pause = current_start - previous_end

        # Consider gaps longer than 0.5 seconds as pauses
        if pause >= 0.5:
            pauses.append(round(pause, 2))

    total_pause_time = sum(pauses)

    return {
        "word_count": word_count,
        "duration_seconds": round(duration, 2),
        "speaking_rate_wpm": round(speaking_rate, 2),
        "filler_word_count": len(fillers),
        "filler_words": fillers,
        "pause_count": len(pauses),
        "total_pause_seconds": round(total_pause_time, 2),
        "longest_pause_seconds": max(pauses) if pauses else 0,
    }