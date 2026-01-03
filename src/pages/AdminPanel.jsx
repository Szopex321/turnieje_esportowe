import React, { useState, useEffect } from "react";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import Modal from "../components/modal"; 
import styles from "../styles/pages/adminPanel.module.css";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("tournaments");
  
  // ID zalogowanego admina
  const [currentAdminId, setCurrentAdminId] = useState(null);
  
  // Dane list
  const [tournamentsList, setTournamentsList] = useState([]);
  const [gamesList, setGamesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- MODAL I MECZE ---
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentMatches, setTournamentMatches] = useState([]); 
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Formularz - DODANO: imageUrl
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tournamentForm, setTournamentForm] = useState({
    title: "", 
    gameId: "", 
    organizerId: "", 
    maxParticipants: 16, 
    startDate: "", 
    description: "",
    imageUrl: "" // <--- NOWE POLE
  });

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().slice(0, 16);
  };

  // --- POBIERANIE DANYCH ---
  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tournaments");
      if (response.ok) {
        const data = await response.json();
        setTournamentsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) setGamesList(await response.json());
    } catch (error) { console.error(error); }
  };

  const fetchMatches = async (tournamentId) => {
    setMatchesLoading(true);
    const token = localStorage.getItem("jwt_token");
    try {
        const response = await fetch(`/api/brackets/${tournamentId}/matches`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            setTournamentMatches(data);
        } else {
            setTournamentMatches([]); 
        }
    } catch (err) {
        console.error("Błąd pobierania meczów:", err);
    } finally {
        setMatchesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tournaments") fetchTournaments();
    fetchGames();
  }, [activeTab]);

  useEffect(() => {
    if (selectedTournament) {
        fetchMatches(selectedTournament.tournamentId || selectedTournament.id);
    }
  }, [selectedTournament]);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
        const decoded = parseJwt(token);
        const adminId = decoded?.nameid || decoded?.id || decoded?.userId;
        
        if (adminId) {
            setCurrentAdminId(adminId);
            setTournamentForm(prev => ({ ...prev, organizerId: adminId }));
        }
    }
  }, []);

  // --- GENEROWANIE DRABINKI ---
  const handleGenerateBracket = async () => {
    if (!selectedTournament) return;
    const token = localStorage.getItem("jwt_token");

    try {
        const response = await fetch(`/api/brackets/generate/${selectedTournament.tournamentId || selectedTournament.id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Drabinka została wygenerowana!");
            fetchMatches(selectedTournament.tournamentId || selectedTournament.id);
        } else {
            const txt = await response.text();
            alert(`Błąd: ${txt}`);
        }
    } catch (err) {
        alert("Błąd sieci podczas generowania.");
    }
  };

  // --- ROZWIĄZYWANIE SPORU ---
  const handleResolveDispute = async (matchId, winnerTeamId) => {
    if (!window.confirm("Czy na pewno chcesz przyznać zwycięstwo tej drużynie?")) return;
    const token = localStorage.getItem("jwt_token");

    try {
        const response = await fetch(`/api/brackets/admin-resolve/${matchId}`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({ winnerId: winnerTeamId })
        });

        if (response.ok) {
            alert("Spór rozwiązany.");
            fetchMatches(selectedTournament.tournamentId || selectedTournament.id);
        } else {
            alert("Nie udało się rozwiązać sporu.");
        }
    } catch (err) {
        alert("Błąd sieci.");
    }
  };

  // --- ZAPISYWANIE (POST/PUT) ---
  const handleSaveTournament = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwt_token");

    const formattedDate = tournamentForm.startDate 
        ? new Date(tournamentForm.startDate).toISOString() 
        : new Date().toISOString();

    const payload = {
        TournamentName: tournamentForm.title,
        GameId: parseInt(tournamentForm.gameId),
        OrganizerId: parseInt(tournamentForm.organizerId || currentAdminId),
        Description: tournamentForm.description,
        MaxParticipants: parseInt(tournamentForm.maxParticipants),
        StartDate: formattedDate,
        ImageUrl: tournamentForm.imageUrl // <--- WYSYŁAMY LINK DO BACKENDU
    };

    const url = isEditing 
        ? `/api/tournaments/${editingId}`
        : "/api/tournaments";
    
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(isEditing ? "Zaktualizowano turniej!" : "Utworzono turniej!");
        resetForm();
        setActiveTab("tournaments");
        fetchTournaments();
      } else {
        const text = await response.text();
        alert(`Błąd: ${text}`);
      }
    } catch (err) {
      alert("Błąd połączenia.");
    }
  };

  // --- USUWANIE ---
  const handleDeleteTournament = async (id) => {
    if (!window.confirm("Czy na pewno usunąć ten turniej?")) return;
    
    const token = localStorage.getItem("jwt_token");
    try {
        const response = await fetch(`/api/tournaments/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Usunięto pomyślnie.");
            setSelectedTournament(null);
            fetchTournaments();
        } else {
            alert("Błąd usuwania.");
        }
    } catch (err) {
        alert("Błąd sieci.");
    }
  };

  // --- EDYCJA I RESET ---
  const handleEditClick = (tournament) => {
    setTournamentForm({
        title: tournament.tournamentName,
        gameId: tournament.gameId,
        organizerId: tournament.organizerId,
        maxParticipants: tournament.maxParticipants,
        startDate: formatDateForInput(tournament.startDate),
        description: tournament.description || "",
        imageUrl: tournament.imageUrl || "" // <--- WCZYTUJEMY LINK (jeśli istnieje)
    });
    setEditingId(tournament.tournamentId || tournament.id);
    setIsEditing(true);
    
    setSelectedTournament(null);
    setActiveTab("create");
  };

  const resetForm = () => {
    setTournamentForm({ 
        title: "", 
        gameId: "", 
        organizerId: currentAdminId || "", 
        maxParticipants: 16, 
        startDate: "", 
        description: "",
        imageUrl: "" // <--- RESETUJEMY LINK
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const getStatusColor = (status) => {
      switch(status?.toLowerCase()) {
          case 'scheduled': return '#888';
          case 'pending': return '#fca311';
          case 'disputed': return '#ef4444';
          case 'completed': return '#10b981';
          default: return '#fff';
      }
  };

  // --- WIDOK FORMULARZA ---
  const renderForm = () => (
    <div className={styles.tabContent}>
      <h2>{isEditing ? "Edytuj turniej" : "Stwórz nowy turniej"}</h2>
      <form onSubmit={handleSaveTournament}>
        <div className={styles.formGroup}>
          <label>Nazwa Turnieju</label>
          <input type="text" className={styles.input} required value={tournamentForm.title} onChange={e => setTournamentForm({...tournamentForm, title: e.target.value})} />
        </div>
        
        {/* --- NOWE POLE: ZDJĘCIE (URL) --- */}
        <div className={styles.formGroup}>
          <label>Zdjęcie Turnieju (URL)</label>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="https://przyklad.com/obrazek.jpg"
            value={tournamentForm.imageUrl} 
            onChange={e => setTournamentForm({...tournamentForm, imageUrl: e.target.value})} 
          />
          {/* PODGLĄD ZDJĘCIA */}
          {tournamentForm.imageUrl && (
            <div style={{marginTop: '10px'}}>
                <p style={{fontSize: '0.8rem', color: '#888', marginBottom: '5px'}}>Podgląd:</p>
                <img 
                    src={tournamentForm.imageUrl} 
                    alt="Podgląd" 
                    style={{maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #444'}} 
                    onError={(e) => {e.target.style.display = 'none'}} // Ukryj jeśli link jest zły
                />
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>Gra</label>
          <select className={styles.select} required value={tournamentForm.gameId} onChange={e => setTournamentForm({...tournamentForm, gameId: e.target.value})}>
            <option value="">-- Wybierz Grę --</option>
            {gamesList.map(g => <option key={g.gameId} value={g.gameId}>{g.gameName}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>Opis</label>
          <textarea className={styles.textarea} value={tournamentForm.description} onChange={e => setTournamentForm({...tournamentForm, description: e.target.value})} />
        </div>
        <div className={styles.formGroup}>
          <label>Max Graczy</label>
          <input type="number" className={styles.input} value={tournamentForm.maxParticipants} onChange={e => setTournamentForm({...tournamentForm, maxParticipants: e.target.value})} />
        </div>
        <div className={styles.formGroup}>
            <label>Data Startu</label>
            <input type="datetime-local" className={styles.input} value={tournamentForm.startDate} onChange={e => setTournamentForm({...tournamentForm, startDate: e.target.value})} />
        </div>
        <div className={styles.buttonGroup}>
            <button type="submit" className={styles.createBtn}>{isEditing ? "Zapisz Zmiany" : "Utwórz Turniej"}</button>
            {isEditing && <button type="button" className={styles.cancelBtn} onClick={() => { resetForm(); setActiveTab("tournaments"); }}>Anuluj</button>}
        </div>
      </form>
    </div>
  );

  // --- WIDOK LISTY ---
  const renderList = () => (
    <div className={styles.tournamentList}>
        {tournamentsList.map(t => (
            <div key={t.id || t.tournamentId} className={styles.tournamentItem} onClick={() => setSelectedTournament(t)}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    {/* Miniaturka na liście (opcjonalnie) */}
                    {t.imageUrl && (
                        <img 
                            src={t.imageUrl} 
                            alt="Cover" 
                            style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}} 
                        />
                    )}
                    <div>
                        <strong className={styles.itemTitle}>{t.tournamentName}</strong>
                        <div className={styles.itemSubtitle}>Start: {new Date(t.startDate).toLocaleDateString()}</div>
                    </div>
                </div>
                <div className={styles.arrowIcon}>Szczegóły &rsaquo;</div>
            </div>
        ))}
    </div>
  );

  return (
    <div className={styles.pageWrapper}>
      <TitleBar />
      <div className={styles.contentContainer}>
        <Nav />
        <main className={styles.mainContent}>
            
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'tournaments' ? styles.active : ''}`}
                    onClick={() => setActiveTab('tournaments')}
                >
                    Lista Turniejów
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
                    onClick={() => { resetForm(); setActiveTab('create'); }}
                >
                    {isEditing ? "Edycja Turnieju" : "Dodaj Turniej"}
                </button>
            </div>

            {activeTab === 'tournaments' && renderList()}
            {activeTab === 'create' && renderForm()}

        </main>
      </div>

      {selectedTournament && (
        <Modal onClose={() => setSelectedTournament(null)}>
            <div className={styles.modalInnerContent}>
                <h2 className={styles.detailsTitle}>{selectedTournament.tournamentName}</h2>
                
                {/* ZDJĘCIE W MODALU - JEŚLI JEST */}
                {selectedTournament.imageUrl && (
                    <div style={{marginBottom: '20px', textAlign: 'center'}}>
                        <img 
                            src={selectedTournament.imageUrl} 
                            alt="Tournament Banner" 
                            style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #333'}}
                        />
                    </div>
                )}

                <div className={styles.detailsGrid}>
                    <div><span>Max Graczy:</span> <strong>{selectedTournament.maxParticipants}</strong></div>
                    <div><span>Data:</span> <strong>{new Date(selectedTournament.startDate).toLocaleString()}</strong></div>
                </div>

                <div className={styles.bracketSection}>
                    <h3>Zarządzanie Rozgrywkami</h3>
                    
                    {tournamentMatches.length === 0 && (
                        <div className={styles.generateBox}>
                            <p>Turniej nie ma jeszcze wygenerowanej drabinki.</p>
                            <button className={styles.generateBtn} onClick={handleGenerateBracket}>
                                ⚡ Wygeneruj Drabinkę
                            </button>
                        </div>
                    )}

                    {matchesLoading ? <p>Ładowanie meczów...</p> : (
                        <div className={styles.matchesList}>
                            {tournamentMatches.length > 0 && <h4>Ostatnie Aktywności:</h4>}
                            
                            {tournamentMatches
                             .sort((a, b) => (b.matchStatus === 'disputed') - (a.matchStatus === 'disputed')) 
                             .map(match => (
                                <div key={match.matchId} className={styles.matchCard} style={{borderColor: getStatusColor(match.matchStatus)}}>
                                    
                                    <div className={styles.matchHeader}>
                                        <span style={{color: getStatusColor(match.matchStatus), fontWeight: 'bold', textTransform: 'uppercase'}}>
                                            {match.matchStatus}
                                        </span>
                                        <span className={styles.matchId}>Mecz #{match.matchId}</span>
                                    </div>

                                    <div className={styles.matchTeams}>
                                        <div className={match.winnerId === match.teamAId ? styles.winner : ''}>
                                            {match.teamAName || "Drużyna A"} 
                                            {match.scoreA !== null && <span className={styles.score}>{match.scoreA}</span>}
                                        </div>
                                        <span>vs</span>
                                        <div className={match.winnerId === match.teamBId ? styles.winner : ''}>
                                            {match.teamBName || "Drużyna B"}
                                            {match.scoreB !== null && <span className={styles.score}>{match.scoreB}</span>}
                                        </div>
                                    </div>

                                    {match.matchStatus === 'disputed' && (
                                        <div className={styles.disputeControls}>
                                            <p>⚠️ Wymagana interwencja! Kto wygrał?</p>
                                            <div className={styles.disputeButtons}>
                                                <button onClick={() => handleResolveDispute(match.matchId, match.teamAId)} className={styles.winBtn}>
                                                    Win {match.teamAName || "A"}
                                                </button>
                                                <button onClick={() => handleResolveDispute(match.matchId, match.teamBId)} className={styles.winBtn}>
                                                    Win {match.teamBName || "B"}
                                                </button>
                                            </div>
                                            {match.screenshotUrl && (
                                                <a href={match.screenshotUrl} target="_blank" rel="noreferrer" className={styles.proofLink}>Zobacz dowód</a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.adminActions}>
                    <button className={styles.editBtn} onClick={() => handleEditClick(selectedTournament)}>Edytuj</button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteTournament(selectedTournament.tournamentId || selectedTournament.id)}>Usuń</button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPanel;