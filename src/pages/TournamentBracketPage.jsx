import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import Button from "../components/Button";
import styles from "../styles/pages/TournamentBracketPage.module.css";
// Ikony
import {
  Edit3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

// =========================================================================
// 1. MODAL: WPISYWANIE WYNIKU (Report Result)
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
  const [screenshotUrl, setScreenshotUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(match.matchId, parseInt(scoreA), parseInt(scoreB), screenshotUrl);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Zgłoś wynik meczu</h3>
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
              <label>{match.participant1Name || "Wynik 1"}</label>
              <input
                type="number"
                min="0"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                required
              />
            </div>
            <div className={styles.scoreField}>
              <label>{match.participant2Name || "Wynik 2"}</label>
              <input
                type="number"
                min="0"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Link do screenshota (opcjonalne)</label>
            <input
              type="text"
              placeholder="https://..."
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <Button
              name="Anuluj"
              onClick={onClose}
              className={styles.cancelBtn}
              type="button"
            />
            <Button
              name={isSubmitting ? "Wysyłanie..." : "Wyślij"}
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
// 2. MODAL: ZGŁASZANIE SPORU (Dispute)
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
          <h3 className={styles.textDanger}>⚠️ Zgłoś Problem</h3>
        </div>
        <p className={styles.modalSubtitle}>
          Jeśli wynik podany przez przeciwnika jest błędny, zgłoś to tutaj.
        </p>
        {error && <div className={styles.modalError}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.reportForm}>
          <div className={styles.formGroup}>
            <label>Powód zgłoszenia</label>
            <textarea
              className={styles.textarea}
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Opisz problem..."
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Dowód (Link do screenshota)</label>
            <input
              type="text"
              placeholder="https://..."
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <Button
              name="Anuluj"
              onClick={onClose}
              className={styles.cancelBtn}
              type="button"
            />
            <Button
              name={isSubmitting ? "Wysyłanie..." : "Zgłoś Sprzeciw"}
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
// 3. KARTA MECZU (POPRAWIONA LOGIKA STATUSÓW)
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

  // 1. POBIERZ PENDING RESULT (Obsługa różnych wielkości liter z API)
  const pendingResult = match.pendingResult || match.PendingResult || null;

  // 2. USTAL STATUS (Kluczowa poprawka: Wymuś 'pending' jeśli są dane wyniku!)
  const statusRaw = match.matchStatus || match.MatchStatus || "";
  let status = statusRaw.toLowerCase();

  if (pendingResult) {
    status = "pending"; // <--- TO NAPRAWIA PROBLEM BRAKUJĄCYCH PRZYCISKÓW
  }

  const isScheduled = status === "scheduled";
  const isPending = status === "pending";
  const isDisputed = status === "disputed";
  const isFinished =
    status === "finished" || status === "completed" || !!match.winnerId;

  // 3. SPRAWDŹ UCZESTNICTWO (Dla testów true, backend i tak zablokuje niepowołanych)
  const isParticipant = !!currentUserId;

  // 4. WYCIĄGNIJ DANE Z WYNIKU
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

  // Czy to ja zgłosiłem wynik?
  const iAmReporter = pendingResult && reporterId == currentUserId;

  return (
    <div
      className={`${styles.matchCard} ${
        isDisputed ? styles.cardDisputed : ""
      } ${isFinished ? styles.cardFinished : ""}`}
    >
      <div className={styles.matchHeader}>
        <span className={styles.matchNumber}>Mecz {match.matchNumber}</span>
        <div className={styles.statusIcons}>
          {isFinished && (
            <span className={styles.badgeFinished} title="Zakończony">
              <CheckCircle size={14} />
            </span>
          )}
          {isDisputed && (
            <span className={styles.badgeDisputed} title="Spór">
              <AlertTriangle size={14} /> SPÓR
            </span>
          )}
          {isPending && (
            <span className={styles.badgePending} title="Oczekiwanie">
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
          {/* A: ZGŁASZANIE (Tylko gdy status scheduled I nie ma pendingResult) */}
          {isScheduled && !isPending && (
            <button
              className={styles.actionBtnPrimary}
              onClick={() => onReportClick(match)}
            >
              <Edit3 size={14} /> Zgłoś wynik
            </button>
          )}

          {/* B: AKCEPTACJA / OCZEKIWANIE (Gdy status pending LUB są dane wyniku) */}
          {isPending &&
            pendingResult &&
            (iAmReporter ? (
              // B1: Widok dla zgłaszającego
              <div className={styles.statusMsg}>
                ⏳ Czekanie na akceptację...
                <div className={styles.miniScore}>
                  Twoja propozycja: {scoreA}:{scoreB}
                </div>
              </div>
            ) : (
              // B2: Widok dla przeciwnika (PRZYCISKI!)
              <div className={styles.decisionBox}>
                <div className={styles.proposalText}>
                  Wynik:{" "}
                  <strong>
                    {scoreA}:{scoreB}
                  </strong>
                </div>
                <div className={styles.btnGroup}>
                  <button
                    className={styles.btnAccept}
                    onClick={() => onAcceptClick(resultId)}
                    title="Zatwierdź"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    className={styles.btnDispute}
                    onClick={() => onDisputeClick(resultId)}
                    title="Zgłoś problem"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}

          {/* C: SPÓR */}
          {isDisputed && (
            <div className={styles.disputeMsg}>⛔ Spór u admina</div>
          )}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 4. GŁÓWNA STRONA
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
        setError("Drabinka nie wygenerowana.");
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error("Błąd pobierania");

      const matches = await response.json();
      console.log("DANE Z API:", matches); // Debug w konsoli
      setBracketData(matches);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Wystąpił błąd.");
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

  // --- API HANDLERY ---
  const handleReportSubmit = async (matchId, scoreA, scoreB, screenshotUrl) => {
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
        body: JSON.stringify({ matchId, scoreA, scoreB, screenshotUrl }),
      });
      if (!response.ok) {
        if (response.status === 403)
          throw new Error(
            "⛔ Brak uprawnień! Tylko KAPITAN biorący udział w meczu może zgłosić wynik."
          );
        const txt = await response.text();
        throw new Error(txt || "Błąd zgłaszania.");
      }
      alert("Wynik zgłoszony! Czekaj na akceptację.");
      setSelectedMatch(null);
      fetchBracket();
    } catch (err) {
      setReportError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptResult = async (resultId) => {
    if (!window.confirm("Zatwierdzić wynik? Mecz zostanie zakończony.")) return;
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
        alert("Zatwierdzono!");
        fetchBracket();
      } else {
        const txt = await response.text();
        if (response.status === 403)
          alert("⛔ Tylko KAPITAN drużyny przeciwnej może zatwierdzić wynik.");
        else alert("Błąd: " + txt);
      }
    } catch (e) {
      console.error(e);
      alert("Błąd połączenia.");
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
        alert("Zgłoszono spór.");
        setDisputeData(null);
        fetchBracket();
      } else {
        const txt = await response.text();
        throw new Error(txt || "Błąd.");
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
            <h1>Drabinka Turniejowa</h1>
          </div>
          {loading && <div className={styles.loading}>Ładowanie...</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}
          {!loading && !error && Object.keys(rounds).length > 0 && (
            <div className={styles.bracketContainer}>
              {Object.keys(rounds).map((roundNum) => (
                <div key={roundNum} className={styles.roundColumn}>
                  <div className={styles.roundTitle}>Runda {roundNum}</div>
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
            <div className={styles.empty}>Brak meczów.</div>
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
    </>
  );
};

export default TournamentBracketPage;
