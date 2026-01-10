import React, { useState, useEffect } from "react";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import Modal from "../components/modal"; 
import styles from "../styles/pages/adminPanel.module.css";
import Button from "../components/Button"; // Zakładam, że masz ten komponent, jeśli nie, użyj zwykłego <button>

const API_BASE_URL = "https://projektturniej.onrender.com/api";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("tournaments");
  
  // ID zalogowanego admina
  const [currentAdminId, setCurrentAdminId] = useState(null);
  
  // Dane list
  const [tournamentsList, setTournamentsList] = useState([]);
  const [gamesList, setGamesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- NOWE STANY: WYSZUKIWANIE I SORTOWANIE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateAsc"); // dateAsc, dateDesc, nameAsc, nameDesc

  // --- MODAL I MECZE ---
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentMatches, setTournamentMatches] = useState([]); 
  const [matchesLoading, setMatchesLoading] = useState(false);

  // --- STANY DLA WYNIKÓW ADMINA ---
  const [adminScoreA, setAdminScoreA] = useState("");
  const [adminScoreB, setAdminScoreB] = useState("");

  // Formularz
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [tournamentForm, setTournamentForm] = useState({
    title: "", 
    gameId: "", 
    organizerId: "", 
    maxParticipants: 16, 
    startDate: "", 
    endDate: "",        
    description: "",
    imageUrl: "",
    registrationType: "individual",
  });

  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const userJson = localStorage.getItem("currentUser");
    
    let isUserAdmin = false;
    if (userJson) {
        const user = JSON.parse(userJson);
        if (user.role === 'admin' || user.role === 'Admin') isUserAdmin = true;
    }

    if (!token || !isUserAdmin) {
        window.location.href = "/"; 
    }
  }, []);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().slice(0, 16);
  };

  // --- LOGIKA STATUSU (Z MAIN PAGE) ---
  const getTournamentStatus = (startDate) => {
    if (!startDate) return "Unknown";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    if (start > today) return "Upcoming";
    if (start.getTime() === today.getTime()) return "Ongoing";
    return "Completed";
  };

  // --- KOLORY STATUSÓW ---
  const getCalculatedStatusColor = (status) => {
      switch(status) {
          case 'Upcoming': return '#3b82f6'; // Niebieski
          case 'Ongoing': return '#10b981';  // Zielony
          case 'Completed': return '#6b7280'; // Szary
          default: return '#fff';
      }
  };

  // --- POBIERANIE DANYCH ---
  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Tournaments`);
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
    const url = `${API_BASE_URL}/brackets/${tournamentId}`; 

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const matchesArray = Array.isArray(data) ? data : (data.matches || []);
            setTournamentMatches(matchesArray);
        } else {
            setTournamentMatches([]); 
        }
    } catch (err) {
        console.error("Network error while fetching matches:", err);
        setTournamentMatches([]);
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
        const response = await fetch(`${API_BASE_URL}/brackets/generate/${selectedTournament.tournamentId || selectedTournament.id}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Bracket generated successfully!");
            fetchMatches(selectedTournament.tournamentId || selectedTournament.id);
        } else {
            const txt = await response.text();
            alert(`Error: ${txt}`);
        }
    } catch (err) {
        alert("Network error while generating.");
    }
  };

  // --- ROZWIĄZYWANIE SPORU ---
  const handleAdminSubmitScore = async (match) => {
    // ... (Tu jest Twoja logika z poprzedniego pliku, zostawiam bez zmian do momentu scalenia) ...
    // ... Ponieważ kod się uciął w połowie JSX tego fragmentu, zakładam że wkleisz tu swoją logikę ...
    // ... Na razie implementuję tylko brakujące funkcje pomocnicze do listy ...
  };
  
  // --- ZAPISYWANIE (POST/PUT) ---
  const handleSaveTournament = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwt_token");

    const formattedStartDate = tournamentForm.startDate 
        ? new Date(tournamentForm.startDate).toISOString() 
        : new Date().toISOString();

    const formattedEndDate = tournamentForm.endDate 
        ? new Date(tournamentForm.endDate).toISOString() 
        : null;

    const payload = {
        TournamentName: tournamentForm.title,
        GameId: parseInt(tournamentForm.gameId),
        OrganizerId: parseInt(tournamentForm.organizerId || currentAdminId),
        Description: tournamentForm.description,
        MaxParticipants: parseInt(tournamentForm.maxParticipants),
        StartDate: formattedStartDate,
        EndDate: formattedEndDate, 
        ImageUrl: tournamentForm.imageUrl,
        RegistrationType: tournamentForm.registrationType,
    };

    if (isEditing) {
        payload.TournamentId = parseInt(editingId); 
    }

    const url = isEditing 
        ? `${API_BASE_URL}/tournaments/${editingId}`
        : `${API_BASE_URL}/tournaments`;
    
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
        alert(isEditing ? "Tournament updated!" : "Tournament created!");
        resetForm();
        setActiveTab("tournaments");
        fetchTournaments(); 
      } else {
        const text = await response.text();
        console.error("API Error:", text);
        alert(`Error: ${text}`);
      }
    } catch (err) {
      console.error(err);
      alert("Connection error.");
    }
  };

  // --- USUWANIE ---
  const handleDeleteTournament = async (id, e) => {
    e.stopPropagation(); // Zapobiega otwarciu modala przy kliknięciu usuń
    if (!window.confirm("Are you sure you want to delete this tournament?")) return;
    
    const token = localStorage.getItem("jwt_token");
    try {
        const response = await fetch(`${API_BASE_URL}/Tournaments/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Deleted successfully.");
            if (selectedTournament && (selectedTournament.id === id || selectedTournament.tournamentId === id)) {
                setSelectedTournament(null);
            }
            fetchTournaments();
        } else {
            alert("Delete failed.");
        }
    } catch (err) {
        alert("Network error.");
    }
  };

  // --- EDYCJA I RESET ---
  const handleEditClick = (tournament, e) => {
    e.stopPropagation(); // Zapobiega otwarciu modala
    setTournamentForm({
        title: tournament.tournamentName,
        gameId: tournament.gameId,
        organizerId: tournament.organizerId,
        maxParticipants: tournament.maxParticipants,
        startDate: formatDateForInput(tournament.startDate),
        endDate: formatDateForInput(tournament.endDate),
        description: tournament.description || "",
        imageUrl: tournament.imageUrl || "",
        registrationType: tournament.registrationType || "individual",
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
        endDate: "", 
        description: "",
        imageUrl: "",
        registrationType: "individual",
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // --- PRZETWARZANIE LISTY (NOWA FUNKCJA) ---
  const getProcessedTournaments = () => {
      // 1. Dodaj obliczony status
      let processed = tournamentsList.map(t => ({
          ...t,
          calculatedStatus: getTournamentStatus(t.startDate)
      }));

      // 2. Filtrowanie (Search)
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          processed = processed.filter(t => 
              t.tournamentName.toLowerCase().includes(lower)
          );
      }

      // 3. Sortowanie
      processed.sort((a, b) => {
          const dateA = new Date(a.startDate);
          const dateB = new Date(b.startDate);
          const nameA = a.tournamentName.toLowerCase();
          const nameB = b.tournamentName.toLowerCase();

          switch (sortBy) {
              case 'dateDesc': return dateB - dateA;
              case 'dateAsc': return dateA - dateB;
              case 'nameAsc': return nameA.localeCompare(nameB);
              case 'nameDesc': return nameB.localeCompare(nameA);
              default: return 0;
          }
      });

      return processed;
  };

  // --- WIDOK FORMULARZA ---
  const renderForm = () => (
    <div className={styles.tabContent}>
      <h2>{isEditing ? "Edit Tournament" : "Create New Tournament"}</h2>
      <form onSubmit={handleSaveTournament}>
        {/* ... (Twój kod formularza jest OK, wklejam skrócony) ... */}
        <div className={styles.formGroup}>
          <label>Tournament Name</label>
          <input type="text" className={styles.input} required value={tournamentForm.title} onChange={e => setTournamentForm({...tournamentForm, title: e.target.value})} />
        </div>
        
        <div className={styles.formGroup}>
          <label>Image URL</label>
          <input type="text" className={styles.input} value={tournamentForm.imageUrl} onChange={e => setTournamentForm({...tournamentForm, imageUrl: e.target.value})} />
        </div>

        <div className={styles.formGroup}>
          <label>Game</label>
          <select className={styles.select} required value={tournamentForm.gameId} onChange={e => setTournamentForm({...tournamentForm, gameId: e.target.value})}>
            <option value="">-- Select Game --</option>
            {gamesList.map(g => <option key={g.gameId} value={g.gameId}>{g.gameName}</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
            <label>Type</label>
            <select className={styles.select} value={tournamentForm.registrationType} onChange={e => setTournamentForm({...tournamentForm, registrationType: e.target.value})}>
                <option value="individual">Individual</option>
                <option value="team">Team Based</option>
            </select>
        </div>

        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea className={styles.textarea} value={tournamentForm.description} onChange={e => setTournamentForm({...tournamentForm, description: e.target.value})} />
        </div>
        <div className={styles.formGroup}>
          <label>Max Participants</label>
          <input type="number" className={styles.input} value={tournamentForm.maxParticipants} onChange={e => setTournamentForm({...tournamentForm, maxParticipants: e.target.value})} />
        </div>
        
        <div style={{display: 'flex', gap: '20px'}}>
            <div className={styles.formGroup} style={{flex: 1}}>
                <label>Start Date</label>
                <input type="datetime-local" className={styles.input} value={tournamentForm.startDate} onChange={e => setTournamentForm({...tournamentForm, startDate: e.target.value})} />
            </div>
            <div className={styles.formGroup} style={{flex: 1}}>
                <label>End Date</label>
                <input type="datetime-local" className={styles.input} value={tournamentForm.endDate} onChange={e => setTournamentForm({...tournamentForm, endDate: e.target.value})} />
            </div>
        </div>

        <div className={styles.buttonGroup}>
            <button type="submit" className={styles.createBtn}>{isEditing ? "Save Changes" : "Create Tournament"}</button>
            {isEditing && <button type="button" className={styles.cancelBtn} onClick={() => { resetForm(); setActiveTab("tournaments"); }}>Cancel</button>}
        </div>
      </form>
    </div>
  );

  // --- WIDOK LISTY (ZAKTUALIZOWANY O SORT/SEARCH) ---
  const renderList = () => {
    const processedList = getProcessedTournaments();

    return (
        <div className={styles.tournamentListWrapper}>
            {/* Pasek narzędzi: Szukanie i Sortowanie */}
            <div className={styles.filtersBar} style={{display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center'}}>
                <input 
                    type="text" 
                    placeholder="🔍 Search tournaments..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.input}
                    style={{flex: 1, padding: '10px'}}
                />
                
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className={styles.select}
                    style={{width: '200px', padding: '10px'}}
                >
                    <option value="dateAsc">📅 Date: Oldest First</option>
                    <option value="dateDesc">📅 Date: Newest First</option>
                    <option value="nameAsc">🔤 Name: A-Z</option>
                    <option value="nameDesc">🔤 Name: Z-A</option>
                </select>
            </div>

            <div className={styles.tournamentList}>
                {processedList.length === 0 && <p style={{textAlign: 'center', color: '#888'}}>No tournaments found.</p>}
                
                {processedList.map(t => (
                    <div key={t.id || t.tournamentId} className={styles.tournamentItem} onClick={() => setSelectedTournament(t)}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '15px', flex: 1}}>
                            {t.imageUrl && (
                                <img 
                                    src={t.imageUrl} 
                                    alt="Cover" 
                                    style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px'}} 
                                />
                            )}
                            <div>
                                <strong className={styles.itemTitle}>{t.tournamentName}</strong>
                                <div className={styles.itemSubtitle}>
                                    {/* Wyświetlanie typu */}
                                    <span style={{
                                        textTransform: 'uppercase', 
                                        fontSize: '0.7rem', 
                                        background: t.registrationType === 'team' ? '#4f46e5' : '#2563eb',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        marginRight: '8px'
                                    }}>
                                        {t.registrationType === 'team' ? 'TEAM' : 'SOLO'}
                                    </span>
                                    
                                    {/* Wyświetlanie obliczonego statusu */}
                                    <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        color: getCalculatedStatusColor(t.calculatedStatus),
                                        border: `1px solid ${getCalculatedStatusColor(t.calculatedStatus)}`,
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        marginRight: '8px'
                                    }}>
                                        {t.calculatedStatus}
                                    </span>

                                    <span style={{color: '#aaa'}}>
                                        {new Date(t.startDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Akcje Admina (Edycja/Usuwanie) bezpośrednio na liście */}
                        <div className={styles.itemActions} style={{display: 'flex', gap: '10px'}}>
                            <button 
                                onClick={(e) => handleEditClick(t, e)}
                                style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'}}
                                title="Edit"
                            >
                                ✏️
                            </button>
                            <button 
                                onClick={(e) => handleDeleteTournament(t.tournamentId || t.id, e)}
                                style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'}}
                                title="Delete"
                            >
                                🗑️
                            </button>
                            <div className={styles.arrowIcon}>&rsaquo;</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  };

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
                    Tournament List
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
                    onClick={() => { resetForm(); setActiveTab('create'); }}
                >
                    {isEditing ? "Edit Tournament" : "Add Tournament"}
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
                    <div><span>Type:</span> <strong>{selectedTournament.registrationType === 'team' ? 'Team' : 'Individual'}</strong></div>
                    <div><span>Max Participants:</span> <strong>{selectedTournament.maxParticipants}</strong></div>
                    <div><span>Start Date:</span> <strong>{new Date(selectedTournament.startDate).toLocaleString()}</strong></div>
                    {selectedTournament.endDate && (
                        <div><span>End Date:</span> <strong>{new Date(selectedTournament.endDate).toLocaleString()}</strong></div>
                    )}
                </div>

                <div className={styles.bracketSection}>
                    <h3>Bracket Management</h3>
                    
                    {matchesLoading ? (
                        <p style={{textAlign: 'center', color: '#888'}}>Loading matches...</p>
                    ) : (
                        <>
                            {tournamentMatches.length === 0 ? (
                                <div className={styles.generateBox}>
                                    <p>Tournament does not have a bracket generated yet.</p>
                                    <button className={styles.generateBtn} onClick={handleGenerateBracket}>
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
                                        
                                        {tournamentMatches
                                         .sort((a, b) => (b.matchStatus === 'disputed') - (a.matchStatus === 'disputed')) 
                                         .map(match => {
                                            // 1. Nazwy
                                            const p1Name = match.participant1Name || match.teamAName || "Team A";
                                            const p2Name = match.participant2Name || match.teamBName || "Team B";
                                            const p1Id = match.participant1Id || match.teamAId;
                                            const p2Id = match.participant2Id || match.teamBId;

                                            // 2. Pending Results (wyniki zgłoszone przez graczy)
                                            const pending = match.pendingResult || match.PendingResult;
                                            
                                            // Domyślnie bierzemy wynik z bazy (zatwierdzony)
                                            let displayScoreA = match.score1 ?? match.scoreA;
                                            let displayScoreB = match.score2 ?? match.scoreB;
                                            let proofUrl = match.screenshotUrl;

                                            // Nadpisujemy jeśli jest "pending"
                                            if (pending) {
                                                displayScoreA = pending.scoreA ?? pending.participant1Score ?? displayScoreA;
                                                displayScoreB = pending.scoreB ?? pending.participant2Score ?? displayScoreB;
                                                if (pending.screenshotUrl) proofUrl = pending.screenshotUrl;
                                            }

                                            // Kolorowanie wygranego
                                            const isP1Winner = match.winnerId && match.winnerId === p1Id;
                                            const isP2Winner = match.winnerId && match.winnerId === p2Id;

                                            return (
                                                <div key={match.matchId} className={styles.matchCard} style={{borderColor: getStatusColor(match.matchStatus)}}>
                                                    
                                                    <div className={styles.matchHeader}>
                                                        <span style={{color: getStatusColor(match.matchStatus), fontWeight: 'bold', textTransform: 'uppercase'}}>
                                                            {match.matchStatus}
                                                            {pending && match.matchStatus === 'pending' && " (To Verify)"}
                                                        </span>
                                                        <span className={styles.matchId}>Match #{match.matchNumber || match.matchId}</span>
                                                    </div>

                                                    <div className={styles.matchTeams}>
                                                        <div className={isP1Winner ? styles.winner : ''}>
                                                            {p1Name} 
                                                            {(displayScoreA !== null && displayScoreA !== undefined) && (
                                                                <span className={styles.score} style={pending ? {backgroundColor: '#fca311', color: '#000'} : {}}>
                                                                    {displayScoreA}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span>vs</span>
                                                        <div className={isP2Winner ? styles.winner : ''}>
                                                            {p2Name}
                                                            {(displayScoreB !== null && displayScoreB !== undefined) && (
                                                                <span className={styles.score} style={pending ? {backgroundColor: '#fca311', color: '#000'} : {}}>
                                                                    {displayScoreB}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {proofUrl && (
                                                        <div style={{marginTop: '5px', textAlign: 'center'}}>
                                                            <a href={proofUrl} target="_blank" rel="noreferrer" className={styles.proofLink}>
                                                                📷 View Screenshot
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* --- SEKCJA ROZWIĄZYWANIA SPORU (NOWA) --- */}
                                                    {(match.matchStatus === 'disputed' || match.matchStatus === 'pending') && (
                                                        <div style={{ marginTop: "15px", padding: "10px", border: "2px solid red", backgroundColor: "#fff0f0", borderRadius: "6px" }}>
                                                            <h4 style={{color: "red", margin: "0 0 10px 0", fontSize: "0.9rem"}}>⚠️ Admin Override / Solve Dispute</h4>
                                                            
                                                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px", justifyContent: "center" }}>
                                                                {/* Input dla Drużyny A */}
                                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                                    <label style={{ fontSize: "10px", color: "black" }}>{p1Name}</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={adminScoreA}
                                                                        onChange={(e) => setAdminScoreA(e.target.value)}
                                                                        placeholder="0"
                                                                        style={{ padding: "5px", width: "50px", textAlign: "center" }}
                                                                    />
                                                                </div>

                                                                <span style={{ fontWeight: "bold", color: "black" }}>:</span>

                                                                {/* Input dla Drużyny B */}
                                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                                    <label style={{ fontSize: "10px", color: "black" }}>{p2Name}</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={adminScoreB}
                                                                        onChange={(e) => setAdminScoreB(e.target.value)}
                                                                        placeholder="0"
                                                                        style={{ padding: "5px", width: "50px", textAlign: "center" }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div style={{textAlign: "center"}}>
                                                                <button 
                                                                    onClick={() => handleAdminSubmitScore(match)}
                                                                    style={{ 
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
                                         })}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className={styles.adminActions}>
                    <button className={styles.editBtn} onClick={() => handleEditClick(selectedTournament)}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteTournament(selectedTournament.tournamentId || selectedTournament.id)}>Delete</button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPanel;