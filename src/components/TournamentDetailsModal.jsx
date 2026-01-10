import React, { useState } from "react";
import { getStatusColor } from "../components/adminHelpers"; // Upewnij się, że ścieżka do utils jest poprawna
import styles from "../styles/pages/adminPanel.module.css";

// --- SUB-KOMPONENT: Pojedynczy wiersz meczu ---
// Wydzielony, aby każdy mecz miał swoje własne stany inputów (scoreA, scoreB)
const MatchItem = ({ match, onResolveDispute }) => {
  // Lokalne stany dla inputów admina (tylko dla tego konkretnego meczu)
  const [localScoreA, setLocalScoreA] = useState(0);
  const [localScoreB, setLocalScoreB] = useState(0);

  // 1. Ustalanie nazw i ID
  const p1Name = match.participant1Name || match.teamAName || "Team A";
  const p2Name = match.participant2Name || match.teamBName || "Team B";
  const p1Id = match.participant1Id || match.teamAId;
  const p2Id = match.participant2Id || match.teamBId;

  // 2. Obsługa wyników "Pending" (zgłoszonych przez graczy)
  const pending = match.pendingResult || match.PendingResult;
  
  // Domyślne wyniki z bazy
  let displayScoreA = match.score1 ?? match.scoreA;
  let displayScoreB = match.score2 ?? match.scoreB;
  let proofUrl = match.screenshotUrl;

  // Nadpisanie widoku, jeśli jest zgłoszenie oczekujące
  if (pending) {
    displayScoreA = pending.scoreA ?? pending.participant1Score ?? displayScoreA;
    displayScoreB = pending.scoreB ?? pending.participant2Score ?? displayScoreB;
    if (pending.screenshotUrl) proofUrl = pending.screenshotUrl;
  }

  const isP1Winner = match.winnerId && match.winnerId === p1Id;
  const isP2Winner = match.winnerId && match.winnerId === p2Id;

  return (
    <div className={styles.matchCard} style={{ borderColor: getStatusColor(match.matchStatus) }}>
      {/* NAGŁÓWEK MECZU */}
      <div className={styles.matchHeader}>
        <span style={{ color: getStatusColor(match.matchStatus), fontWeight: 'bold', textTransform: 'uppercase' }}>
          {match.matchStatus}
          {pending && match.matchStatus === 'pending' && " (To Verify)"}
        </span>
        <span className={styles.matchId}>Match #{match.matchNumber || match.matchId}</span>
      </div>

      {/* DRUŻYNY I WYNIKI */}
      <div className={styles.matchTeams}>
        <div className={isP1Winner ? styles.winner : ''}>
          {p1Name}
          {(displayScoreA !== null && displayScoreA !== undefined) && (
            <span className={styles.score} style={pending ? { backgroundColor: '#fca311', color: '#000' } : {}}>
              {displayScoreA}
            </span>
          )}
        </div>
        <span>vs</span>
        <div className={isP2Winner ? styles.winner : ''}>
          {p2Name}
          {(displayScoreB !== null && displayScoreB !== undefined) && (
            <span className={styles.score} style={pending ? { backgroundColor: '#fca311', color: '#000' } : {}}>
              {displayScoreB}
            </span>
          )}
        </div>
      </div>

      {/* LINK DO SCREENSHOTA */}
      {proofUrl && (
        <div style={{ marginTop: '5px', textAlign: 'center' }}>
          <a href={proofUrl} target="_blank" rel="noreferrer" className={styles.proofLink}>
            📷 View Screenshot
          </a>
        </div>
      )}

      {/* --- SEKCJA ADMINA: ROZWIĄZYWANIE SPORU --- */}
      {(match.matchStatus === 'disputed' || match.matchStatus === 'pending') && (
        <div style={{ marginTop: "15px", padding: "10px", border: "2px solid red", backgroundColor: "#fff0f0", borderRadius: "6px" }}>
          <h4 style={{ color: "red", margin: "0 0 10px 0", fontSize: "0.9rem" }}>⚠️ Admin Override / Solve Dispute</h4>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px", justifyContent: "center" }}>
            {/* Input Team A */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <label style={{ fontSize: "10px", color: "black" }}>{p1Name}</label>
              <input
                type="number"
                value={localScoreA}
                onChange={(e) => setLocalScoreA(e.target.value)}
                placeholder="0"
                style={{ padding: "5px", width: "50px", textAlign: "center" }}
              />
            </div>
            
            <span style={{ fontWeight: "bold", color: "black" }}>:</span>
            
            {/* Input Team B */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <label style={{ fontSize: "10px", color: "black" }}>{p2Name}</label>
              <input
                type="number"
                value={localScoreB}
                onChange={(e) => setLocalScoreB(e.target.value)}
                placeholder="0"
                style={{ padding: "5px", width: "50px", textAlign: "center" }}
              />
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <button
  // ZMIANA: Przekazujemy teraz p1Id i p2Id do funkcji
  onClick={() => onResolveDispute(match.matchId || match.id, localScoreA, localScoreB, p1Id, p2Id)}
  style={{
    /* ...style bez zmian... */
    backgroundColor: "#d9534f",
    color: "white",
    border: "none",
    padding: "6px 12px",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "bold"
  }}
>
  Submit Result & Solve
</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- GŁÓWNY KOMPONENT MODALA ---
const TournamentDetailsModal = ({
  tournament,
  matches,
  matchesLoading,
  onGenerateBracket,
  onEdit,
  onDelete,
  onRefresh // Callback do odświeżenia danych po akcji admina
}) => {

  // Funkcja API do rozwiązywania sporu
  const handleAdminResolve = async (matchId, scoreA, scoreB, p1Id, p2Id) => {
    // 1. Zamiana pustych pól na 0 i sprawdzenie czy to liczby
    const sA = scoreA === "" ? 0 : parseInt(scoreA);
    const sB = scoreB === "" ? 0 : parseInt(scoreB);

    if (isNaN(sA) || isNaN(sB)) {
      alert("Wyniki muszą być liczbami!");
      return;
    }

    // 2. Budujemy obiekt TYLKO z wynikami
    const payload = {
        scoreA: sA,
        scoreB: sB
    };

    console.log("Wysyłanie (tylko wyniki):", payload);

    if (!window.confirm(`Zatwierdzić wynik ${sA}:${sB}?`)) return;

    const token = localStorage.getItem("jwt_token");
    const API_BASE_URL = "https://projektturniej.onrender.com";

    try {
      // ID meczu jest w adresie URL
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
        // Jeśli serwer zwróci błąd, próbujemy go odczytać
        const errorText = await response.text();
        console.error("Błąd Backend (treść):", errorText);
        alert(`Błąd serwera: ${response.status} (Internal Server Error). Sprawdź konsolę.`);
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
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <img
            src={tournament.imageUrl}
            alt="Tournament Banner"
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #333' }}
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
          <p style={{ textAlign: 'center', color: '#888' }}>Loading matches...</p>
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
                <div style={{
                  padding: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  color: '#10b981',
                  marginBottom: '15px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
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