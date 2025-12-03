import React, { useState, useEffect } from "react";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import styles from "../styles/pages/TeamsPage.module.css";
import AddTeamModal from "../components/AddTeamModal";

function TeamsPage() {
  const initialTeams = [
    {
      name: "Ferrus Knights",
      description: "Drużna aspirujących graczcy.",
      logo: "https://placehold.co/150/000000/FFD700?text=FK",
      players: [
        { userId: 1, username: "Admin" },
        { userId: 2, username: "Player2" },
        { userId: 3, username: "Player3" },
      ],
    },
    {
      name: "E-nsane JSK",
      description: "Nie wiem co tu robię, ale jest fajnie!",
      logo: "https://placehold.co/150/ffffff/5e17eb?text=JSK",
      players: [
        { userId: 4, username: "Player4" },
        { userId: 5, username: "Player5" },
        { userId: 6, username: "Player6" },
        { userId: 7, username: "Player7" },
        { userId: 8, username: "Player8" },
      ],
    },
    {
      name: "HUWDU",
      description: "Najlepsza drużyna pod słońcem.",
      logo: "https://placehold.co/150/330033/FF00FF?text=H",
      players: [
        { userId: 9, username: "Player9" },
        { userId: 10, username: "Player10" },
      ],
    },
  ];

  const [teams, setTeams] = useState(initialTeams);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);

  useEffect(() => {
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

    fetchUsers();
  }, []);

  const handleAddTeam = (newTeamData) => {
    const defaultColor = "999999";

    const newTeam = {
      name: newTeamData.name,
      description: newTeamData.description,
      logo: `https://placehold.co/150/${defaultColor}/FFFFFF?text=${newTeamData.name
        .substring(0, 2)
        .toUpperCase()}`,
      players: newTeamData.players,
    };

    setTeams((prevTeams) => [...prevTeams, newTeam]);
    setIsModalOpen(false);
  };

  const handleRemoveLastTeam = () => {
    if (teams.length > 0) {
      setTeams((prevTeams) => prevTeams.slice(0, -1));
    } else {
      alert("Brak drużyn do usunięcia!");
    }
  };

  return (
    <>
      <TitleBar />
      <div className={styles.mainContent}>
        <Nav />
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>🏆 TEAMS 🏆</h1>
            <div className={styles.headerActions}>
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
            {teams.map((team, index) => (
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
