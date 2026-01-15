import React, { useState, useEffect } from "react";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import Modal from "../components/modal";
import styles from "../styles/pages/adminPanel.module.css";

// --- ZMIANA IMPORTU TUTAJ ---
// Zamiast TournamentList, importujemy wersję admina:
import AdminTournamentList from "../components/AdminTournamentList"; 

import TournamentForm from "../components/TournamentForm";
import TournamentDetailsModal from "../components/TournamentDetailsModal";
import { parseJwt, formatDateForInput } from "../components/adminHelpers"; 

const API_BASE_URL = "https://projektturniej.onrender.com/api";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("tournaments");
  
  // ID zalogowanego admina
  const [currentAdminId, setCurrentAdminId] = useState(null);
  
  // Dane list
  const [tournamentsList, setTournamentsList] = useState([]);
  const [gamesList, setGamesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Wyszukiwanie i Sortowanie
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateAsc");

  // Modal i mecze
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentMatches, setTournamentMatches] = useState([]); 
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Wyniki admina
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

  // --- USE EFFECTS ---
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

    if (token) {
        const decoded = parseJwt(token);
        const adminId = decoded?.nameid || decoded?.id || decoded?.userId;
        if (adminId) {
            setCurrentAdminId(adminId);
            setTournamentForm(prev => ({ ...prev, organizerId: adminId }));
        }
    }
  }, []);

  useEffect(() => {
    if (activeTab === "tournaments") fetchTournaments();
    fetchGames();
  }, [activeTab]);

  useEffect(() => {
    if (selectedTournament) {
        fetchMatches(selectedTournament.tournamentId || selectedTournament.id);
        // Reset admin scores when opening new modal
        setAdminScoreA("");
        setAdminScoreB("");
    }
  }, [selectedTournament]);

  // --- API CALLS ---
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

  // --- HANDLERS ---
  const handleAdminSubmitScore = async (match) => {
    if (adminScoreA === "" || adminScoreB === "") {
        alert("Please enter scores for both teams.");
        return;
    }
    const token = localStorage.getItem("jwt_token");
    console.log("Submitting admin score:", adminScoreA, adminScoreB, "for match:", match.matchId);
    alert("Functionality pending: Paste logic from your previous file here.");
  };

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

  const handleDeleteTournament = async (id, e) => {
    // 1. Zatrzymanie kliknięcia w tło (żeby nie otwierało szczegółów)
    if (e) e.stopPropagation(); 
    
    // 2. Potwierdzenie
    if (!window.confirm("Czy na pewno chcesz usunąć ten turniej?")) return;
    
    // 3. Pobranie poprawnego tokenu
    const token = localStorage.getItem("jwt_token");

    try {
        const response = await fetch(`${API_BASE_URL}/Tournaments/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Usunięto pomyślnie.");

            // --- TUTAJ JEST ZMIANA, KTÓRA ODŚWIEŻA LISTĘ NATYCHMIAST ---
            // Zamiast fetchTournaments(), usuwamy element z obecnego stanu:
            setTournamentsList(currentList => 
                currentList.filter(t => t.tournamentId !== id && t.id !== id)
            );

            // Jeśli usunięty turniej był akurat wybrany/otwarty, czyścimy wybór
            if (selectedTournament && (selectedTournament.id === id || selectedTournament.tournamentId === id)) {
                setSelectedTournament(null);
            }

        } else {
            alert("Nie udało się usunąć turnieju (błąd serwera).");
        }
    } catch (err) {
        console.error(err);
        alert("Błąd sieci.");
    }
  };

  

  const handleEditClick = (tournament, e) => {
    if (e) e.stopPropagation();
    
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
    
    setSelectedTournament(null); // Zamknij modal jeśli otwarty
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

            {activeTab === 'tournaments' && (
    <AdminTournamentList
        tournaments={tournamentsList}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onSelect={setSelectedTournament}
        onEdit={handleEditClick}
        onDelete={handleDeleteTournament}
    />
)}

            {activeTab === 'create' && (
                <TournamentForm 
                    formData={tournamentForm}
                    setFormData={setTournamentForm}
                    onSubmit={handleSaveTournament}
                    onCancel={() => { resetForm(); setActiveTab("tournaments"); }}
                    gamesList={gamesList}
                    isEditing={isEditing}
                />
            )}

        </main>
      </div>

      {selectedTournament && (
        <Modal onClose={() => setSelectedTournament(null)}>
            <TournamentDetailsModal 
                tournament={selectedTournament}
                matches={tournamentMatches}
                matchesLoading={matchesLoading}
                onGenerateBracket={handleGenerateBracket}
                onEdit={handleEditClick}
                onDelete={handleDeleteTournament}
                // Propsy sporne
                adminScoreA={adminScoreA}
                setAdminScoreA={setAdminScoreA}
                adminScoreB={adminScoreB}
                setAdminScoreB={setAdminScoreB}
                onSubmitScore={handleAdminSubmitScore}
            />
        </Modal>
      )}
    </div>
  );
};

export default AdminPanel;