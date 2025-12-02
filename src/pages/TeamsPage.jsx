import React, { useState, useEffect } from "react";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import styles from "../styles/pages/TeamsPage.module.css";
import AddTeamModal from "../components/AddTeamModal";

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        "https://projektturniej.onrender.com/api/users"
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
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
      const teamsResponse = await fetch(
        "https://projektturniej.onrender.com/api/teams"
      );
      if (!teamsResponse.ok) {
        throw new Error("Błąd podczas pobierania wszystkich drużyn");
      }
      const allTeamsData = await teamsResponse.json();

      const mappedTeams = allTeamsData.map((team) => ({
        name: team.teamName,
        description: team.description,
        logo:
          team.logoUrl ||
          `https://placehold.co/150/999999/FFFFFF?text=${team.teamName
            .substring(0, 2)
            .toUpperCase()}`,
        players: [
          {
            userId: team.captain.userId,
            username: team.captain.username,
            avatarUrl: team.captain.avatarUrl,
          },
        ],
      }));

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

    console.log("Dane do wysłania do API:", newTeam);

    const token = localStorage.getItem("jwt_token");
    fetch("https://projektturniej.onrender.com/api/Teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newTeam),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(
              err.message || "Nieznany błąd rejestracji drużyny."
            );
          });
        }
        return response.json();
      })
      .then((addedTeam) => {
        console.log("Drużyna zarejestrowana pomyślnie:", addedTeam);
        setIsModalOpen(false);
        fetchAllTeams();
      })
      .catch((error) => {
        console.error("Błąd dodawania drużyny:", error.message);
        alert(`Błąd dodawania drużyny: ${error.message}`);
      });
  };

  const handleRemoveLastTeam = () => {
    if (teams.length > 0) {
      setTeams((prevTeams) => prevTeams.slice(0, -1));
    } else {
      alert("Brak drużyn do usunięcia!");
    }
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
              >
                ➕ Add Team
              </button>
              <button
                className={styles.removeHeaderButton}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLastTeam();
                }}
                title="Remove Last Team"
              >
                ➖ Remove Last
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
