import React, { useState, useEffect } from "react";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import Modal from "../components/modal";
import styles from "../styles/pages/adminPanel.module.css";

// Komponenty
import AdminTournamentList from "../components/AdminTournamentList"; 
import TournamentForm from "../components/TournamentForm";
import TournamentDetailsModal from "../components/TournamentDetailsModal";

// Helpery
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
        try {
            const user = JSON.parse(userJson);
            if (user.role === 'admin' || user.role === 'Admin') isUserAdmin = true;
        } catch (e) { console.error("Error parsing user JSON", e); }
    }

    if (!token || !isUserAdmin) {
        window.location.href = "/"; 
        return;
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

  // Pobieranie meczów po otwarciu modala
  useEffect(() => {
    if (selectedTournament) {
        fetchMatches(selectedTournament.tournamentId || selectedTournament.id);
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
      const response = await fetch('/api/games'); // Upewnij się, że ścieżka jest poprawna (często to jest API_BASE_URL)
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
            // Obsługa różnych struktur zwracanych przez API (tablica lub obiekt z polem matches)
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
    const tId = selectedTournament.tournamentId || selectedTournament.id;

    try {
        const response = await fetch(`${API_BASE_URL}/brackets/generate/${tId}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            alert("Bracket generated successfully!");
            fetchMatches(tId);
        } else {
            const txt = await response.text();
            alert(`Error: ${txt}`);
        }
    } catch (err) {
        alert("Network error while generating.");
    }
  };

  // --- HANDLERS ---

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
    if (e) e.stopPropagation(); 
    if (!window.confirm("Czy na pewno chcesz usunąć ten turniej?")) return;
    
    const token = localStorage.getItem("jwt_token");

    try {
        const response = await fetch(`${API_BASE_URL}/Tournaments/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
            // Aktualizacja stanu lokalnego (szybsze niż ponowny fetch)
            setTournamentsList(currentList => 
                currentList.filter(t => t.tournamentId !== id && t.id !== id)
            );

            // Jeśli usunięty turniej był otwarty w modalu -> zamknij go
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
                // Nowy prop: funkcja odświeżająca mecze po interwencji admina
                onRefresh={() => fetchMatches(selectedTournament.tournamentId || selectedTournament.id)}
            />
        </Modal>
      )}
    </div>
  );
};

export default AdminPanel;