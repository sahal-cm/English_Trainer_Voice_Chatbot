from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import whisper
import tempfile
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load Whisper once when the server starts
print("Loading Whisper model...")
model = whisper.load_model("tiny")
print("Whisper model loaded!")



@app.get("/")
def home():
    return {"message": "AI English Voice Trainer is running!"}



@app.get("/api/test")
def test():
    return {"message": "Hello from FastAPI!"} 



@app.post("/api/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    audio_data = await file.read()

    # Save uploaded audio temporarily
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".webm"
    ) as temp_audio:
        temp_audio.write(audio_data)
        temp_path = temp_audio.name

    try:
        # Transcribe audio using local Whisper
        result = model.transcribe(
            temp_path,
            language="en"
        )

        transcription = result["text"].strip()

    finally:
        # Delete temporary audio file
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {
        "message": "Audio transcribed successfully!",
        "filename": file.filename,
        "transcription": transcription,
    }


