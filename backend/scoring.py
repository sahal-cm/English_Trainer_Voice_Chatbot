def calculate_fluency_score(analysis):
    score = 100

    # Speaking rate
    wpm = analysis["speaking_rate_wpm"]

    if wpm < 80:
        score -= 15
    elif wpm < 100:
        score -= 5
    elif wpm > 180:
        score -= 15
    elif wpm > 160:
        score -= 5

    # Filler words
    filler_count = analysis["filler_word_count"]

    score -= min(filler_count * 3, 15)

    # Pauses
    pause_count = analysis["pause_count"]

    score -= min(pause_count * 2, 10)

    # Long pauses
    longest_pause = analysis["longest_pause_seconds"]

    if longest_pause > 3:
        score -= 10
    elif longest_pause > 2:
        score -= 5

    score = max(0, min(100, score))

    return round(score)