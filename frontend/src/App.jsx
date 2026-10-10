
import { useState, useRef, useEffect } from "react";

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
    { role: "ai", text: "Hi! How was your day?" },
  ]);
  const [typedMessage, setTypedMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // UI controls
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  
  const [practiceMode, setPracticeMode] = useState("voice");

  const [savedConversations, setSavedConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);


  useEffect(() => {
    try {
      const saved = localStorage.getItem("speakwise_conversations");

      if (saved) {
        setSavedConversations(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load saved conversations:", error);
    }
  }, []);

  useEffect(() => {
    if (!activeConversationId || conversation.length === 0) return;

    setSavedConversations((previous) => {
      const existing = previous.find(
        (item) => item.id === activeConversationId
      );

      const updatedConversation = {
        id: activeConversationId,
        title:
          conversation.find((message) => message.role === "user")?.text
            ?.slice(0, 35) || "New Conversation",
        messages: conversation,
        updatedAt: new Date().toISOString(),
      };

      const updated = existing
        ? previous.map((item) =>
            item.id === activeConversationId
              ? updatedConversation
              : item
          )
        : [updatedConversation, ...previous];

      localStorage.setItem(
        "speakwise_conversations",
        JSON.stringify(updated)
      );

      return updated;
    });
  }, [conversation, activeConversationId]);


  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);


  const startNewConversation = () => {
    if (isRecording || isSending || isProcessingAudio) return;

    const newId = crypto.randomUUID();

    setActiveConversationId(newId);
    setConversation([{ role: "ai", text: "Hi! How was your day?" }]);

    setTranscription("");
    setSpeechAnalysis(null);
    setFluencyScore(null);
    setGrammarAnalysis(null);
    setCommunicationScore(null);
    setAiMessage("Hi! How was your day?");
    setTypedMessage("");
    setStatus("Ready to speak or type");
    setIsSidebarOpen(false);
    setIsAnalysisOpen(false);
  };

  const openConversation = (item) => {
    if (isRecording || isSending || isProcessingAudio) return;

    setActiveConversationId(item.id);
    setConversation(item.messages);

    const lastAIMessage = [...item.messages]
      .reverse()
      .find((message) => message.role === "ai");

    setAiMessage(
      lastAIMessage?.text || "Hi! How was your day?"
    );

    setTypedMessage("");
    setTranscription("");
    setSpeechAnalysis(null);
    setFluencyScore(null);
    setGrammarAnalysis(null);
    setCommunicationScore(null);

    setStatus("Conversation loaded");
    setIsSidebarOpen(false);
    setIsAnalysisOpen(false);
  };

  const sendTypedMessage = async (event) => {
    event.preventDefault();

    const text = typedMessage.trim();
    if (!text || isSending || isRecording || isProcessingAudio) return;

    const updatedHistory = [...conversation, { role: "user", text }];

    setConversation(updatedHistory);
    setTypedMessage("");
    setIsSending(true);
    setStatus("AI is thinking...");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/conversation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, history: updatedHistory }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      setAiMessage(data.response);

      setConversation((prev) => [
        ...prev,
        { role: "ai", text: data.response },
      ]);

      setStatus("Ready to speak or type");
    } catch (error) {
      console.error("Conversation error:", error);
      setStatus("Failed to get AI response. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    if (isSending || isProcessingAudio || isRecording) return;

    setIsProcessingAudio(true);

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

          if (!response.ok) {
            throw new Error("Failed to upload audio");
          }

          const data = await response.json();
          console.log("Backend response:", data);

          setTranscription(data.transcription);
          setSpeechAnalysis(data.speech_analysis);
          setFluencyScore(data.fluency_score);
          setGrammarAnalysis(data.grammar_analysis);
          setCommunicationScore(data.communication_score);

          const conversationHistory = [
            ...conversation,
            { role: "user", text: data.transcription },
          ];

          setConversation((prev) => [
            ...prev,
            { role: "user", text: data.transcription },
          ]);

          setStatus("Getting AI response...");

          const conversationResponse = await fetch(
            "http://127.0.0.1:8000/api/conversation",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                text: data.transcription,
                history: conversationHistory,
              }),
            }
          );

          if (!conversationResponse.ok) {
            throw new Error("Failed to get AI response");
          }

          const conversationData = await conversationResponse.json();
          setAiMessage(conversationData.response);

          setConversation((prev) => [
            ...prev,
            { role: "ai", text: conversationData.response },
          ]);

          setStatus("Analysis complete!");
        } catch (error) {
          console.error("Audio processing error:", error);
          setStatus("Audio processing failed. Please try again.");
        } finally {
          setIsProcessingAudio(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("Listening...");
    } catch (error) {
      console.error("Microphone error:", error);
      setStatus("Microphone permission denied or unavailable");
      setIsProcessingAudio(false);
    }
  };


  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus("Processing your speech...");
    }
  };

  
  const speakMessage = (text) => {
    if (!("speechSynthesis" in window)) {
      setStatus("Text-to-speech is not supported in this browser.");
      return;
    }

    // Stop any previous speech before starting another
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };


  
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };



  const closeMobilePanels = () => {
    setIsSidebarOpen(false);
    setIsAnalysisOpen(false);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="mobile-menu-button"
          onClick={() => {
            setIsSidebarOpen((open) => !open);
            setIsAnalysisOpen(false);
          }}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>

        
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48">
              {[5, 11, 18, 12, 22, 14, 8].map((height, index) => (
                <line
                  key={index}
                  x1={6 + index * 6}
                  y1={24 - height / 2}
                  x2={6 + index * 6}
                  y2={24 + height / 2}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </span>

          <div className="brand-text">
            <h1>SpeakWise AI</h1>
            <p>Speak confidently. Improve every day.</p>
          </div>
        </div>

        <div className="header-actions">
          <span className="online-status">
            <span className="online-dot" />
            Online
          </span>

          <button
            className="mobile-analysis-button"
            onClick={() => {
              setIsAnalysisOpen((open) => !open);
              setIsSidebarOpen(false);
            }}
          >
            Analysis
          </button>
        </div>
      </header>

      <div className="workspace">
        <aside className={`sidebar ${isSidebarOpen ? "sidebar-open" : ""}`}>
          <button
            className="new-conversation-button"
            onClick={startNewConversation}
            disabled={isRecording || isSending}
          >
            <span>＋</span> New Conversation
          </button>

          <div className="sidebar-section-label">WORKSPACE</div>

          <button className="sidebar-item active" onClick={closeMobilePanels}>
            <span>◉</span> Daily Conversation
          </button>

          <button
            className="sidebar-item progress-disabled"
            disabled
            title="The progress dashboard will be added in a later step."
          >
            <span>▥</span> My Progress
            <span className="coming-soon">Soon</span>
          </button>

          {savedConversations.length > 0 && (
            <>
              <div className="sidebar-section-label">RECENT CHATS</div>

              <div className="conversation-history-list">
                {savedConversations.map((item) => (
                  <button
                    key={item.id}
                    className={`sidebar-item history-item ${
                      activeConversationId === item.id ? "active" : ""
                    }`}
                    onClick={() => openConversation(item)}
                    disabled={
                      isRecording || isSending || isProcessingAudio
                    }
                    title={item.title}
                  >
                    <span>◷</span>
                    <span className="history-title">{item.title}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          
          <div className="sidebar-bottom">
            <div className="sidebar-avatar">AI</div>
            <div>
              <strong>English Coach</strong>
              <p>Speaking practice</p>
            </div>
          </div>
        </aside>

        <main className="chat-panel">
          <div className="chat-heading">
            <div>
              <h2>Daily Conversation</h2>
              <p>Practise naturally, one conversation at a time.</p>
            </div>
            <span className="level-pill">Intermediate</span>
          </div>

          <div className="conversation-area">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`chat-message ${
                  message.role === "ai" ? "ai" : "user"
                }`}
              >
                <div className="message-avatar" aria-hidden="true">
                  {message.role === "ai" ? "✦" : "●"}
                </div>

                <div className="message-content">
                  <div className="message-label">
                    {message.role === "ai" ? "AI Coach" : "You"}
                  </div>
                  <div className="message-bubble">{message.text}</div>

                  {message.role === "ai" && (
                    <div className="speech-controls">
                      <button
                        className="speak-button"
                        onClick={() => speakMessage(message.text)}
                        title="Listen to this response"
                      >
                        🔊 Listen
                      </button>

                      <button
                        className="speak-button"
                        onClick={stopSpeaking}
                        title="Stop speaking"
                      >
                      ⏹ Stop
                      </button>
                    </div>
                  )}

                </div>
              </div>
            ))}

            {isSending && (
              <div className="thinking-indicator">AI Coach is thinking...</div>
            )}
          </div>

          <div className="composer-area">
            <div className="practice-mode-selector">
              <button
                type="button"
                className={practiceMode === "voice" ? "mode-button active" : "mode-button"}
                onClick={() => setPracticeMode("voice")}
                disabled={isSending || isRecording || isProcessingAudio}
              >
                🎤 Voice Mode
              </button>

              <button
                type="button"
                className={practiceMode === "typing" ? "mode-button active" : "mode-button"}
                onClick={() => setPracticeMode("typing")}
                disabled={isSending || isRecording || isProcessingAudio}
              >
                ⌨️ Typing Mode
              </button>
            </div>
            <p className="status-message">{status}</p>

            {practiceMode === "typing" && (
              <form className="message-form" onSubmit={sendTypedMessage}>
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(event) => setTypedMessage(event.target.value)}
                  placeholder="Type your answer here..."
                  disabled={isSending || isRecording || isProcessingAudio}
                  aria-label="Type your message"
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={!typedMessage.trim() || isSending || isRecording || isProcessingAudio }
                >
                  {isSending ? "..." : "Send"}
                
                  {/* {isProcessingAudio && !isRecording && (
                    <div className="thinking-indicator">
                      Processing your voice...
                    </div>
                  )} */}

                </button>
              </form>
            )}  

            {practiceMode === "voice" && (
              <div className="voice-row">
                {!isRecording ? (
                  <button
                    className="record-button"
                    onClick={startRecording}
                    disabled={isSending || isProcessingAudio}
                  >
                    <span>🎤</span> Start Speaking
                  </button>
                ) : (
                  <button className="record-button recording" onClick={stopRecording}>
                    <span>⏹</span> Stop Recording
                  </button>
                )}
                <span className="voice-hint">
                  {isRecording
                    ? "Listening to your answer"
                    : "Prefer speaking? Use your microphone"}
                </span>
              </div>
            )}

          </div>
        </main>

        <aside
          className={`analysis-panel ${
            isAnalysisOpen ? "analysis-open" : ""
          }`}
        >
          <div className="analysis-heading">
            <div>
              <h2>Your Practice</h2>
              <p>Your latest learning insights</p>
            </div>
            <button
              className="close-analysis-button"
              onClick={() => setIsAnalysisOpen(false)}
              aria-label="Close analysis"
            >
              ✕
            </button>
          </div>

          <section className="insight-card goal-card">
            <div className="card-eyebrow">TODAY'S GOAL</div>
            <h3>Speak with confidence</h3>
            <p>Try to express your ideas clearly in complete sentences.</p>
            <div className="goal-progress-track">
              <div
                className={`goal-progress-fill ${
                  speechAnalysis ? "goal-progress-started" : ""
                }`}
              />
            </div>
            <span className="goal-caption">
              {speechAnalysis ? "First practice completed" : "Start a conversation to begin"}
            </span>
          </section>

          <section className="insight-card">
            <div className="section-title-row">
              <h3>Latest Scores</h3>
              <span className="live-label">LIVE</span>
            </div>

            <div className="score-row">
              <span>Communication</span>
              <strong>
                {communicationScore !== null
                  ? `${communicationScore}/100`
                  : "--/100"}
              </strong>
            </div>
            <div className="score-track">
              <div
                className="score-fill communication-fill"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, communicationScore ?? 0)
                  )}%`,
                }}
              />
            </div>

            <div className="score-row">
              <span>Grammar</span>
              <strong>
                {grammarAnalysis?.grammar_score != null
                  ? `${grammarAnalysis.grammar_score}/100`
                  : "--/100"}
              </strong>
            </div>
            <div className="score-track">
              <div
                className="score-fill grammar-fill"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, grammarAnalysis?.grammar_score ?? 0)
                  )}%`,
                }}
              />
            </div>

            <div className="score-row">
              <span>Fluency</span>
              <strong>
                {fluencyScore !== null ? `${fluencyScore}/100` : "--/100"}
              </strong>
            </div>
            <div className="score-track">
              <div
                className="score-fill fluency-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, fluencyScore ?? 0))}%`,
                }}
              />
            </div>

            <p className="score-note">
              {communicationScore !== null
                ? "Scores from your latest voice practice."
                : "Your scores will appear after your first voice practice."}
            </p>
          </section>

          <section className="insight-card tip-card">
            <div className="tip-icon">💡</div>
            <div>
              <h3>Quick English Tip</h3>
              <p>
                Instead of saying only “It was good,” add a reason:
                “It was good because I learned something new.”
              </p>
            </div>
          </section>

          <div className="detailed-analysis-heading">
            <h3>Detailed Analysis</h3>
          </div>

          {!grammarAnalysis && !speechAnalysis && (
            <div className="empty-analysis">
              <span>◷</span>
              <p>Your grammar corrections and speech insights will appear here after you speak.</p>
            </div>
          )}

          {communicationScore !== null && (
            <section className="insight-card detail-card">
              <h3>Communication Score</h3>
              <div className="large-score">
                {communicationScore}<span>/100</span>
              </div>
            </section>
          )}

          {grammarAnalysis && (
            <section className="insight-card detail-card">
              <h3>Grammar Analysis</h3>

              <p>
                <strong>Grammar score:</strong>{" "}
                {grammarAnalysis.grammar_score}/100
              </p>

              <p className="detail-label">Original</p>
              <p className="detail-text">{grammarAnalysis.original}</p>

              <p className="detail-label">Corrected</p>
              <p className="corrected-text">{grammarAnalysis.corrected}</p>

              <p>
                <strong>Grammar issues:</strong>{" "}
                {grammarAnalysis.has_errors ? "Found" : "None"}
              </p>

              {grammarAnalysis.changes?.length > 0 && (
                <>
                  <p className="detail-label">Detected changes</p>
                  <ul>
                    {grammarAnalysis.changes.map((change, index) => (
                      <li key={index}>
                        “{change.original}” → “{change.corrected}”
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {speechAnalysis && (
            <section className="insight-card detail-card">
              <h3>Speech Analysis</h3>

              <div className="metric-row">
                <span>Words spoken</span>
                <strong>{speechAnalysis.word_count}</strong>
              </div>
              <div className="metric-row">
                <span>Duration</span>
                <strong>{speechAnalysis.duration_seconds}s</strong>
              </div>
              <div className="metric-row">
                <span>Speaking rate</span>
                <strong>{speechAnalysis.speaking_rate_wpm} WPM</strong>
              </div>
              <div className="metric-row">
                <span>Filler words</span>
                <strong>{speechAnalysis.filler_word_count}</strong>
              </div>
              <div className="metric-row">
                <span>Pauses</span>
                <strong>{speechAnalysis.pause_count}</strong>
              </div>
              <div className="metric-row">
                <span>Total pause time</span>
                <strong>{speechAnalysis.total_pause_seconds}s</strong>
              </div>
              <div className="metric-row">
                <span>Longest pause</span>
                <strong>{speechAnalysis.longest_pause_seconds}s</strong>
              </div>

              <p className="detail-label">Filler word details</p>
              <p className="detail-text">
                {speechAnalysis.filler_words?.length > 0
                  ? speechAnalysis.filler_words.join(", ")
                  : "No filler words detected"}
              </p>
            </section>
          )}

          {transcription && (
            <section className="insight-card detail-card">
              <h3>Latest Transcription</h3>
              <p className="detail-text">{transcription}</p>
            </section>
          )}
        </aside>
      </div>

      <button
        className={`mobile-backdrop ${
          isSidebarOpen || isAnalysisOpen ? "visible" : ""
        }`}
        onClick={closeMobilePanels}
        aria-label="Close open panel"
        tabIndex={isSidebarOpen || isAnalysisOpen ? 0 : -1}
      />
    </div>
  );
}

export default App;