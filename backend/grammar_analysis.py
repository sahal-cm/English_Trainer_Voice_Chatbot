from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import difflib

MODEL_NAME = "vennify/t5-base-grammar-correction"

print("Loading grammar model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
print("Grammar model loaded!")


def calculate_grammar_score(original, corrected):
    if not original.strip():
        return 0

    if original.strip() == corrected.strip():
        return 100

    original_words = original.lower().split()
    corrected_words = corrected.lower().split()

    differences = abs(len(original_words) - len(corrected_words))

    for original_word, corrected_word in zip(
        original_words,
        corrected_words
    ):
        if original_word != corrected_word:
            differences += 1

    total_words = max(len(original_words), 1)

    error_ratio = differences / total_words

    score = 100 - (error_ratio * 100)

    return max(0, min(100, round(score)))


def find_grammar_changes(original, corrected):
    original_words = original.split()
    corrected_words = corrected.split()

    matcher = difflib.SequenceMatcher(
        None,
        original_words,
        corrected_words
    )

    changes = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():

        if tag == "replace":
            changes.append({
                "original": " ".join(original_words[i1:i2]),
                "corrected": " ".join(corrected_words[j1:j2])
            })

        elif tag == "delete":
            changes.append({
                "original": " ".join(original_words[i1:i2]),
                "corrected": ""
            })

        elif tag == "insert":
            changes.append({
                "original": "",
                "corrected": " ".join(corrected_words[j1:j2])
            })

    return changes


def analyze_grammar(text):
    if not text.strip():
        return {
            "original": text,
            "corrected": text,
            "has_errors": False,
            "grammar_score": 0
        }

    inputs = tokenizer(
        "grammar: " + text,
        return_tensors="pt"
    )

    outputs = model.generate(
        **inputs,
        max_new_tokens=128
    )

    corrected = tokenizer.decode(
        outputs[0],
        skip_special_tokens=True
    )

    grammar_score = calculate_grammar_score(
        text,
        corrected
    )

    changes = find_grammar_changes(
        text,
        corrected
    )

    return {
        "original": text,
        "corrected": corrected,
        "has_errors": corrected.strip() != text.strip(),
        "grammar_score": grammar_score,
        "changes": changes
    }