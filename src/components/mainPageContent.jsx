import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/components/mainPageContent.module.css";
import Modal from "./modal";
import Button from "./Button";
import MyTeamsModal from "./MyTeamsModal";

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
    registrationType,
    tournamentType,
    currentParticipants,
  } = props;

  // --- STANY ---
  const [state, setState] = useState("Upcoming");
  const [timeInfo, setTimeInfo] = useState("");
  
  // Modale
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Logika
  const [isRegistering, setIsRegistering] = useState(false);
  const [myTeams, setMyTeams] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

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

  // --- FUNKCJA 1: POBIERANIE DRUŻYN ---
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
        if (team.captain) {
          allPlayers.push({
            userId: team.captain.userId,
            username: team.captain.username,
            status: "Member",
          });
        }
        if (Array.isArray(team.teamMembers)) {
            team.teamMembers.forEach(member => {
                if(member.user) {
                    allPlayers.push({
                        userId: member.user.userId,
                        username: member.user.username,
                        status: member.status
                    });
                }
            });
        }

        return {
          id: team.teamId,
          name: team.teamName,
          captainId: parseInt(team.captainId, 10),
          logo: team.logoUrl || "https://placehold.co/150",
          players: allPlayers,
          members: allPlayers,
          teamMembers: allPlayers,
          activePlayers: allPlayers.filter(p => p.status === "Member") 
        };
      });

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

    const type = String(registrationType || "").toLowerCase();

    if (type === "team") {
        await fetchAndFilterUserTeams();
    } else {
        registerUserToTournament();
    }
  };

  // --- FUNKCJA 3: API REJESTRACJI INDYWIDUALNEJ ---
  const registerUserToTournament = async () => {
    setIsRegistering(true);
    const token = localStorage.getItem("jwt_token");
    try {
      const response = await fetch(
        `${API_BASE_URL}/TournamentRegistration/${tournamentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const responseText = await response.text();

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
    const url = `${API_BASE_URL}/TeamTournamentRegistration/register/${tournamentId}/${teamId}`;

    try {
      const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const responseText = await response.text();

      if (response.ok) {
        alert("✅ Sukces! Twoja drużyna została zapisana na turniej.");
        setIsTeamModalOpen(false);
        handleCloseDetailsModal();
      } else {
        let errorMsg = responseText;
        try {
            const errData = JSON.parse(responseText);
            errorMsg = errData.message || errData.detail || errorMsg;
        } catch(e) { }
        alert(`❌ Błąd rejestracji: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Błąd połączenia z serwerem.");
    } finally {
      setIsRegistering(false);
    }
  };

  // --- DATY I STATUSY (Zmieniona logika) ---
  useEffect(() => {
    if (!startDate) return;
    
    // Normalizacja daty dzisiejszej (tylko rok-miesiąc-dzień)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Normalizacja daty startu turnieju
    const tournamentStartDate = new Date(startDate);
    tournamentStartDate.setHours(0, 0, 0, 0);

    // LOGIKA: 
    // Data startu > dzisiaj -> Upcoming
    // Data startu == dzisiaj -> Ongoing
    // Data startu < dzisiaj -> Completed (Ended)
    // EndDate jest całkowicie ignorowany dla statusu.

    if (tournamentStartDate > today) {
      setState("Upcoming");
    } else if (tournamentStartDate.getTime() === today.getTime()) {
      setState("Ongoing");
    } else {
      setState("Completed");
    }
  }, [startDate]);

  // Ustawienie etykiety czasu
  useEffect(() => {
    if (!startDate) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tournamentStartDate = new Date(startDate);
    tournamentStartDate.setHours(0, 0, 0, 0);

    if (state === "Upcoming") {
      const diffTime = tournamentStartDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) setTimeInfo("Launches Tomorrow"); // Jeśli różnica to 1 dzień
      else if (diffDays <= 31) setTimeInfo(`Launches in ${diffDays} days`);
      else setTimeInfo(`Launches at ${new Date(startDate).toLocaleDateString()}`);
    } 
    else if (state === "Ongoing") {
      setTimeInfo("Happening Today!");
    } 
    else if (state === "Completed") {
      setTimeInfo("Ended");
    }
  }, [state, startDate]);

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
            <Button
              name={isRegistering ? "Processing..." : "Register"}
              className={styles.registrationButton}
              onClick={handleRegisterClick}
              disabled={isRegistering || state === "Completed"}
            />
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