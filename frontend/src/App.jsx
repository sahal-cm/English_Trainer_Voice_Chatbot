import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/test")
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch((error) => {
        console.error("Backend connection error:", error);
        setMessage("Could not connect to backend.");
      });
  }, []);

  return (
    <div>
      <h1>AI English Voice Trainer</h1>
      <p>Backend says: {message}</p>
    </div>
  );
}

export default App;