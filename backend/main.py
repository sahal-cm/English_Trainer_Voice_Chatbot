from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "AI English Voice Trainer is running!"}


@app.get("/api/test")
def test():
    return {"message": "Hello from FastAPI!"} 


@app.post("/api/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    audio_data = await file.read()

    return {
        "message": "Audio received successfully!",
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(audio_data),
    }