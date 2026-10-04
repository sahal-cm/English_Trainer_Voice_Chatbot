import whisper

print("Loading Whisper model...")

model = whisper.load_model("tiny")

print("Model loaded!")

audio_file = "test_audio.wav"

print("Transcribing...")

result = model.transcribe(
    audio_file,
    language="en"
)

print("\nTranscription:")
print(result["text"])