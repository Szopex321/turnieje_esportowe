import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import Button from "../components/Button";
import styles from "../styles/pages/TournamentBracketPage.module.css";
// Default avatar import
import defaultAvatar from "../assets/deafultAvatar.jpg";

// Icons
import {
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Trophy,
} from "lucide-react";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

// =========================================================================
// 1. MODAL: READ ONLY TEAM DETAILS
// =========================================================================
const ReadOnlyTeamModal = ({ teamId, onClose }) => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/teams/${teamId}`);
        if (!response.ok) throw new Error("Failed to fetch team data."); // ENG

        const data = await response.json();
        setTeam(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) fetchTeam();
  }, [teamId]);

  if (!team && loading)
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <h3>Error</h3> {/* ENG */}
          <p>{error}</p>
          <Button name="Close" onClick={onClose} /> {/* ENG */}
        </div>
      </div>
    );

  // --- TEAM DATA ---
  const tName = team.teamName || team.name || "Unnamed"; // ENG
  const tDesc = team.description || "No description."; // ENG
  const tLogo = team.logoUrl || team.logo || null;

  const rawPlayers = team.teamMembers || team.players || [];
  const captainId = parseInt(team.captainId || 0);

  // Sort: Captain first
  const sortedPlayers = [...rawPlayers].sort((a, b) => {
    const idA = a.userId || a.id;
    const idB = b.userId || b.id;
    if (idA === captainId) return -1;
    if (idB === captainId) return 1;
    return 0;
  });

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px", cursor: "default" }}
      >
        <div
          className={styles.teamHeaderCenter}
          style={{ textAlign: "center", marginBottom: "20px" }}
        >
          <img
            src={
              tLogo ||
              `https://placehold.co/150/2c3e50/ecf0f1?text=${tName
                .substring(0, 2)
                .toUpperCase()}`
            }
            alt={tName}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "10px",
            }}
            onError={(e) => {
              e.target.onerror = null;
              // Fallback for team logo
              e.target.src = `https://placehold.co/150/2c3e50/ecf0f1?text=${tName
                .substring(0, 2)
                .toUpperCase()}`;
            }}
          />
          <h2 style={{ margin: "5px 0" }}>{tName}</h2>
          <p style={{ color: "#888", fontSize: "0.9rem" }}>{tDesc}</p>
        </div>

        <h3
          style={{
            borderBottom: "1px solid #333",
            paddingBottom: "10px",
            marginBottom: "15px",
          }}
        >
          Team Roster ({sortedPlayers.length}) {/* ENG */}
        </h3>

        <div
          className={styles.playersList}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player) => {
              // Map user data (handling nested 'user' object if present)
              const userData = player.user || player;

              const pUsername = userData.username || "Unknown"; // ENG
              const pAvatar = userData.avatarUrl || defaultAvatar;
              const pId = player.userId || userData.id;

              return (
                <div
                  key={pId || Math.random()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#2a2a2a",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <img
                    src={pAvatar}
                    alt={pUsername}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      marginRight: "15px",
                      objectFit: "cover",
                    }}
                    // Fallback to local defaultAvatar on error
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultAvatar;
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: "bold", display: "block" }}>
                      {pUsername}
                    </span>
                    {pId === captainId && (
                      <span style={{ fontSize: "0.8rem", color: "#f1c40f" }}>
                        👑 Captain {/* ENG */}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "#666" }}>
              No players found.
            </p> // ENG
          )}
        </div>

        <div className={styles.modalActions} style={{ marginTop: "20px" }}>
          <Button
            name="Close" // ENG
            onClick={onClose}
            className={styles.cancelBtn}
            type="button"
          />
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. MODAL: REPORT RESULT
// =========================================================================
const ReportResultModal = ({
  match,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(match.matchId, parseInt(scoreA), parseInt(scoreB));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Report Match Result</h3>
        <div className={styles.matchVersus}>
          <span className={styles.teamName}>
            {match.participant1Name || "Team A"}
          </span>
          <span className={styles.vsBadge}>VS</span>
          <span className={styles.teamName}>
            {match.participant2Name || "Team B"}
          </span>
        </div>
        {error && <div className={styles.modalError}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.reportForm}>
          <div className={styles.scoreInputs}>
            <div className={styles.scoreField}>
              <label>{match.participant1Name || "Score 1"}</label>
              <input
                type="number"
                min="0"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                required
              />
            </div>
            <div className={styles.scoreField}>
              <label>{match.participant2Name || "Score 2"}</label>
              <input
                type="number"
                min="0"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.modalActions}>
            <Button
              name="Cancel"
              onClick={onClose}
              className={styles.cancelBtn}
              type="button"
            />
            <Button
              name={isSubmitting ? "Sending..." : "Submit"}
              className={styles.submitBtn}
              type="submit"
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 3. MODAL: REPORT DISPUTE
// =========================================================================
const DisputeModal = ({ resultId, onClose, onSubmit, isSubmitting, error }) => {
  const [reason, setReason] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(resultId, reason, proofUrl);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} ${styles.disputeModal}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.textDanger}>⚠️ Report Issue</h3>
        </div>
        <p className={styles.modalSubtitle}>
          If the result reported by the opponent is incorrect, report it here.
        </p>
        {error && <div className={styles.modalError}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.reportForm}>
          <div className={styles.formGroup}>
            <label>Reason</label>
            <textarea
              className={styles.textarea}
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue..."
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Proof (Screenshot link)</label>
            <input
              type="text"
              placeholder="https://..."
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <Button
              name="Cancel"
              onClick={onClose}
              className={styles.cancelBtn}
              type="button"
            />
            <Button
              name={isSubmitting ? "Sending..." : "Submit Dispute"}
              className={`${styles.submitBtn} ${styles.btnDanger}`}
              type="submit"
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// 4. MATCH CARD
// =========================================================================
const MatchCard = ({
  match,
  currentUserId,
  onReportClick,
  onAcceptClick,
  onDisputeClick,
  onTeamClick,
}) => {
  const p1Winner = match.winnerId && match.winnerId === match.participant1Id;
  const p2Winner = match.winnerId && match.winnerId === match.participant2Id;

  const p1Id = match.participant1Id || match.Participant1Id;
  const p1Name = match.participant1Name || match.Participant1Name || "TBA";

  const p2Id = match.participant2Id || match.Participant2Id;
  const p2Name = match.participant2Name || match.Participant2Name || "TBA";

  const pendingResult = match.pendingResult || match.PendingResult || null;
  const statusRaw = match.matchStatus || match.MatchStatus || "";
  let status = statusRaw.toLowerCase();
  if (pendingResult) status = "pending";

  const isScheduled = status === "scheduled";
  const isPending = status === "pending";
  const isDisputed = status === "disputed";
  const isFinished =
    status === "finished" || status === "completed" || !!match.winnerId;

  const captain1Id = match.participant1CaptainId || match.Participant1CaptainId;
  const captain2Id = match.participant2CaptainId || match.Participant2CaptainId;
  const isParticipant =
    currentUserId &&
    (currentUserId == captain1Id || currentUserId == captain2Id);

  let reporterId = null,
    resultId = null,
    pendingScoreA = "?",
    pendingScoreB = "?";

  if (pendingResult) {
    reporterId = pendingResult.reportedBy || pendingResult.ReportedBy;
    resultId = pendingResult.resultId || pendingResult.ResultId;
    pendingScoreA =
      pendingResult.scoreA ??
      pendingResult.ScoreA ??
      pendingResult.participant1Score ??
      "?";
    pendingScoreB =
      pendingResult.scoreB ??
      pendingResult.ScoreB ??
      pendingResult.participant2Score ??
      "?";
  }

  const iAmReporter = pendingResult && reporterId == currentUserId;

  let displayScore1 = "-",
    displayScore2 = "-";
  if (isPending && pendingResult) {
    displayScore1 = pendingScoreA;
    displayScore2 = pendingScoreB;
  } else {
    displayScore1 =
      match.participant1Score ?? match.score1 ?? match.Score1 ?? "-";
    displayScore2 =
      match.participant2Score ?? match.score2 ?? match.Score2 ?? "-";
  }

  // Click Handler
  const handleRowClick = (e, id, name) => {
    e.stopPropagation();
    if (name === "TBA" || name === "BYE" || !id) return;
    if (onTeamClick) onTeamClick(id);
  };

  // Row Styles
  const rowStyle = (name) => ({
    cursor: name !== "TBA" && name !== "BYE" ? "pointer" : "default",
    transition: "background-color 0.2s",
  });

  return (
    <div
      className={`${styles.matchCard} ${
        isDisputed ? styles.cardDisputed : ""
      } ${isFinished ? styles.cardFinished : ""}`}
    >
      <div className={styles.matchHeader}>
        <span className={styles.matchNumber}>Match {match.matchNumber}</span>
        <div className={styles.statusIcons}>
          {isFinished && (
            <span className={styles.badgeFinished}>
              <CheckCircle size={14} />
            </span>
          )}
          {isDisputed && (
            <span className={styles.badgeDisputed}>
              <AlertTriangle size={14} /> DISPUTE
            </span>
          )}
          {isPending && (
            <span className={styles.badgePending}>
              <Clock size={14} />
            </span>
          )}
        </div>
      </div>

      <div className={styles.matchBody}>
        {/* TEAM 1 */}
        <div
          className={`${styles.participantRow} ${
            p1Winner ? styles.winnerRow : ""
          }`}
          onClick={(e) => handleRowClick(e, p1Id, p1Name)}
          style={rowStyle(p1Name)}
          title={p1Name !== "TBA" ? "View details" : ""}
        >
          <span
            className={styles.pName}
            style={{
              textDecoration: p1Name !== "TBA" ? "underline" : "none",
              textDecorationColor: "transparent",
            }}
          >
            {p1Name}
          </span>
          <span className={styles.pScore}>{displayScore1}</span>
        </div>

        {/* TEAM 2 */}
        <div
          className={`${styles.participantRow} ${
            p2Winner ? styles.winnerRow : ""
          }`}
          onClick={(e) => handleRowClick(e, p2Id, p2Name)}
          style={rowStyle(p2Name)}
          title={p2Name !== "TBA" ? "View details" : ""}
        >
          <span
            className={styles.pName}
            style={{
              textDecoration: p2Name !== "TBA" ? "underline" : "none",
              textDecorationColor: "transparent",
            }}
          >
            {p2Name}
          </span>
          <span className={styles.pScore}>{displayScore2}</span>
        </div>
      </div>

      {isParticipant && !isFinished && (
        <div className={styles.matchActionsFooter}>
          {isScheduled && !isPending && (
            <button
              className={styles.actionBtnPrimary}
              onClick={() => onReportClick(match)}
            >
              <Edit3 size={14} /> Report Result
            </button>
          )}
          {isPending &&
            pendingResult &&
            (iAmReporter ? (
              <div className={styles.statusMsg}>
                ⏳ Waiting... {pendingScoreA}:{pendingScoreB}
              </div>
            ) : (
              <div className={styles.decisionBox}>
                <strong>
                  {pendingScoreA}:{pendingScoreB}
                </strong>
                <div className={styles.btnGroup}>
                  <button
                    className={styles.btnAccept}
                    onClick={() => onAcceptClick(resultId)}
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    className={styles.btnDispute}
                    onClick={() => onDisputeClick(resultId)}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          {isDisputed && (
            <div className={styles.disputeMsg}>⛔ Admin Review</div>
          )}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 5. MAIN PAGE
// =========================================================================
const TournamentBracketPage = () => {
  const { tournamentId } = useParams();
  const [bracketData, setBracketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [disputeData, setDisputeData] = useState(null);
  const [viewTeamId, setViewTeamId] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("currentUserId");
    if (userId) setCurrentUserId(parseInt(userId, 10));
  }, []);

  const fetchBracket = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brackets/${tournamentId}`);
      if (response.status === 404) {
        setError("Bracket not generated.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("Fetch error");
      const matches = await response.json();
      setBracketData(matches);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("An error occurred.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) fetchBracket();
  }, [tournamentId]);

  const rounds = useMemo(() => {
    if (!Array.isArray(bracketData)) return {};
    const grouped = bracketData.reduce((acc, match) => {
      const round = match.roundNumber;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    }, {});
    Object.keys(grouped).forEach((r) =>
      grouped[r].sort((a, b) => a.matchNumber - b.matchNumber)
    );
    return grouped;
  }, [bracketData]);

  const champion = useMemo(() => {
    if (!bracketData || bracketData.length === 0) return null;
    const maxRound = Math.max(...bracketData.map((m) => m.roundNumber));
    const finalMatch = bracketData.find((m) => m.roundNumber === maxRound);
    if (finalMatch) {
      const status = (
        finalMatch.matchStatus ||
        finalMatch.MatchStatus ||
        ""
      ).toLowerCase();
      if (
        (status === "finished" || status === "completed") &&
        finalMatch.winnerId
      ) {
        if (finalMatch.winnerId === finalMatch.participant1Id)
          return finalMatch.participant1Name;
        if (finalMatch.winnerId === finalMatch.participant2Id)
          return finalMatch.participant2Name;
      }
    }
    return null;
  }, [bracketData]);

  const getRoundName = (roundNum, allRoundsCount) => {
    const current = parseInt(roundNum);
    const total = parseInt(allRoundsCount);
    if (current === total) return "🏆 GRAND FINAL";
    if (current === total - 1) return "🔥 SEMI-FINAL";
    if (current === total - 2) return "⚔️ QUARTER-FINAL";
    return `ROUND ${current}`;
  };

  const totalRoundsCount =
    Object.keys(rounds).length > 0
      ? Math.max(...Object.keys(rounds).map(Number))
      : 0;

  const handleReportSubmit = async (matchId, scoreA, scoreB) => {
    setIsSubmitting(true);
    setReportError(null);
    const token = localStorage.getItem("jwt_token");
    try {
      const response = await fetch(`${API_BASE_URL}/brackets/report-result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ matchId, scoreA, scoreB, screenshotUrl: "" }),
      });
      if (!response.ok) {
        if (response.status === 403)
          throw new Error(
            "⛔ Permission denied! Only the CAPTAIN can report the result."
          );
        const txt = await response.text();
        throw new Error(txt || "Reporting error.");
      }
      alert("Result reported! Waiting for approval.");
      setSelectedMatch(null);
      fetchBracket();
    } catch (err) {
      setReportError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptResult = async (resultId) => {
    if (!window.confirm("Confirm result? The match will be finished.")) return;
    const token = localStorage.getItem("jwt_token");
    try {
      const response = await fetch(
        `${API_BASE_URL}/brackets/accept-result/${resultId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        alert("Confirmed!");
        fetchBracket();
      } else {
        const txt = await response.text();
        if (response.status === 403)
          alert("⛔ Only the opponent CAPTAIN can confirm the result.");
        else alert("Error: " + txt);
      }
    } catch (e) {
      console.error(e);
      alert("Connection error.");
    }
  };

  const openDisputeModal = (resultId) => {
    setReportError(null);
    setDisputeData({ resultId });
  };

  const submitDispute = async (resultId, reason, proofUrl) => {
    setIsSubmitting(true);
    setReportError(null);
    const token = localStorage.getItem("jwt_token");
    try {
      const response = await fetch(
        `${API_BASE_URL}/brackets/dispute-result/${resultId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason, proofUrl }),
        }
      );
      if (response.ok) {
        alert("Dispute reported.");
        setDisputeData(null);
        fetchBracket();
      } else {
        const txt = await response.text();
        throw new Error(txt || "Error.");
      }
    } catch (e) {
      setReportError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TitleBar />
      <div className={styles.mainContainer}>
        <Nav />
        <div className={styles.content}>
          <div className={styles.header}>
            <h1>Tournament Bracket</h1>
          </div>
          {loading && <div className={styles.loading}>Loading...</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}
          {!loading && !error && Object.keys(rounds).length > 0 && (
            <div className={styles.bracketContainer}>
              {Object.keys(rounds).map((roundNum) => (
                <div key={roundNum} className={styles.roundColumn}>
                  <div className={styles.roundTitle}>
                    {getRoundName(roundNum, totalRoundsCount)}
                  </div>
                  <div className={styles.matchesList}>
                    {rounds[roundNum].map((match) => (
                      <MatchCard
                        key={match.matchId}
                        match={match}
                        currentUserId={currentUserId}
                        onReportClick={setSelectedMatch}
                        onAcceptClick={handleAcceptResult}
                        onDisputeClick={openDisputeModal}
                        onTeamClick={setViewTeamId}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && !error && Object.keys(rounds).length === 0 && (
            <div className={styles.empty}>No matches found.</div>
          )}
          {champion && (
            <div className={styles.footerWinner}>
              <div className={styles.championBanner}>
                <div className={styles.trophyIcon}>
                  <Trophy size={64} />
                </div>
                <div className={styles.championText}>
                  <span className={styles.winnerText}>TOURNAMENT WINNER</span>
                  <span className={styles.championName}>{champion}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {selectedMatch && (
        <ReportResultModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSubmit={handleReportSubmit}
          isSubmitting={isSubmitting}
          error={reportError}
        />
      )}
      {disputeData && (
        <DisputeModal
          resultId={disputeData.resultId}
          onClose={() => setDisputeData(null)}
          onSubmit={submitDispute}
          isSubmitting={isSubmitting}
          error={reportError}
        />
      )}
      {viewTeamId && (
        <ReadOnlyTeamModal
          teamId={viewTeamId}
          onClose={() => setViewTeamId(null)}
        />
      )}
    </>
  );
};

export default TournamentBracketPage;
