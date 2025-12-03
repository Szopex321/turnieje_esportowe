import React, { useState, useEffect } from "react";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import styles from "../styles/pages/TeamsPage.module.css";
import AddTeamModal from "../components/AddTeamModal";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const simplifiedUsers = data.map((user) => ({
        userId: user.userId,
        username: user.username,
        avatarUrl: user.avatarUrl,
      }));

      setAvailableUsers(simplifiedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchAllTeams = async () => {
    try {
      const teamsResponse = await fetch(`${API_BASE_URL}/teams`);
      if (!teamsResponse.ok)
        throw new Error("Błąd podczas pobierania wszystkich drużyn");

      const allTeamsData = await teamsResponse.json();

      const mappedTeams = allTeamsData.map((team) => {
        const allPlayers = [];

        if (team.captain) {
          allPlayers.push({
            userId: team.captain.userId,
            username: team.captain.username,
            avatarUrl: team.captain.avatarUrl,
            isCaptain: true,
          });
        }

        if (Array.isArray(team.members)) {
          allPlayers.push(
            ...team.members.map((member) => ({
              userId: member.userId,
              username: member.username,
              avatarUrl: member.avatarUrl,
              isCaptain: false,
            }))
          );
        }

        return {
          id: team.teamId,
          name: team.teamName,
          description: team.description,
          logo:
            team.logoUrl ||
            `https://placehold.co/150/999999/FFFFFF?text=${team.teamName
              .substring(0, 2)
              .toUpperCase()}`,
          players: allPlayers,
        };
      });

      setTeams(mappedTeams);
    } catch (error) {
      console.error("Błąd podczas pobierania drużyn:", error);
      setTeams([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAllTeams();
  }, []);

  const handleOpenAddTeamModal = () => {
    const token = localStorage.getItem("jwt_token");

    if (!token) {
      alert(
        "⚠️ Nie możesz utworzyć drużyny bez zalogowania. Zaloguj się, aby kontynuować."
      );
      return;
    }

    setIsModalOpen(true);
  };

  const handleAddTeam = (newTeamData) => {
    const MOCK_TOURNAMENT_ID = 1;

    const newTeam = {
      teamName: newTeamData.name,
      description: newTeamData.description,
      captainId: newTeamData.players[0]?.userId,
      memberIds: newTeamData.players
        .map((p) => p.userId)
        .filter((id, index) => index !== 0),
      tournamentId: MOCK_TOURNAMENT_ID,
    };

    const token = localStorage.getItem("jwt_token");

    fetch(`${API_BASE_URL}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newTeam),
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "401 Unauthorized: Brak uprawnień lub wygasła sesja. Zaloguj się ponownie."
            );
          }

          let errorText = `Błąd (${response.status}): Serwer nie zwrócił treści błędu.`;
          const contentType = response.headers.get("content-type");

          if (contentType?.includes("application/json")) {
            try {
              const errorData = await response.json();
              errorText = errorData.message || JSON.stringify(errorData);
            } catch (e) {
              errorText = `Błąd (${response.status}): Błąd parsowania odpowiedzi serwera.`;
            }
          }
          throw new Error(errorText);
        }
        return response.json();
      })
      .then(() => {
        setIsModalOpen(false);
        fetchAllTeams();
      })
      .catch((error) => {
        console.error("Błąd dodawania drużyny:", error.message);
        alert(`Błąd dodawania drużyny: ${error.message}`);
      });
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <TitleBar />
      <div className={styles.mainContent}>
        <Nav />
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>🏆 TEAMS 🏆</h1>
            <div className={styles.headerActions}>
              <input
                type="text"
                placeholder="Szukaj drużyn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <button
                className={styles.addButton}
                type="button"
                onClick={handleOpenAddTeamModal}
              >
                ➕ Add Team
              </button>
            </div>
          </div>

          <div className={styles.teamGrid}>
            {filteredTeams.length === 0 && searchTerm === "" && (
              <p>Brak drużyn do wyświetlenia.</p>
            )}
            {filteredTeams.length === 0 && searchTerm !== "" && (
              <p>Brak drużyn pasujących do "{searchTerm}".</p>
            )}

            {filteredTeams.map((team, index) => (
              <div key={index} className={styles.cardWrapper}>
                <div className={styles.teamCard}>
                  <div className={styles.cardBackground}></div>
                  <div className={styles.cardContent}>
                    <div className={styles.logoWrapper}>
                      <img
                        src={team.logo}
                        alt={team.name}
                        className={styles.teamLogo}
                      />
                    </div>
                    <h2 className={styles.teamName}>{team.name}</h2>
                    <span className={styles.status}>{team.description}</span>
                  </div>
                </div>

                <div className={styles.playersSidebar}>
                  {team.players.map((player, i) => (
                    <div key={i} className={styles.playerAvatar}>
                      <img
                        src={
                          player.avatarUrl ||
                          `https://i.pravatar.cc/150?u=${player.userId}`
                        }
                        alt={player.username}
                        className={styles.playerAvatar}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddTeamModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddTeam}
          availableUsers={availableUsers}
        />
      )}
    </>
  );
}

export default TeamsPage;
