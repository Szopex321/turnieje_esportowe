import React, { useState, useEffect } from "react";
// Upewnij się, że te importy pasują do Twojej struktury folderów
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import Modal from "../components/modal";
import styles from "../styles/pages/adminPanel.module.css";

const AdminPanel = () => {
  // Domyślna zakładka to 'results'
  const [activeTab, setActiveTab] = useState("results");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- DANE Z API ---
  const [matchesToReview, setMatchesToReview] = useState([]);
  const [gamesList, setGamesList] = useState([]); 

  // --- FORMULARZ TWORZENIA TURNIEJU ---
  const [newTournament, setNewTournament] = useState({
    title: "",            
    gameId: "",           
    organizerId: "",      
    maxParticipants: 16,  
    startDate: "",        
    description: ""       
  });

  // --- 1. POBIERANIE DANYCH ---

  // Pobieranie meczów do akceptacji
  const fetchMatches = async () => {
    const token = localStorage.getItem("jwt_token");
    setLoading(true);
    try {
      const response = await fetch("https://projektturniej.onrender.com/api/Matches/admin-review", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMatchesToReview(data);
      }
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pobieranie listy gier (do dropdowna)
  const fetchGames = async () => {
    try {
        const response = await fetch('https://projektturniej.onrender.com/api/games');
        if (response.ok) {
            const data = await response.json();
            setGamesList(data);
        }
    } catch (error) {
        console.error("Error fetching games:", error);
    }
  };

  // Obsługa zmiany zakładek
  useEffect(() => {
    if (activeTab === "results") fetchMatches();
    if (activeTab === "create") fetchGames();
  }, [activeTab]);

  // --- 2. AKCJA: TWORZENIE TURNIEJU (NAPRAWIONE: POJEDYNCZY FETCH) ---
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwt_token");

    // Formatowanie daty
    const formattedDate = newTournament.startDate 
        ? new Date(newTournament.startDate).toISOString() 
        : new Date().toISOString();

    const payload = {
        TournamentName: newTournament.title,
        GameId: parseInt(newTournament.gameId),
        OrganizerId: parseInt(newTournament.organizerId),
        Description: newTournament.description,
        MaxParticipants: parseInt(newTournament.maxParticipants),
        StartDate: formattedDate 
    };

    console.log("Wysyłany JSON:", JSON.stringify(payload));

    try {
      const response = await fetch("https://projektturniej.onrender.com/api/tournaments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Sukces! Turniej został utworzony.");
        // Reset formularza
        setNewTournament({ 
            title: "", gameId: "", organizerId: "", 
            maxParticipants: 16, startDate: "", description: "" 
        });
      } else {
        // Obsługa błędu
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            console.error("Błąd backendu:", errorData);
            alert(`Błąd: ${JSON.stringify(errorData)}`);
        } catch {
            console.error("Błąd backendu (raw):", text);
            alert(`Błąd serwera: ${text}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Błąd połączenia z serwerem.");
    }
  };

  // --- 3. AKCJA: ZATWIERDZANIE WYNIKU ---
  const handleConfirmResult = async (matchId, finalScoreA, finalScoreB) => {
    const token = localStorage.getItem("jwt_token");
    if(!window.confirm(`Czy na pewno ustawić wynik ${finalScoreA}:${finalScoreB}?`)) return;

    try {
      const response = await fetch(`https://projektturniej.onrender.com/api/Matches/${matchId}/resolve`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ scoreTeamA: finalScoreA, scoreTeamB: finalScoreB })
      });

      if (response.ok) {
        alert("Mecz rozstrzygnięty pomyślnie!");
        setSelectedMatch(null);
        fetchMatches(); // Odśwież listę
      } else {
        alert("Nie udało się rozstrzygnąć meczu.");
      }
    } catch (err) {
      console.error(err);
      alert("Błąd sieci.");
    }
  };

  // --- RENDERY (HTML) ---

  const renderCreateTournament = () => (
    <div className={styles.tabContent}>
      <h2>Create New Tournament</h2>
      <form onSubmit={handleCreateTournament}>
        
        {/* Nazwa Turnieju */}
        <div className={styles.formGroup}>
          <label>Tournament Name</label>
          <input 
            type="text" 
            className={styles.input} 
            required 
            value={newTournament.title}
            onChange={e => setNewTournament({...newTournament, title: e.target.value})}
            placeholder="Np. Winter Cup 2025"
          />
        </div>

        {/* Wybór Gry */}
        <div className={styles.formGroup}>
          <label>Game</label>
          <select 
            className={styles.select}
            value={newTournament.gameId}
            onChange={e => setNewTournament({...newTournament, gameId: e.target.value})}
            required
          >
            <option value="">-- Select Game --</option>
            {gamesList.map(g => (
                <option key={g.gameId} value={g.gameId}>{g.gameName}</option>
            ))}
            <option value="4">Fortnite (ID: 4)</option>
          </select>
        </div>

        {/* Organizer ID */}
        <div className={styles.formGroup}>
          <label>Organizer ID</label>
          <input 
            type="number" 
            className={styles.input} 
            required 
            value={newTournament.organizerId}
            onChange={e => setNewTournament({...newTournament, organizerId: e.target.value})}
            placeholder="Np. 8"
          />
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea 
             className={styles.textarea}
             value={newTournament.description}
             onChange={e => setNewTournament({...newTournament, description: e.target.value})}
          />
        </div>

        {/* Max Participants */}
        <div className={styles.formGroup}>
          <label>Max Participants</label>
          <input 
            type="number" 
            className={styles.input} 
            value={newTournament.maxParticipants}
            onChange={e => setNewTournament({...newTournament, maxParticipants: e.target.value})}
          />
        </div>

        {/* Start Date */}
        <div className={styles.formGroup}>
            <label>Start Date</label>
            <input 
                type="datetime-local" 
                className={styles.input}
                value={newTournament.startDate}
                onChange={e => setNewTournament({...newTournament, startDate: e.target.value})}
            />
        </div>

        <button type="submit" className={styles.createBtn}>Create Tournament</button>
      </form>
    </div>
  );

  const renderManageResults = () => {
    const sortedMatches = [...matchesToReview].sort((a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now()));

    if (loading) return <div>Loading matches...</div>;

    return (
      <div>
        <h2>Tournament Results Approval</h2>
        
        {sortedMatches.length === 0 ? <p>No matches pending review.</p> : (
            <div className={styles.tournamentList}>
            {sortedMatches.map(match => {
                const isConflict = match.status === "Conflict";
                return (
                <div key={match.id} className={styles.tournamentItem} onClick={() => setSelectedMatch(match)}>
                    <div>
                        <strong>{match.tournamentName}</strong>
                        <div style={{fontSize: '0.9rem', color: '#ccc'}}>
                            {match.teamAName} vs {match.teamBName}
                        </div>
                    </div>
                    <div className={`${styles.statusBadge} ${isConflict ? styles.statusConflict : styles.statusPending}`}>
                        {match.status}
                    </div>
                </div>
                );
            })}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.pageWrapper}>
      <TitleBar />
      <div className={styles.contentContainer}>
        <Nav />
        <main className={styles.mainContent}>
          
          <div className={styles.tabsContainer}>
            <button 
                className={`${styles.tabButton} ${activeTab === 'results' ? styles.activeTab : ''}`} 
                onClick={() => setActiveTab('results')}
            >
                Manage Results
            </button>
            <button 
                className={`${styles.tabButton} ${activeTab === 'create' ? styles.activeTab : ''}`} 
                onClick={() => setActiveTab('create')}
            >
                Create Tournament
            </button>
          </div>

          {activeTab === 'results' && renderManageResults()}
          {activeTab === 'create' && renderCreateTournament()}

        </main>
      </div>

      {/* Modal */}
      {selectedMatch && (
        <Modal onClose={() => setSelectedMatch(null)}>
            <h2 style={{color: 'white', textAlign:'center'}}>Match Review</h2>
            
            <div className={styles.matchConflictContainer}>
                {selectedMatch.status === "Conflict" && (
                    <div className={styles.conflictAlert}>⚠️ <strong>CONFLICT DETECTED!</strong></div>
                )}
                 
                <div className={styles.scoreBoard}>
                    <div className={styles.teamScore}>
                        <h4>{selectedMatch.teamAName}</h4>
                        <p style={{fontSize:'0.8rem', color:'#888'}}>Claimed:</p>
                        <div className={styles.scoreInput}>
                            {selectedMatch.scoreASubmitted ?? "?"}
                        </div>
                    </div>
                    <div style={{fontSize: '2rem', fontWeight: 'bold', color:'#555'}}>VS</div>
                    <div className={styles.teamScore}>
                        <h4>{selectedMatch.teamBName}</h4>
                        <p style={{fontSize:'0.8rem', color:'#888'}}>Claimed:</p>
                        <div className={styles.scoreInput}>
                            {selectedMatch.scoreBSubmitted ?? "?"}
                        </div>
                    </div>
                </div>

                {selectedMatch.status === "Conflict" && (
                      <div style={{textAlign:'center', marginBottom: 20, color:'#ccc', fontSize:'0.9rem'}}>
                        <p>Team A claims: {selectedMatch.scoreASubmitted} - {selectedMatch.scoreBSubmittedOpponent}</p>
                        <p>Team B claims: {selectedMatch.scoreAOpponent} - {selectedMatch.scoreBSubmitted}</p>
                      </div>
                )}

                <div className={styles.adminActions}>
                    <button 
                        className={styles.confirmBtn} 
                        onClick={() => handleConfirmResult(selectedMatch.id, selectedMatch.scoreASubmitted, selectedMatch.scoreBSubmittedOpponent)}
                    >
                        Approve {selectedMatch.teamAName}'s Result
                    </button>
                    
                    <button 
                        className={styles.confirmBtn}
                        style={{backgroundColor: '#fca311'}} 
                        onClick={() => handleConfirmResult(selectedMatch.id, selectedMatch.scoreAOpponent, selectedMatch.scoreBSubmitted)}
                    >
                            Approve {selectedMatch.teamBName}'s Result
                    </button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPanel;