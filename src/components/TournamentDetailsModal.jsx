import React, { useState } from "react";
import { getStatusColor } from "../components/adminHelpers";
import styles from "../styles/pages/adminPanel.module.css";

// Komponent wyświetlający pojedynczy mecz z opcją interwencji admina
const MatchItem = ({ match, onResolveDispute }) => {
  const [localScoreA, setLocalScoreA] = useState(0);
  const [localScoreB, setLocalScoreB] = useState(0);

  const p1Name = match.participant1Name || match.teamAName || "Team A";
  const p2Name = match.participant2Name || match.teamBName || "Team B";
  const p1Id = match.participant1Id || match.teamAId;
  const p2Id = match.participant2Id || match.teamBId;

  const pending = match.pendingResult || match.PendingResult;
  
  let displayScoreA = match.score1 ?? match.scoreA;
  let displayScoreB = match.score2 ?? match.scoreB;
  let proofUrl = match.screenshotUrl;

  if (pending) {
    displayScoreA = pending.scoreA ?? pending.participant1Score ?? displayScoreA;
    displayScoreB = pending.scoreB ?? pending.participant2Score ?? displayScoreB;
    if (pending.screenshotUrl) proofUrl = pending.screenshotUrl;
  }

  const isP1Winner = match.winnerId && match.winnerId === p1Id;
  const isP2Winner = match.winnerId && match.winnerId === p2Id;

  const needsAttention = match.matchStatus === 'disputed' || match.matchStatus === 'pending';

  // Funkcja pomocnicza do zmiany wyniku przyciskami
  const adjustScore = (setter, currentValue, amount) => {
    const val = parseInt(currentValue) || 0;
    const newVal = Math.max(0, val + amount); // Nie pozwól na ujemne wyniki
    setter(newVal);
  };

  return (
    <div className={`${styles.matchCard} ${needsAttention ? styles.cardAttention : ''}`} style={{ borderLeftColor: getStatusColor(match.matchStatus) }}>
      
      {/* HEADER */}
      <div className={styles.matchHeader}>
        <span className={styles.matchId}>#{match.matchNumber || match.matchId}</span>
        <span 
          className={styles.statusBadge} 
          style={{ 
            borderColor: getStatusColor(match.matchStatus),
            color: getStatusColor(match.matchStatus)
          }}
        >
          {match.matchStatus}
          {pending && match.matchStatus === 'pending' && " (Verifying)"}
        </span>
      </div>

      {/* TEAMS & SCORES */}
      <div className={styles.matchContent}>
        <div className={`${styles.teamInfo} ${isP1Winner ? styles.winnerText : ''}`}>
          <span className={styles.teamName}>{p1Name}</span>
          {(displayScoreA !== null && displayScoreA !== undefined) && (
            <span className={`${styles.mainScore} ${pending ? styles.pendingScore : ''}`}>{displayScoreA}</span>
          )}
        </div>
        
        <div className={styles.vsSeparator}>VS</div>

        <div className={`${styles.teamInfo} ${isP2Winner ? styles.winnerText : ''}`}>
          {(displayScoreB !== null && displayScoreB !== undefined) && (
            <span className={`${styles.mainScore} ${pending ? styles.pendingScore : ''}`}>{displayScoreB}</span>
          )}
          <span className={styles.teamName}>{p2Name}</span>
        </div>
      </div>

      {/* PROOF LINK */}
      {proofUrl && (
        <div className={styles.proofContainer}>
          <a href={proofUrl} target="_blank" rel="noreferrer" className={styles.proofButton}>
            📷 View Proof Screenshot
          </a>
        </div>
      )}

      {/* ADMIN DISPUTE PANEL */}
      {needsAttention && (
        <div className={styles.disputeBox}>
          <div className={styles.disputeHeader}>
            <span className={styles.alertIcon}>⚠️</span>
            <h4>Admin Override / Resolve Dispute</h4>
          </div>

          <div className={styles.disputeForm}>
            
            {/* INPUT DRUŻYNA A */}
            <div className={styles.scoreEditGroup}>
              <label>{p1Name}</label>
              <div className={styles.inputStepperWrapper}>
                <button 
                  className={styles.stepBtn} 
                  onClick={() => adjustScore(setLocalScoreA, localScoreA, -1)}
                >−</button>
                <input
                  type="number"
                  value={localScoreA}
                  onChange={(e) => setLocalScoreA(e.target.value)}
                  className={styles.scoreInput}
                />
                <button 
                  className={styles.stepBtn} 
                  onClick={() => adjustScore(setLocalScoreA, localScoreA, 1)}
                >+</button>
              </div>
            </div>

            <span className={styles.editSeparator}>:</span>

            {/* INPUT DRUŻYNA B */}
            <div className={styles.scoreEditGroup}>
              <label>{p2Name}</label>
              <div className={styles.inputStepperWrapper}>
                <button 
                  className={styles.stepBtn} 
                  onClick={() => adjustScore(setLocalScoreB, localScoreB, -1)}
                >−</button>
                <input
                  type="number"
                  value={localScoreB}
                  onChange={(e) => setLocalScoreB(e.target.value)}
                  className={styles.scoreInput}
                />
                <button 
                  className={styles.stepBtn} 
                  onClick={() => adjustScore(setLocalScoreB, localScoreB, 1)}
                >+</button>
              </div>
            </div>

          </div>

          <button
            onClick={() => onResolveDispute(match.matchId || match.id, localScoreA, localScoreB, p1Id, p2Id)}
            className={styles.resolveBtn}
          >
            Confirm Result & Resolve
          </button>
        </div>
      )}
    </div>
  );
};

// Główny modal szczegółów turnieju
const TournamentDetailsModal = ({
  tournament,
  matches,
  matchesLoading,
  onGenerateBracket,
  onEdit,
  onDelete,
  onRefresh 
}) => {

  // Logika wysyłania rozwiązania sporu do API
  const handleAdminResolve = async (matchId, scoreA, scoreB, p1Id, p2Id) => {
    const sA = scoreA === "" ? 0 : parseInt(scoreA);
    const sB = scoreB === "" ? 0 : parseInt(scoreB);

    if (isNaN(sA) || isNaN(sB)) {
      alert("Wyniki muszą być liczbami!");
      return;
    }

    const payload = { scoreA: sA, scoreB: sB };
    console.log("Wysyłanie (tylko wyniki):", payload);

    if (!window.confirm(`Zatwierdzić wynik ${sA}:${sB}?`)) return;

    const token = localStorage.getItem("jwt_token");
    const API_BASE_URL = "https://projektturniej.onrender.com";

    try {
      const response = await fetch(`${API_BASE_URL}/api/brackets/admin-resolve/${matchId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Sukces! Wynik zaktualizowany.");
        if (onRefresh) onRefresh();
      } else {
        const errorText = await response.text();
        console.error("Błąd Backend (treść):", errorText);
        alert(`Błąd serwera: ${response.status}. Sprawdź konsolę.`);
      }
    } catch (error) {
      console.error("Błąd sieci:", error);
      alert("Błąd połączenia z serwerem.");
    }
  };

  return (
    <div className={styles.modalInnerContent}>
      <h2 className={styles.detailsTitle}>{tournament.tournamentName}</h2>

      {tournament.imageUrl && (
        <div className={styles.bannerWrapper}>
          <img
            src={tournament.imageUrl}
            alt="Tournament Banner"
            className={styles.bannerImage}
          />
        </div>
      )}

      <div className={styles.detailsGrid}>
        <div><span>Type:</span> <strong>{tournament.registrationType === 'team' ? 'Team' : 'Individual'}</strong></div>
        <div><span>Max Participants:</span> <strong>{tournament.maxParticipants}</strong></div>
        <div><span>Start Date:</span> <strong>{new Date(tournament.startDate).toLocaleString()}</strong></div>
        {tournament.endDate && (
          <div><span>End Date:</span> <strong>{new Date(tournament.endDate).toLocaleString()}</strong></div>
        )}
      </div>

      <div className={styles.bracketSection}>
        <h3>Bracket Management</h3>

        {matchesLoading ? (
          <p className={styles.loadingText}>Loading matches...</p>
        ) : (
          <>
            {matches.length === 0 ? (
              <div className={styles.generateBox}>
                <p>Tournament does not have a bracket generated yet.</p>
                <button className={styles.generateBtn} onClick={onGenerateBracket}>
                  ⚡ Generate Bracket
                </button>
              </div>
            ) : (
              <>
                <div className={styles.bracketReadyMsg}>
                  ✅ Bracket is ready
                </div>

                <div className={styles.matchesList}>
                  <h4>Recent Activity:</h4>
                  {matches
                    .sort((a, b) => (b.matchStatus === 'disputed') - (a.matchStatus === 'disputed'))
                    .map(match => (
                      <MatchItem 
                        key={match.matchId || match.id} 
                        match={match} 
                        onResolveDispute={handleAdminResolve} 
                      />
                    ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className={styles.adminActions}>
        <button className={styles.editBtn} onClick={(e) => onEdit(tournament, e)}>Edit</button>
        <button className={styles.deleteBtn} onClick={(e) => onDelete(tournament.tournamentId || tournament.id, e)}>Delete</button>
      </div>
    </div>
  );
};

export default TournamentDetailsModal;