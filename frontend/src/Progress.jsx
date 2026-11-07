
import { useState } from "react";
import "./Progress.css";

function Progress({
  speechAnalysis,
  fluencyScore,
  grammarAnalysis,
  communicationScore,
  practiceHistory = [],
}) {
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem("speakwise_daily_goal");
    const parsed = Number(saved);

    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 20
      ? parsed
      : 5;
  });

  const [showSpeechDetails, setShowSpeechDetails] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const getScore = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const score = Number(value);
    return Number.isFinite(score) ? `${Math.round(score)}%` : "—";
  };

  const getAverage = (key) => {
    const scores = practiceHistory
      .filter(
        (session) =>
          session[key] !== null &&
          session[key] !== undefined &&
          session[key] !== ""
      )
      .map((session) => Number(session[key]))
      .filter((score) => Number.isFinite(score) && score >= 0);

    if (!scores.length) return null;

    return scores.reduce((total, score) => total + score, 0) / scores.length;
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "Date unavailable"
      : parsed.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  const formatTime = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? ""
      : parsed.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const getMetric = (value, suffix = "") => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number = Number(value);

    return Number.isFinite(number) ? `${number}${suffix}` : "—";
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

  const today = new Date().toDateString();

  const todaySessions = practiceHistory.filter(
    (session) => new Date(session.date).toDateString() === today
  ).length;

  const goalProgress = Math.min((todaySessions / dailyGoal) * 100, 100);

  // App.jsx stores the newest session first.
  // Use the latest ten sessions in chronological order for the chart.
  const recentSessions = [...practiceHistory].slice(0, 10).reverse();

  const selectedSession = practiceHistory.find(
    (session) => session.id === selectedSessionId
  );

  const getChartY = (score) => {
    const value = Number(score);
    return 180 - (Number.isFinite(value) ? value : 0) * 1.5;
  };

  const chartMetrics = [
    { key: "fluencyScore", color: "#3b82f6", label: "Fluency" },
    { key: "grammarScore", color: "#10b981", label: "Grammar" },
    {
      key: "communicationScore",
      color: "#f59e0b",
      label: "Communication",
    },
  ];

  const getSuggestions = (session) => {
    const suggestions = [];
    const speech = session.speechAnalysis || {};
    const grammar = session.grammarAnalysis || {};

    const fluency = Number(session.fluencyScore);
    const grammarScore = Number(session.grammarScore);
    const communication = Number(session.communicationScore);

    if (Number.isFinite(grammarScore) && grammarScore < 80) {
      suggestions.push(
        "Focus on sentence structure, verb tenses and grammatical accuracy."
      );
    }

    if (Number.isFinite(fluency) && fluency < 70) {
      suggestions.push(
        "Practise speaking in complete sentences and maintain a smooth speaking flow."
      );
    }

    if (Number.isFinite(communication) && communication < 70) {
      suggestions.push(
        "Work on expressing your ideas clearly and adding relevant details to your answers."
      );
    }

    if (Number(speech.filler_word_count) > 3) {
      suggestions.push(
        "Try reducing filler words such as um, uh and like. Take a short pause before responding."
      );
    }

    if (Number(speech.pause_count) > 5) {
      suggestions.push(
        "Practise connecting your sentences to reduce frequent interruptions while speaking."
      );
    }

    if (Number(speech.speaking_rate_wpm) > 180) {
      suggestions.push(
        "Try speaking slightly slower so your words remain clear and easy to understand."
      );
    }

    if (
      Array.isArray(grammar.changes) &&
      grammar.changes.length > 0
    ) {
      suggestions.push(
        "Review your corrected sentences and practise using the corrected sentence structures in your next conversation."
      );
    }

    if (suggestions.length === 0) {
      suggestions.push(
        "Keep practising regularly and focus on maintaining your current performance."
      );
    }

    return suggestions;
  };

  // Detailed report view
  if (selectedSession) {
    const session = selectedSession;
    const speech = session.speechAnalysis || {};
    const grammar = session.grammarAnalysis || {};
    const changes = Array.isArray(grammar.changes) ? grammar.changes : [];

    const originalText = grammar.original || session.transcription || "";
    const correctedText = grammar.corrected || "";

    return (
      <div className="progress-page">
        <header className="progress-header detail-report-header">
          <div>
            <h1>Practice Session Report</h1>
            <p>
              {formatDate(session.date)}
              {formatTime(session.date) && ` · ${formatTime(session.date)}`}
            </p>
          </div>

          <button
            type="button"
            className="back-to-history-button"
            onClick={() => setSelectedSessionId(null)}
          >
            ← Back to History
          </button>
        </header>

        {/* Session scores */}
        <section className="progress-cards detail-score-cards">
          <div className="progress-card">
            <p>Communication</p>
            <h2>{getScore(session.communicationScore)}</h2>
            <span>Communication performance</span>
          </div>

          <div className="progress-card">
            <p>Fluency</p>
            <h2>{getScore(session.fluencyScore)}</h2>
            <span>Speaking fluency</span>
          </div>

          <div className="progress-card">
            <p>Grammar</p>
            <h2>{getScore(session.grammarScore)}</h2>
            <span>Grammar accuracy</span>
          </div>

          <div className="progress-card">
            <p>Speaking Turns</p>
            <h2>{getMetric(session.utteranceCount)}</h2>
            <span>Recorded speaking responses</span>
          </div>
        </section>

        {/* Speech statistics */}
        <section className="progress-panel detail-report-panel">
          <div className="progress-panel-heading">
            <div>
              <h2>Speaking Statistics</h2>
              <p>Detailed breakdown of your speaking performance.</p>
            </div>
            <span className="progress-panel-icon">◷</span>
          </div>

          <div className="detail-stat-grid">
            <div className="detail-stat-card">
              <span>Total Words</span>
              <strong>{getMetric(speech.word_count)}</strong>
            </div>

            <div className="detail-stat-card">
              <span>Speaking Speed</span>
              <strong>{getMetric(speech.speaking_rate_wpm, " WPM")}</strong>
            </div>

            <div className="detail-stat-card">
              <span>Duration</span>
              <strong>{getMetric(speech.duration_seconds, " sec")}</strong>
            </div>

            <div className="detail-stat-card">
              <span>Filler Words</span>
              <strong>{getMetric(speech.filler_word_count)}</strong>
            </div>

            <div className="detail-stat-card">
              <span>Number of Pauses</span>
              <strong>{getMetric(speech.pause_count)}</strong>
            </div>

            <div className="detail-stat-card">
              <span>Total Pause Duration</span>
              <strong>{getMetric(speech.total_pause_seconds, " sec")}</strong>
            </div>

            <div className="detail-stat-card">
              <span>Longest Pause</span>
              <strong>{getMetric(speech.longest_pause_seconds, " sec")}</strong>
            </div>

            <div className="detail-stat-card">
              <span>Grammar Issues</span>
              <strong>{changes.length}</strong>
            </div>
          </div>

          <div className="detail-subsection">
            <h3>Detected Filler Words</h3>
            {Array.isArray(speech.filler_words) &&
            speech.filler_words.length > 0 ? (
              <div className="filler-word-list">
                {speech.filler_words.map((word, index) => (
                  <span key={index}>{word}</span>
                ))}
              </div>
            ) : (
              <p className="detail-muted">No filler words detected.</p>
            )}
          </div>
        </section>

        {/* Original and corrected transcription */}
        <section className="progress-panel detail-report-panel">
          <div className="progress-panel-heading">
            <div>
              <h2>Transcription & Grammar Review</h2>
              <p>Compare what you said with the corrected version.</p>
            </div>
          </div>

          <div className="transcription-grid">
            <div className="transcription-box original-transcription">
              <h3>Original Transcription</h3>
              <p>
                {originalText || "No original transcription available."}
              </p>
            </div>

            <div className="transcription-box corrected-transcription">
              <h3>Corrected Sentences</h3>
              <p>
                {correctedText || "No corrected sentences available."}
              </p>
            </div>
          </div>

          <div className="detail-subsection grammar-mistakes-section">
            <h3>Detected Grammar Mistakes</h3>

            {changes.length > 0 ? (
              <div className="grammar-changes-list">
                {changes.map((change, index) => (
                  <div className="grammar-change-item" key={index}>
                    <div className="grammar-change-number">
                      {index + 1}
                    </div>

                    <div className="grammar-change-content">
                      <div>
                        <span className="grammar-change-label">Original</span>
                        <p className="grammar-original">
                          {change.original || "—"}
                        </p>
                      </div>

                      <div>
                        <span className="grammar-change-label">Corrected</span>
                        <p className="grammar-corrected">
                          {change.corrected || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="detail-muted">
                No specific grammar changes were recorded for this session.
              </p>
            )}
          </div>
        </section>

        {/* Improvement suggestions */}
        <section className="progress-panel detail-report-panel">
          <div className="progress-panel-heading">
            <div>
              <h2>Improvement Suggestions</h2>
              <p>Areas to focus on in your next practice session.</p>
            </div>
            <span className="progress-panel-icon">✦</span>
          </div>

          <div className="suggestions-list">
            {getSuggestions(session).map((suggestion, index) => (
              <div className="suggestion-item" key={index}>
                <span>✓</span>
                <p>{suggestion}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="detail-report-footer">
          <button
            type="button"
            className="back-to-history-button"
            onClick={() => setSelectedSessionId(null)}
          >
            ← Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-page">
      <header className="progress-header">
        <div>
          <h1>My Progress</h1>
          <p>Track your English communication journey.</p>
        </div>
        <span className="progress-session-count">
          {practiceHistory.length} total sessions
        </span>
      </header>

      {/* Summary cards */}
      <section className="progress-cards">
        <div className="progress-card">
          <p>Total Sessions</p>
          <h2>{practiceHistory.length}</h2>
          <span>Voice practices completed</span>
        </div>

        <div className="progress-card">
          <p>Average Fluency</p>
          <h2>{getScore(averageFluency)}</h2>
          <span>Current session: {getScore(fluencyScore)}</span>
        </div>

        <div className="progress-card">
          <p>Average Grammar</p>
          <h2>{getScore(averageGrammar)}</h2>
          <span>
            Current session: {getScore(grammarAnalysis?.grammar_score)}
          </span>
        </div>

        <div className="progress-card">
          <p>Average Communication</p>
          <h2>{getScore(averageCommunication)}</h2>
          <span>Current session: {getScore(communicationScore)}</span>
        </div>
      </section>

      {/* Daily goal and learning insights */}
      <section className="progress-middle-grid">
        <div className="progress-panel daily-goal-card">
          <div className="progress-panel-heading">
            <div>
              <h2>Daily Practice Goal</h2>
              <p>Build a consistent speaking habit.</p>
            </div>
            <span className="progress-panel-icon">◎</span>
          </div>

          <div className="goal-summary">
            <strong>
              {todaySessions} / {dailyGoal}
            </strong>
            <span>sessions today</span>
          </div>

          <div
            className="goal-progress-track"
            role="progressbar"
            aria-label="Daily practice goal"
            aria-valuenow={Math.min(todaySessions, dailyGoal)}
            aria-valuemin={0}
            aria-valuemax={dailyGoal}
          >
            <div
              className="goal-progress-fill"
              style={{ width: `${goalProgress}%` }}
            />
          </div>

          <div className="goal-controls">
            <span>
              {todaySessions >= dailyGoal
                ? "Daily goal completed!"
                : `${dailyGoal - todaySessions} more to reach your goal`}
            </span>

            <select
              id="daily-goal"
              aria-label="Daily session target"
              value={dailyGoal}
              onChange={(event) => {
                const value = Number(event.target.value);
                setDailyGoal(value);
                localStorage.setItem("speakwise_daily_goal", String(value));
              }}
            >
              <option value={3}>3 sessions</option>
              <option value={5}>5 sessions</option>
              <option value={10}>10 sessions</option>
              <option value={15}>15 sessions</option>
              <option value={20}>20 sessions</option>
            </select>
          </div>
        </div>

        <div className="progress-panel learning-insights">
          <div className="progress-panel-heading">
            <div>
              <h2>Learning Insights</h2>
              <p>Know where to focus next.</p>
            </div>
            <span className="progress-panel-icon">✦</span>
          </div>

          {averageScores.length > 0 ? (
            <>
              <div className="insight-item">
                <span>Strongest area</span>
                <strong>
                  {strongestArea.label} · {Math.round(strongestArea.score)}%
                </strong>
              </div>

              {averageScores.length > 1 && (
                <div className="insight-item">
                  <span>Area to improve</span>
                  <strong>
                    {weakestArea.label} · {Math.round(weakestArea.score)}%
                  </strong>
                </div>
              )}

              <p className="insight-tip">
                {averageScores.length === 1
                  ? "Complete more sessions to identify your strengths."
                  : `Keep practising to improve your ${weakestArea.label.toLowerCase()} skills.`}
              </p>
            </>
          ) : (
            <p>
              Complete voice-practice sessions to see your strengths and
              personalized learning insights.
            </p>
          )}
        </div>
      </section>

      {/* Trends and practice history */}
      <section className="progress-bottom-grid">
        <div className="progress-panel score-trends-panel">
          <div className="progress-panel-heading">
            <div>
              <h2>Score Trends</h2>
              <p>Your last {recentSessions.length} practice sessions.</p>
            </div>
          </div>

          {recentSessions.length >= 2 ? (
            <div className="score-chart">
              <svg
                viewBox="0 0 600 220"
                role="img"
                aria-label="Fluency, grammar, and communication score trends"
              >
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

                {chartMetrics.map((metric) => {
                  const points = recentSessions
                    .map((session, index) => ({
                      x:
                        45 +
                        (index * 535) /
                          Math.max(recentSessions.length - 1, 1),
                      y: getChartY(session[metric.key]),
                      score: Number(session[metric.key]),
                    }))
                    .filter(
                      (point) =>
                        Number.isFinite(point.score) &&
                        point.score >= 0 &&
                        point.score <= 100
                    );

                  return (
                    <g key={metric.key}>
                      {points.length >= 2 && (
                        <polyline
                          points={points
                            .map((point) => `${point.x},${point.y}`)
                            .join(" ")}
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
                {chartMetrics.map((metric) => (
                  <span key={metric.key}>
                    <i style={{ background: metric.color }} />
                    {metric.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p>
              Complete at least two voice sessions with valid scores to see
              your trends.
            </p>
          )}
        </div>

        <div className="progress-panel practice-history-panel">
          <div className="progress-panel-heading">
            <div>
              <h2>Practice History</h2>
              <p>Click a session to view its detailed report.</p>
            </div>
          </div>

          {practiceHistory.length > 0 ? (
            <div className="practice-history-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Fluency</th>
                    <th>Grammar</th>
                    <th>Communication</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {[...practiceHistory].map((session, index) => (
                    <tr
                      key={session.id ?? `${session.date}-${index}`}
                      className="practice-history-row"
                      onClick={() => {
                        if (session.id) setSelectedSessionId(session.id);
                      }}
                      onKeyDown={(event) => {
                        if (
                          session.id &&
                          (event.key === "Enter" || event.key === " ")
                        ) {
                          event.preventDefault();
                          setSelectedSessionId(session.id);
                        }
                      }}
                      tabIndex={session.id ? 0 : -1}
                      role={session.id ? "button" : undefined}
                      aria-label={
                        session.id
                          ? `View practice report for ${formatDate(session.date)}`
                          : undefined
                      }
                    >
                      <td>
                        <div className="history-date">
                          {formatDate(session.date)}
                          <small>{formatTime(session.date)}</small>
                        </div>
                      </td>
                      <td>{getScore(session.fluencyScore)}</td>
                      <td>{getScore(session.grammarScore)}</td>
                      <td>{getScore(session.communicationScore)}</td>
                      <td>
                        <span className="view-report-label">
                          View report →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>
              No practice sessions yet. Complete a voice session to begin.
            </p>
          )}
        </div>
      </section>

      {/* Latest speech analysis */}
      <section className="progress-panel speech-details-panel">
        <button
          type="button"
          className="speech-details-toggle"
          aria-expanded={showSpeechDetails}
          onClick={() => setShowSpeechDetails((previous) => !previous)}
        >
          <span>
            <strong>Speech Analysis</strong>
            <small>View detailed analysis of your latest voice practice.</small>
          </span>
          <span>{showSpeechDetails ? "−" : "+"}</span>
        </button>

        {showSpeechDetails && (
          <div className="speech-details-content">
            {speechAnalysis ? (
              <pre>
                {typeof speechAnalysis === "string"
                  ? speechAnalysis
                  : JSON.stringify(speechAnalysis, null, 2)}
              </pre>
            ) : (
              <p>
                Complete a voice-practice session to see your speech analysis.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default Progress;
