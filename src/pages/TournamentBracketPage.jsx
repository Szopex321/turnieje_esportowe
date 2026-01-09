import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import Button from "../components/Button";
import styles from "../styles/pages/TournamentBracketPage.module.css";
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
// 1. MODAL: REPORT RESULT
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
// 2. MODAL: REPORT DISPUTE
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
// 3. MATCH CARD
// =========================================================================
const MatchCard = ({
  match,
  currentUserId,
  onReportClick,
  onAcceptClick,
  onDisputeClick,
}) => {
  const p1Winner = match.winnerId && match.winnerId === match.participant1Id;
  const p2Winner = match.winnerId && match.winnerId === match.participant2Id;

  // 1. RESULT DATA
  const pendingResult = match.pendingResult || match.PendingResult || null;

  // 2. SET STATUS (Force 'pending' if result data exists)
  const statusRaw = match.matchStatus || match.MatchStatus || "";
  let status = statusRaw.toLowerCase();

  if (pendingResult) {
    status = "pending";
  }

  const isScheduled = status === "scheduled";
  const isPending = status === "pending";
  const isDisputed = status === "disputed";
  const isFinished =
    status === "finished" || status === "completed" || !!match.winnerId;

  // --- 3. CHECK IF CAPTAIN ---
  const captain1Id = match.participant1CaptainId || match.Participant1CaptainId;
  const captain2Id = match.participant2CaptainId || match.Participant2CaptainId;

  const isParticipant =
    currentUserId &&
    (currentUserId == captain1Id || currentUserId == captain2Id);
  // -------------------------------------

  // 4. EXTRACT RESULT DATA
  let reporterId = null;
  let resultId = null;
  let scoreA = "?";
  let scoreB = "?";

  if (pendingResult) {
    reporterId = pendingResult.reportedBy || pendingResult.ReportedBy;
    resultId = pendingResult.resultId || pendingResult.ResultId;
    scoreA =
      pendingResult.scoreA ??
      pendingResult.ScoreA ??
      pendingResult.participant1Score ??
      "?";
    scoreB =
      pendingResult.scoreB ??
      pendingResult.ScoreB ??
      pendingResult.participant2Score ??
      "?";
  }

  const iAmReporter = pendingResult && reporterId == currentUserId;

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
            <span className={styles.badgeFinished} title="Finished">
              <CheckCircle size={14} />
            </span>
          )}
          {isDisputed && (
            <span className={styles.badgeDisputed} title="Dispute">
              <AlertTriangle size={14} /> DISPUTE
            </span>
          )}
          {isPending && (
            <span className={styles.badgePending} title="Pending">
              <Clock size={14} />
            </span>
          )}
        </div>
      </div>

      <div className={styles.matchBody}>
        <div
          className={`${styles.participantRow} ${
            p1Winner ? styles.winnerRow : ""
          }`}
        >
          <span className={styles.pName}>
            {match.participant1Name || "TBA"}
          </span>
          <span className={styles.pScore}>{match.score1 ?? "-"}</span>
        </div>
        <div
          className={`${styles.participantRow} ${
            p2Winner ? styles.winnerRow : ""
          }`}
        >
          <span className={styles.pName}>
            {match.participant2Name || "TBA"}
          </span>
          <span className={styles.pScore}>{match.score2 ?? "-"}</span>
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
                ⏳ Waiting for approval...
                <div className={styles.miniScore}>
                  Your proposal: {scoreA}:{scoreB}
                </div>
              </div>
            ) : (
              <div className={styles.decisionBox}>
                <div className={styles.proposalText}>
                  Result:{" "}
                  <strong>
                    {scoreA}:{scoreB}
                  </strong>
                </div>
                <div className={styles.btnGroup}>
                  <button
                    className={styles.btnAccept}
                    onClick={() => onAcceptClick(resultId)}
                    title="Confirm"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    className={styles.btnDispute}
                    onClick={() => onDisputeClick(resultId)}
                    title="Report Issue"
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
// 4. MAIN PAGE
// =========================================================================
const TournamentBracketPage = () => {
  const { tournamentId } = useParams();
  const [bracketData, setBracketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMatch, setSelectedMatch] = useState(null);
  const [disputeData, setDisputeData] = useState(null);
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

  // --- WINNER LOGIC ---
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

  // --- ROUND NAMES LOGIC ---
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

  // --- API HANDLERS ---
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

          {/* --- WINNER BANNER --- */}
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
          {/* ------------------- */}
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
    </>
  );
};

export default TournamentBracketPage;
