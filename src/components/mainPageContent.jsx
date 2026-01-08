import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/components/mainPageContent.module.css";
import Modal from "./modal";
import Button from "./Button";
import MyTeamsModal from "./MyTeamsModal"; // Upewnij się, że ścieżka importu jest poprawna

// ADRES BACKENDU - Używamy pełnego adresu, aby uniknąć błędów 404 na localhost
const API_BASE_URL = "https://projektturniej.onrender.com/api";

function MainPageContent(props) {
  const navigate = useNavigate();

  const {
    tournamentId,
    title,
    description,
    baner,
    startDate,
    endDate,
    location,
    rules,
    maxParticipants,
    registrationType, // To pole decyduje czy rejestracja jest "team" czy inna
    tournamentType,
    currentParticipants,
  } = props;

  // --- STANY ---
  const [state, setState] = useState("Upcoming");
  const [timeInfo, setTimeInfo] = useState("");
  
  // Modale
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); // Modal ze szczegółami turnieju
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);       // Modal wyboru drużyny

  // Logika
  const [isRegistering, setIsRegistering] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const safeEndDate = endDate ? endDate : startDate;

  // 1. Pobranie ID zalogowanego użytkownika
  useEffect(() => {
    const storedUserId = localStorage.getItem("currentUserId");
    if (storedUserId) {
      setCurrentUserId(parseInt(storedUserId, 10));
    }
  }, []);

  // --- HANDLERY MODALI ---
  const handleOpenDetailsModal = () => setIsDetailsModalOpen(true);
  const handleCloseDetailsModal = () => setIsDetailsModalOpen(false);

  // --- FUNKCJA 1: POBIERANIE DRUŻYN (Dla rejestracji zespołowej) ---
  const fetchAndFilterUserTeams = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`);
      if (!response.ok) throw new Error("Failed to fetch teams");
      
      const allTeamsData = await response.json();
      
      const storedUserId = localStorage.getItem("currentUserId");
      if(!storedUserId) return;
      const myId = parseInt(storedUserId, 10);

      const mappedTeams = allTeamsData.map((team) => {
        const allPlayers = [];
        
        // Dodaj kapitana
        if (team.captain) {
          allPlayers.push({
            userId: team.captain.userId,
            username: team.captain.username,
            status: "Member",
          });
        }
        
        // Dodaj członków
        if (Array.isArray(team.teamMembers)) {
            team.teamMembers.forEach(member => {
                if(member.user) {
                    allPlayers.push({
                        userId: member.user.userId,
                        username: member.user.username,
                        status: member.status // np. "Pending", "Member"
                    });
                }
            });
        }

        // --- TU BYŁ PROBLEM ---
        // Twój MyTeamsModal prawdopodobnie szuka pola 'members' lub 'teamMembers'
        // Przekazujemy tablicę pod kilkoma nazwami, żeby na pewno zadziałało
        return {
          id: team.teamId,
          name: team.teamName,
          captainId: parseInt(team.captainId, 10),
          logo: team.logoUrl || "https://placehold.co/150",
          
          players: allPlayers,      // Nazwa używana w poprzednim kodzie
          members: allPlayers,      // Częsta nazwa w modalach
          teamMembers: allPlayers,  // Oryginalna nazwa z backendu
          
          // Dodatkowe zabezpieczenie: filtrowanie tylko aktywnych członków
          activePlayers: allPlayers.filter(p => p.status === "Member") 
        };
      });

      // Filtrowanie drużyn użytkownika
      const userTeams = mappedTeams.filter(t => 
        t.players.some(p => p.userId === myId)
      );

      setMyTeams(userTeams);
      setIsTeamModalOpen(true); 

    } catch (error) {
      console.error("Error fetching teams:", error);
      alert("Nie udało się pobrać listy Twoich drużyn.");
    }
  };

  // --- FUNKCJA 2: KLIKNIĘCIE "REGISTER" ---
  const handleRegisterClick = async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      alert("You need to be logged in to register!");
      return;
    }

    // Sprawdzamy typ rejestracji (ignorując wielkość liter)
    const type = String(registrationType || "").toLowerCase();
    console.log("Typ rejestracji:", type);

    if (type === "team") {
        // Ścieżka drużynowa: Pobierz drużyny -> Wyświetl modal
        await fetchAndFilterUserTeams();
    } else {
        // Ścieżka indywidualna: Rejestruj od razu
        registerUserToTournament();
    }
  };

  // --- FUNKCJA 3: API REJESTRACJI INDYWIDUALNEJ ---
  const registerUserToTournament = async () => {
    setIsRegistering(true);
    const token = localStorage.getItem("jwt_token");
    try {
      const response = await fetch(
        `${API_BASE_URL}/TournamentRegistration/${tournamentId}`, // Pełny URL
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const responseText = await response.text(); // Czytamy raz jako tekst

      if (response.ok) {
        alert("Success! You have been registered.");
        handleCloseDetailsModal();
      } else {
        alert(`Registration failed: ${responseText}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Connection error.");
    } finally {
      setIsRegistering(false);
    }
  };

  // --- FUNKCJA 4: WYBÓR DRUŻYNY W MODALU ---
  const handleTeamSelected = async (selectedTeam) => {
    if (selectedTeam.captainId !== currentUserId) {
        alert("⛔ Tylko kapitan może zapisać drużynę na turniej!");
        return;
    }
    registerTeamToTournament(selectedTeam.id);
  };

  // --- FUNKCJA 5: API REJESTRACJI DRUŻYNOWEJ ---
  const registerTeamToTournament = async (teamId) => {
    setIsRegistering(true);
    const token = localStorage.getItem("jwt_token");
    
    // Budujemy nowy URL zgodnie z instrukcją:
    // /api/TeamTournamentRegistration/register/{tournamentId}/{teamId}
    const url = `${API_BASE_URL}/TeamTournamentRegistration/register/${tournamentId}/${teamId}`;

    try {
      const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // Body może być puste, bo dane są w URL, ale wysyłamy pusty obiekt {}
          // żeby nagłówek Content-Type: application/json nie sprawiał problemów.
          body: JSON.stringify({}),
        }
      );

      // Czytamy odpowiedź (tekst lub json)
      const responseText = await response.text();

      if (response.ok) {
        alert("✅ Sukces! Twoja drużyna została zapisana na turniej.");
        setIsTeamModalOpen(false);
        handleCloseDetailsModal();
      } else {
        // Obsługa błędów (np. "Brak miejsc", "Nie jesteś kapitanem")
        let errorMsg = responseText;
        try {
            const errData = JSON.parse(responseText);
            errorMsg = errData.message || errData.detail || errorMsg;
        } catch(e) { /* to nie był JSON */ }

        alert(`❌ Błąd rejestracji: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Błąd połączenia z serwerem.");
    } finally {
      setIsRegistering(false);
    }
  };

  // --- DATY I STATUSY ---
  useEffect(() => {
    if (!startDate) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tournamentStartDate = new Date(startDate);
    const tournamentEndDate = new Date(safeEndDate);

    if (tournamentStartDate > today) {
      setState("Upcoming");
    } else if (tournamentEndDate < today) {
      setState("Completed");
    } else {
      setState("Ongoing");
    }
  }, [startDate, safeEndDate]);

  useEffect(() => {
    if (!startDate) return;
    const today = new Date();

    if (state === "Upcoming") {
      const diffTime = new Date(startDate) - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) setTimeInfo("Launches Today");
      else if (diffDays === 1) setTimeInfo("Launches Tomorrow");
      else if (diffDays <= 31) setTimeInfo(`Launches in ${diffDays} days`);
      else
        setTimeInfo(`Launches at ${new Date(startDate).toLocaleDateString()}`);
    } else if (state === "Ongoing") {
      setTimeInfo("Ongoing");
    } else if (state === "Completed") {
      setTimeInfo("Ended");
    }
  }, [state, startDate, safeEndDate]);

  return (
    <>
      {/* TILE ON MAIN PAGE */}
      <div className={styles.container} onClick={handleOpenDetailsModal}>
        <div className={styles.bannerWrapper}>
          <img
            src={baner || "https://placehold.co/600x400?text=No+Image"}
            alt="Tournament Banner"
            className={styles.banner}
          />
        </div>

        <div className={styles.contentWrapper}>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.timeInfo}>{timeInfo}</div>
          <ul className={styles.list}>
            <li>
              <strong>Location:</strong> <span>{location}</span>
            </li>
            <li>
              <strong>Max Participants:</strong> <span>{maxParticipants}</span>
            </li>
            <li>
              <strong>Registration Type:</strong>{" "}
              <span>{registrationType}</span>
            </li>
            <li>
              <strong>State:</strong> <span>{state}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* MODAL SZCZEGÓŁÓW */}
      {isDetailsModalOpen && (
        <Modal onClose={handleCloseDetailsModal}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <img
            src={baner || "https://placehold.co/600x400?text=No+Image"}
            alt="Tournament Banner"
            className={styles.modalBanner}
          />
          <p className={styles.modalDescription}>
            {description || "Brak opisu."}
          </p>

          <ul className={styles.modalList}>
            <li>
              <strong>Localization:</strong> <span>{location}</span>
            </li>
            <li>
              <strong>Start Date:</strong>{" "}
              <span>{new Date(startDate).toLocaleDateString()}</span>
            </li>
            <li>
              <strong>End Date:</strong>{" "}
              <span>
                {endDate ? new Date(endDate).toLocaleDateString() : "TBA"}
              </span>
            </li>
            <li>
              <strong>Rules:</strong>{" "}
              <span>{rules || "Standard rules apply."}</span>
            </li>
            <li>
              <strong>Participants:</strong>{" "}
              <span>
                {currentParticipants} / {maxParticipants}
              </span>
            </li>
            <li>
              <strong>Registration Type:</strong>{" "}
              <span>{registrationType}</span>
            </li>
            <li>
              <strong>Tournament Type:</strong> <span>{tournamentType}</span>
            </li>
            <li>
              <strong>State:</strong> <span>{state}</span>
            </li>
          </ul>

          <div className={styles.modalActions}>
            {/* REGISTER BUTTON */}
            <Button
              name={isRegistering ? "Processing..." : "Register"}
              className={styles.registrationButton}
              onClick={handleRegisterClick}
              disabled={isRegistering || state === "Completed"}
            />

            {/* BRACKET BUTTON */}
            <Button
              name="See Bracket"
              className={styles.registrationButton}
              onClick={() => navigate(`/tournament/${tournamentId}/bracket`)}
            />
          </div>
        </Modal>
      )}

      {/* MODAL WYBORU DRUŻYNY */}
      {isTeamModalOpen && (
          <MyTeamsModal 
            teams={myTeams}
            currentUserId={currentUserId}
            onClose={() => setIsTeamModalOpen(false)}
            onSelectTeam={handleTeamSelected}
          />
      )}
    </>
  );
}

export default MainPageContent;