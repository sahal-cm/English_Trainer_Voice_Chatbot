def calculate_communication_score(fluency_score, grammar_score):
    """
    Calculate an overall communication score.

    Fluency: 60%
    Grammar: 40%
    """

    score = (
        fluency_score * 0.60
        + grammar_score * 0.40
    )

    return round(score)