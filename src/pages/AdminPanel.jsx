import React, { useState, useEffect } from "react";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
// Import Twojego komponentu Modal
import Modal from "../components/modal"; 
import styles from "../styles/pages/adminPanel.module.css";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("tournaments");
  
  // Dane list
  const [tournamentsList, setTournamentsList] = useState([]);
  const [gamesList, setGamesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- MODAL I MECZE ---
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentMatches, setTournamentMatches] = useState([]); // Lista meczów w modalu
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Formularz
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tournamentForm, setTournamentForm] = useState({
    title: "", gameId: "", organizerId: "", maxParticipants: 16, startDate: "", description: ""
  });

  // Helper daty
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().slice(0, 16);
  };

  // --- 1. POBIERANIE DANYCH ---
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

  // --- NOWE: POBIERANIE MECZÓW DO MODALA ---
  const fetchMatches = async (tournamentId) => {
    setMatchesLoading(true);
    const token = localStorage.getItem("jwt_token");
    try {
        // ZAKŁADAM ENDPOINT DO POBRANIA MECZÓW TURNIEJU
        // Jeśli masz inny, np. /api/brackets/matches/{id}, zmień tutaj
        const response = await fetch(`/api/brackets/${tournamentId}/matches`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            setTournamentMatches(data);
        } else {
            setTournamentMatches([]); // Brak drabinki lub błąd
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

  // Efekt: Jak otworzysz modal, pobierz mecze
  useEffect(() => {
    if (selectedTournament) {
        fetchMatches(selectedTournament.tournamentId || selectedTournament.id);
    }
  }, [selectedTournament]);

  // --- 2. GENEROWANIE DRABINKI ---
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
            fetchMatches(selectedTournament.tournamentId || selectedTournament.id); // Odśwież listę meczów
        } else {
            const txt = await response.text();
            alert(`Błąd: ${txt}`);
        }
    } catch (err) {
        alert("Błąd sieci podczas generowania.");
    }
  };

  // --- 3. ROZWIĄZYWANIE SPORU (SCENARIUSZ C) ---
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
            body: JSON.stringify({ winnerId: winnerTeamId }) // Wysyłamy ID zwycięzcy
        });

        if (response.ok) {
            alert("Spór rozwiązany.");
            fetchMatches(selectedTournament.tournamentId || selectedTournament.id); // Odśwież widok
        } else {
            alert("Nie udało się rozwiązać sporu.");
        }
    } catch (err) {
        alert("Błąd sieci.");
    }
  };

  

  // --- 2. ZAPISYWANIE (POST/PUT) ---
  const handleSaveTournament = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwt_token");

    const formattedDate = tournamentForm.startDate 
        ? new Date(tournamentForm.startDate).toISOString() 
        : new Date().toISOString();

    const payload = {
        TournamentName: tournamentForm.title,
        GameId: parseInt(tournamentForm.gameId),
        OrganizerId: parseInt(tournamentForm.organizerId),
        Description: tournamentForm.description,
        MaxParticipants: parseInt(tournamentForm.maxParticipants),
        StartDate: formattedDate 
    };

    const url = isEditing 
        ? `https://projektturniej.onrender.com/api/tournaments/${editingId}`
        : "https://projektturniej.onrender.com/api/tournaments";
    
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
      } else {
        const text = await response.text();
        alert(`Błąd: ${text}`);
      }
    } catch (err) {
      alert("Błąd połączenia.");
    }
  };

  // --- 3. USUWANIE (DELETE) ---
  const handleDeleteTournament = async (id) => {
    if (!window.confirm("Czy na pewno usunąć ten turniej?")) return;
    
    const token = localStorage.getItem("jwt_token");
    try {
        const response = await fetch(`https://projektturniej.onrender.com/api/tournaments/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Usunięto pomyślnie.");
            setSelectedTournament(null); // Zamknij modal
            fetchTournaments(); // Odśwież listę
        } else {
            alert("Błąd usuwania.");
        }
    } catch (err) {
        alert("Błąd sieci.");
    }
  };

  // --- 4. PRZYGOTOWANIE EDYCJI ---
  const handleEditClick = (tournament) => {
    setTournamentForm({
        title: tournament.tournamentName,
        gameId: tournament.gameId,
        organizerId: tournament.organizerId,
        maxParticipants: tournament.maxParticipants,
        startDate: formatDateForInput(tournament.startDate),
        description: tournament.description || ""
    });
    setEditingId(tournament.tournamentId || tournament.id);
    setIsEditing(true);
    
    setSelectedTournament(null); // Zamknij modal
    setActiveTab("create"); // Przejdź do formularza
  };

  const resetForm = () => {
    setTournamentForm({ 
        title: "", gameId: "", organizerId: "", 
        maxParticipants: 16, startDate: "", description: "" 
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // --- RENDERY ---
  const renderForm = () => (
    <div className={styles.tabContent}>
      <h2>{isEditing ? "Edytuj turniej" : "Stwórz nowy turniej"}</h2>
      <form onSubmit={handleSaveTournament}>
        <div className={styles.formGroup}>
          <label>Nazwa Turnieju</label>
          <input type="text" className={styles.input} required value={tournamentForm.title} onChange={e => setTournamentForm({...tournamentForm, title: e.target.value})} />
        </div>
        <div className={styles.formGroup}>
          <label>Gra</label>
          <select className={styles.select} required value={tournamentForm.gameId} onChange={e => setTournamentForm({...tournamentForm, gameId: e.target.value})}>
            <option value="">-- Wybierz Grę --</option>
            {gamesList.map(g => <option key={g.gameId} value={g.gameId}>{g.gameName}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>ID Organizatora</label>
          <input type="number" className={styles.input} required value={tournamentForm.organizerId} onChange={e => setTournamentForm({...tournamentForm, organizerId: e.target.value})} />
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

  const getStatusColor = (status) => {
      switch(status?.toLowerCase()) {
          case 'scheduled': return '#888';
          case 'pending': return '#fca311'; // Czeka na potwierdzenie
          case 'disputed': return '#ef4444'; // CZERWONY - SPÓR!
          case 'completed': return '#10b981';
          default: return '#fff';
      }
  };

  const renderList = () => (
    <div className={styles.tournamentList}>
        {tournamentsList.map(t => (
            <div key={t.id || t.tournamentId} className={styles.tournamentItem} onClick={() => setSelectedTournament(t)}>
                <div>
                    <strong className={styles.itemTitle}>{t.tournamentName}</strong>
                    <div className={styles.itemSubtitle}>Start: {new Date(t.startDate).toLocaleDateString()}</div>
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
            {/* TABS (pominąłem dla czytelności kodu, wklej swoje) */}
            {activeTab === 'tournaments' && renderList()}
            {/* ...formularz... */}
        </main>
      </div>

      {/* --- MODAL ADMINA --- */}
      {selectedTournament && (
        <Modal onClose={() => setSelectedTournament(null)}>
            <div className={styles.modalInnerContent}>
                <h2 className={styles.detailsTitle}>{selectedTournament.tournamentName}</h2>
                
                {/* 1. Podstawowe info */}
                <div className={styles.detailsGrid}>
                    <div><span>Max Graczy:</span> <strong>{selectedTournament.maxParticipants}</strong></div>
                    <div><span>Data:</span> <strong>{new Date(selectedTournament.startDate).toLocaleString()}</strong></div>
                </div>

                {/* 2. Sekcja Drabinki / Meczów */}
                <div className={styles.bracketSection}>
                    <h3>Zarządzanie Rozgrywkami</h3>
                    
                    {/* Przycisk Generowania (widoczny np. gdy brak meczów) */}
                    {tournamentMatches.length === 0 && (
                        <div className={styles.generateBox}>
                            <p>Turniej nie ma jeszcze wygenerowanej drabinki.</p>
                            <button className={styles.generateBtn} onClick={handleGenerateBracket}>
                                ⚡ Wygeneruj Drabinkę
                            </button>
                        </div>
                    )}

                    {/* Lista Meczów (szczególnie tych ze sporem) */}
                    {matchesLoading ? <p>Ładowanie meczów...</p> : (
                        <div className={styles.matchesList}>
                            {tournamentMatches.length > 0 && <h4>Ostatnie Aktywności:</h4>}
                            
                            {tournamentMatches
                             .sort((a, b) => (b.matchStatus === 'disputed') - (a.matchStatus === 'disputed')) // Pokaż SPORY na górze
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

                                    {/* SCENARIUSZ C: ADMIN RESOLVE */}
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
                                            {/* Tutaj można by dodać podgląd screenshota, jeśli API go zwraca */}
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