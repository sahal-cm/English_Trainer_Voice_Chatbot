from transformers import AutoTokenizer, AutoModelForCausalLM
import torch


MODEL_NAME = "Qwen/Qwen2.5-0.5B-Instruct"

print("Loading conversation model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    dtype=torch.float32
)

print("Conversation model loaded!")



SYSTEM_PROMPT = """
You are an English speaking practice coach.

Your job is to keep a natural conversation with an English learner.

Follow these rules strictly:
- Reply in 1 or 2 short sentences.
- Ask exactly ONE follow-up question.
- The question must directly relate to the learner's latest message.
- Use the previous conversation only when it helps understand the latest message.
- Do not change the topic without a reason.
- Do not repeat a question that was already asked.
- Encourage the learner to explain, describe, or share an opinion.
- Use simple and natural English.
- Do not correct grammar unless the learner asks for correction.
- Never talk about being an AI or language model.
- Be friendly and supportive.
"""





def generate_response(user_text, history):
    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
    ]

    # Add previous conversation
    for message in history:
        messages.append({
            "role": message["role"],
            "content": message["text"]
        })

    # Add current user message
    messages.append({
        "role": "user",
        "content": user_text
    })

    prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    inputs = tokenizer(
        prompt,
        return_tensors="pt"
    )

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=40,
            do_sample=True,
            temperature=0.5,
            top_p=0.85
        )

    new_tokens = outputs[0][inputs["input_ids"].shape[1]:]

    response = tokenizer.decode(
        new_tokens,
        skip_special_tokens=True
    )

    return response.strip()