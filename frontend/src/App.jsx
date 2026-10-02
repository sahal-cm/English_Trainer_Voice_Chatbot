import { useState, useRef } from "react";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Ready to speak");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        console.log("Recording completed:", audioBlob);
        console.log("Audio size:", audioBlob.size, "bytes");

        stream.getTracks().forEach((track) => track.stop());

        setStatus("Recording completed");
      };

      mediaRecorder.start();

      setIsRecording(true);
      setStatus("Listening...");
    } catch (error) {
      console.error("Microphone error:", error);
      setStatus("Microphone permission denied or unavailable");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus("Processing...");
    }
  };

  return (
    <div>
      <header>
        <h1>🗣️ AI English Coach</h1>
        <span>● Online</span>
      </header>

      <main>
        <h2>Daily Conversation</h2>

        <div>
          <p>AI</p>
          <div>Hi! How was your day?</div>
        </div>

        <div>
          <p>You</p>
          <div>
            It was good. I worked on my project.
          </div>
        </div>

        <p style={{ textAlign: "center" }}>{status}</p>

        {!isRecording ? (
          <button onClick={startRecording}>
            🎤 Start Speaking
          </button>
        ) : (
          <button onClick={stopRecording}>
            ⏹️ Stop Recording
          </button>
        )}
      </main>

      <footer>
        <span>Mode: Daily Conversation</span>
        <span>Level: Intermediate</span>
      </footer>
    </div>
  );
}

export default App;