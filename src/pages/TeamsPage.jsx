/* eslint-disable no-irregular-whitespace */
import React, { useState, useEffect } from "react";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import styles from "../styles/pages/TeamsPage.module.css";
import AddTeamModal from "../components/AddTeamModal";
import TeamDetailsModal from "../components/TeamDetailsModal";

// IMPORT TWOJEGO AWATARA Z ASSETS
import defaultAvatar from "../assets/deafultAvatar.jpg";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

const TEAM_COLORS = [
  "#FFD700",
  "#1E90FF",
  "#00FF7F",
  "#FF6347",
  "#DA70D6",
  "#FFA500",
  "#B0C4DE",
  "#FF4500",
  "#ADFF2F",
];

function TeamsPage({ user, onNotificationsRefresh }) {
  const [teams, setTeams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Funkcja pomocnicza do sprawdzania czy URL awatara jest poprawny
  const getValidAvatar = (url) => {
    if (!url || url === "string" || url.includes("pravatar.cc")) {
      return defaultAvatar;
    }
    return url;
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const simplifiedUsers = data.map((user) => ({
        userId: user.userId,
        username: user.username,
        avatarUrl: getValidAvatar(user.avatarUrl),
      }));
      setAvailableUsers(simplifiedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchAllTeams = async () => {
    try {
      const teamsResponse = await fetch(`${API_BASE_URL}/teams`);
      if (!teamsResponse.ok) {
        console.error("Błąd serwera (500) lub inny:", teamsResponse.status);
        throw new Error("Błąd podczas pobierania wszystkich drużyn");
      }
      const allTeamsData = await teamsResponse.json();
      const mappedTeams = allTeamsData.map((team, index) => {
        const allPlayers = [];
        const addedUserIds = new Set();

        if (team.captain) {
          allPlayers.push({
            userId: team.captain.userId,
            username: team.captain.username || "Nieznany",
            avatarUrl: getValidAvatar(team.captain.avatarUrl),
            isCaptain: true,
            status: "Member",
          });
          addedUserIds.add(team.captain.userId);
        }

        const membersList = team.teamMembers || [];
        if (Array.isArray(membersList)) {
          membersList.forEach((member) => {
            const userData = member.user;
            if (userData && !addedUserIds.has(userData.userId)) {
              allPlayers.push({
                userId: userData.userId,
                username: userData.username || "Brak nicku",
                avatarUrl: getValidAvatar(userData.avatarUrl),
                isCaptain: false,
                status: member.status,
              });
              addedUserIds.add(userData.userId);
            }
          });
        }

        const activeMembers = allPlayers.filter(
          (p) => p.isCaptain || p.status === "Member"
        );

        return {
          id: team.teamId,
          name: team.teamName,
          description: team.description,
          captainId: parseInt(team.captainId, 10),
          teamColor: team.color || TEAM_COLORS[index % TEAM_COLORS.length],
          logo:
            team.logoUrl ||
            `https://placehold.co/150/999999/FFFFFF?text=${(
              team.teamName || "T"
            )
              .substring(0, 2)
              .toUpperCase()}`,
          players: allPlayers,
          activePlayers: activeMembers,
          activeMembersCount: activeMembers.length,
        };
      });
      setTeams(mappedTeams);
    } catch (error) {
      console.error("Błąd podczas pobierania drużyn:", error);
      setTeams([]);
    }
  };

  const handleUpdateTeamLogo = (teamId, newLogoUrl) => {
    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === teamId ? { ...team, logo: newLogoUrl } : team
      )
    );
    setSelectedTeam((prevSelectedTeam) => {
      if (prevSelectedTeam && prevSelectedTeam.id === teamId) {
        return { ...prevSelectedTeam, logo: newLogoUrl };
      }
      return prevSelectedTeam;
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchAllTeams();
  }, []);

  const handleOpenAddTeamModal = () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      alert("⚠️ Nie możesz utworzyć drużyny bez zalogowania.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleOpenTeamDetails = (team) => {
    setSelectedTeam(team);
    setIsDetailsModalOpen(true);
  };

  const handleJoinTeam = async (teamId) => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      alert("Musisz być zalogowany, aby dołączyć.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/teams/${teamId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        alert("✅ Prośba o dołączenie wysłana! Czekaj na akceptację kapitana.");
        if (onNotificationsRefresh) onNotificationsRefresh();
      } else {
        let errorMessage = `Błąd (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Błąd dołączania:", error);
      alert(`Błąd: ${error.message}`);
    } finally {
      setIsDetailsModalOpen(false);
      fetchAllTeams();
    }
  };

  const filteredTeams = teams.filter((team) =>
    (team.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <TitleBar />
      <div className={styles.mainContent}>
        <Nav />
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Teams</h1>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className={styles.addButton}
                onClick={handleOpenAddTeamModal}
              >
                ➕ Add Team
              </button>
            </div>
          </div>

          <div className={styles.teamGrid}>
            {filteredTeams.map((team, index) => (
              <div
                key={team.id || index}
                className={styles.cardWrapper}
                onClick={() => handleOpenTeamDetails(team)}
                style={{
                  "--team-color": team.teamColor,
                }}
              >
                <div className={styles.teamCard}>
                  <div className={styles.cardBackground}></div>
                  <div className={styles.cardContent}>
                    <div className={styles.logoWrapper}>
                      <img
                        src={team.logo}
                        alt={`${team.name} logo`}
                        className={styles.teamLogo}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://placehold.co/150/999999/FFFFFF?text=${(
                            team.name || "T"
                          )
                            .substring(0, 2)
                            .toUpperCase()}`;
                        }}
                      />
                    </div>
                    <h3 className={styles.teamName}>{team.name}</h3>
                    <p className={styles.description}>
                      {team.description || "Brak opisu"}
                    </p>
                  </div>
                </div>

                <div className={styles.playersSidebar}>
                  {team.activePlayers && team.activePlayers.length > 0 ? (
                    team.activePlayers.slice(0, 6).map((player, pIndex) => (
                      <div key={pIndex} className={styles.playerAvatar}>
                        <img
                          src={getValidAvatar(player.avatarUrl)}
                          alt={player.username}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultAvatar;
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    // Fallback dla kapitana jeśli lista aktywnych jest pusta
                    <div className={styles.playerAvatar}>
                      <img src={defaultAvatar} alt="No players" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddTeamModal
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            fetchAllTeams();
            if (onNotificationsRefresh) onNotificationsRefresh();
            setIsModalOpen(false);
          }}
          availableUsers={availableUsers}
        />
      )}

      {isDetailsModalOpen && selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          onClose={(newLogoUrl) => {
            setIsDetailsModalOpen(false);
            if (newLogoUrl && newLogoUrl !== selectedTeam.logo) {
              handleUpdateTeamLogo(selectedTeam.id, newLogoUrl);
            } else {
              fetchAllTeams();
            }
          }}
          onJoin={handleJoinTeam}
          onRefresh={fetchAllTeams}
          onNotificationsRefresh={onNotificationsRefresh}
          onLogoUpdate={handleUpdateTeamLogo}
        />
      )}
    </>
  );
}

export default TeamsPage;
