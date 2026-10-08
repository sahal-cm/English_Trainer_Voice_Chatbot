import { useState, useRef } from "react";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Ready to speak");
  const [transcription, setTranscription] = useState("");
  const [speechAnalysis, setSpeechAnalysis] = useState(null);
  const [fluencyScore, setFluencyScore] = useState(null);
  const [grammarAnalysis, setGrammarAnalysis] = useState(null);
  const [communicationScore, setCommunicationScore] = useState(null);
  const [aiMessage, setAiMessage] = useState("Hi! How was your day?");
  const [conversation, setConversation] = useState([
    {
      role: "ai",
      text: "Hi! How was your day?",
    },
  ]);

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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        stream.getTracks().forEach((track) => track.stop());

        setStatus("Uploading audio...");

        const formData = new FormData();

        formData.append("file", audioBlob, "recording.webm");

        try {
          const response = await fetch(
            "http://127.0.0.1:8000/api/upload-audio",
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await response.json();

          console.log("Backend response:", data);

          setTranscription(data.transcription);
          setConversation((prev) => [
            ...prev,
            {
              role: "user",
              text: data.transcription,
            },
          ]);
          setSpeechAnalysis(data.speech_analysis);
          setFluencyScore(data.fluency_score);
          setGrammarAnalysis(data.grammar_analysis);
          setCommunicationScore(data.communication_score);

          const conversationHistory = [
            ...conversation,
            {
              role: "user",
              text: data.transcription,
            },
          ];

          const conversationResponse = await fetch(
            "http://127.0.0.1:8000/api/conversation",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: data.transcription,
                history: conversationHistory,
              }),
            }
          );

          const conversationData = await conversationResponse.json();

          setAiMessage(conversationData.response);


          setConversation((prev) => [
            ...prev,
            {
              role: "ai",
              text: conversationData.response,
            },
          ]);

          setStatus("Analysis complete!");

        } catch (error) {
          console.error("Upload error:", error);
          setStatus("Failed to upload audio");
        }
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

        
          {conversation.map((message, index) => (
            <div key={index}>
              <p>{message.role === "ai" ? "AI" : "You"}</p>
              <div>{message.text}</div>
              <br />
            </div>
          ))}
        

        <div>

          {communicationScore !== null && (
            <div className="analysis-section">
              <h2>Overall Communication Score</h2>

              <p>
                <strong>{communicationScore}/100</strong>
              </p>
            </div>
          )}

          {grammarAnalysis && (
            <div className="analysis-section">
              <h2>Grammar Analysis</h2>

              <p>
                <strong>Grammar Score:</strong>{" "}
                {grammarAnalysis.grammar_score}/100
              </p>

              <p>
              <strong>Original:</strong>{" "}
              {grammarAnalysis.original}
              </p>

              <p>
              <strong>Corrected:</strong>{" "}
              {grammarAnalysis.corrected}
              </p>

              <p>
                <strong>Grammar Issues:</strong>{" "}
                {grammarAnalysis.has_errors ? "Found" : "None"}
              </p>

              {grammarAnalysis.changes.length > 0 && (
                <div>
                  <strong>Detected Changes:</strong>

                  <ul>
                    {grammarAnalysis.changes.map((change, index) => (
                      <li key={index}>
                        "{change.original}" → "{change.corrected}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          

          {speechAnalysis && (
            <div>
              <h3>Speech Analysis</h3><br/>

              <h4>Fluency Score</h4>
              <p>
                {fluencyScore !== null ? `${fluencyScore}/100` : "--"}
              </p><br/>

              <p>
                Words: {speechAnalysis.word_count}
              </p>

              <p>
                Duration: {speechAnalysis.duration_seconds}s
              </p>

              <p>
                Speaking Rate: {speechAnalysis.speaking_rate_wpm} WPM
              </p>

              <p>
                Filler Words: {speechAnalysis.filler_word_count}
              </p>

              <p>
                {speechAnalysis.filler_words.length > 0
                ? `Detected: ${speechAnalysis.filler_words.join(", ")}`
                : "No filler words detected"}
              </p>

              <p>
                Pauses: {speechAnalysis.pause_count}
              </p>

              <p>
                Total Pause Time: {speechAnalysis.total_pause_seconds}s
              </p>

              <p>
                Longest Pause: {speechAnalysis.longest_pause_seconds}s
              </p>

            </div>
          )}

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