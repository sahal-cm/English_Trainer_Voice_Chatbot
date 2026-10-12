
import "./Progress.css";

function Progress({
  speechAnalysis,
  fluencyScore,
  grammarAnalysis,
  communicationScore,
  practiceHistory = [],
}) {
  const getScore = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    const score = Number(value);

    return Number.isFinite(score)
      ? `${Math.round(score)}%`
      : "—";
  };

  const grammarScore = grammarAnalysis?.grammar_score;

  
  const getAverage = (key) => {
    const scores = practiceHistory
      .map((session) => Number(session[key]))
      .filter((score) => Number.isFinite(score) && score >= 0);

    if (scores.length === 0) return null;

    return scores.reduce((total, score) => total + score, 0) / scores.length;
  };

  const averageFluency = getAverage("fluencyScore");
  const averageGrammar = getAverage("grammarScore");
  const averageCommunication = getAverage("communicationScore");

  
  const averageScores = [
    { label: "Fluency", score: averageFluency },
    { label: "Grammar", score: averageGrammar },
    { label: "Communication", score: averageCommunication },
  ].filter((item) => item.score !== null);

  const strongestArea = averageScores.length
    ? [...averageScores].sort((a, b) => b.score - a.score)[0]
    : null;

  const weakestArea = averageScores.length
    ? [...averageScores].sort((a, b) => a.score - b.score)[0]
    : null;



  const recentSessions = [...practiceHistory]
    .reverse()
    .slice(-10);

  const getChartY = (score) => {
    const value = Number(score);
    return 180 - (Number.isFinite(value) ? value : 0) * 1.5;
  };


  return (
    <div className="progress-page">
      <div className="progress-header">
        <div>
          <h1>My Progress</h1>
          <p>
            Track your English communication journey.
          </p>
        </div>
      </div>
      

      <div className="progress-welcome">
        <h2>Your Practice Summary</h2>
        <p>Total voice sessions: <strong>{practiceHistory.length}</strong></p>
        <p>Average Fluency: <strong>{getScore(averageFluency)}</strong></p>
        <p>Average Grammar: <strong>{getScore(averageGrammar)}</strong></p>
        <p>Average Communication: <strong>{getScore(averageCommunication)}</strong></p>
      </div>


      <div className="progress-cards">
        <div className="progress-card">
          <p>Fluency Score</p>
          <h2>{getScore(fluencyScore)}</h2>
        </div>

        <div className="progress-card">
          <p>Grammar Score</p>
          <h2>{getScore(grammarScore)}</h2>
        </div>

        <div className="progress-card">
          <p>Communication Score</p>
          <h2>{getScore(communicationScore)}</h2>
        </div>
      </div>


      <div className="progress-welcome">
        <h2>Speech Analysis</h2>

        {speechAnalysis ? (
          <pre>
            {typeof speechAnalysis === "string"
              ? speechAnalysis
              : JSON.stringify(speechAnalysis, null, 2)}
          </pre>
        ) : (
          <p>
            Complete a voice practice session to see
            your speech analysis here.
          </p>
        )}
      </div>

      
      <div className="progress-welcome">
        <h2>Your Learning Insights</h2>

        {averageScores.length > 0 ? (
          <>
            <p>
              <strong>Your strongest area:</strong>{" "}
              {strongestArea.label} ({Math.round(strongestArea.score)}%)
            </p>

            {averageScores.length > 1 && (
              <p>
                <strong>Area to focus on:</strong>{" "}
                {weakestArea.label} ({Math.round(weakestArea.score)}%)
              </p>
            )}

            <p>
              {averageScores.length === 1
                ? "Complete more voice-practice sessions to discover where you can improve."
                : `Keep practising to improve your ${weakestArea.label.toLowerCase()} skills.`}
            </p>
          </>
        ) : (
          <p>Complete a voice-practice session to receive personalized learning insights.</p>
        )}
      </div>

      
      <div className="progress-welcome">
        <h2>Score Trends</h2>
        <p>Your scores across your recent voice-practice sessions.</p>

        {recentSessions.length >= 2 ? (
          <div className="score-chart">
            <svg viewBox="0 0 600 220" role="img" aria-label="Fluency, grammar, and communication score trends">
              {[0, 25, 50, 75, 100].map((score) => (
                <g key={score}>
                  <line
                    x1="45"
                    y1={180 - score * 1.5}
                    x2="580"
                    y2={180 - score * 1.5}
                    stroke="currentColor"
                    opacity="0.12"
                  />
                  <text
                    x="35"
                    y={185 - score * 1.5}
                    fontSize="11"
                    textAnchor="end"
                    fill="currentColor"
                  >
                    {score}
                  </text>
                </g>
              ))}

              {[
                { key: "fluencyScore", color: "#3b82f6", label: "Fluency" },
                { key: "grammarScore", color: "#10b981", label: "Grammar" },
                { key: "communicationScore", color: "#f59e0b", label: "Communication" },
              ].map((metric) => {
                const points = recentSessions
                  .map((session, index) => ({
                    x: 45 + (index * 535) / Math.max(recentSessions.length - 1, 1),
                    y: getChartY(session[metric.key]),
                    score: Number(session[metric.key]),
                  }))
                  .filter((point) =>
                    Number.isFinite(point.score) &&
                    point.score >= 0 &&
                    point.score <= 100
                  );

                return (
                  <g key={metric.key}>
                    {points.length >= 2 && (
                      <polyline
                        points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                        fill="none"
                        stroke={metric.color}
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}

                    {points.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill={metric.color}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>

            <div className="score-chart-legend">
              <span><i className="legend-fluency" /> Fluency</span>
              <span><i className="legend-grammar" /> Grammar</span>
              <span><i className="legend-communication" /> Communication</span>
            </div>
          </div>
        ) : (
          <p>Complete at least two voice-practice sessions with valid scores to see your score trends.</p>
        )}
      </div>

      
      <div className="progress-welcome">
        <h2>Practice History</h2>

        {practiceHistory.length > 0 ? (
          <div className="practice-history-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fluency</th>
                  <th>Grammar</th>
                  <th>Communication</th>
                </tr>
              </thead>

              <tbody>
                {practiceHistory.map((session) => (
                  <tr key={session.id}>
                    <td>
                      {new Date(session.date).toLocaleDateString()}
                    </td>
                    <td>{getScore(session.fluencyScore)}</td>
                    <td>{getScore(session.grammarScore)}</td>
                    <td>{getScore(session.communicationScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            No practice sessions yet. Complete a voice session
            to start tracking your progress.
          </p>
        )}
      </div>

    </div>
  );
}

export default Progress;
