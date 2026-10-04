from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = "vennify/t5-base-grammar-correction"

print("Loading grammar model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
print("Grammar model loaded!")


def analyze_grammar(text):
    if not text.strip():
        return {
            "original": text,
            "corrected": text,
            "has_errors": False
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

    return {
        "original": text,
        "corrected": corrected,
        "has_errors": corrected.strip() != text.strip()
    }