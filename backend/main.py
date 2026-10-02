from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI English Voice Trainer is running!"}