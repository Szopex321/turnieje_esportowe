import React from "react";
import styles from "../styles/components/MyTeamsModal.module.css";

const MyTeamsModal = ({ teams, currentUserId, onClose, onSelectTeam }) => {
  const myTeams = teams.filter((team) => {
    const userInTeam = team.players.find((p) => p.userId === currentUserId);
    if (!userInTeam) return false;
    return userInTeam.status !== "Pending";
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>MY TEAMS</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {myTeams.length === 0 ? (
            <p className={styles.empty}>You don't belong to any team yet.</p>
          ) : (
            myTeams.map((team) => (
              <div
                key={team.id}
                className={styles.teamItem}
                onClick={() => {
                  onSelectTeam(team);
                  onClose();
                }}
              >
                <img src={team.logo} alt="logo" className={styles.teamLogo} />
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>{team.name}</span>
                  <span className={styles.roleText}>
                    {team.captainId === currentUserId
                      ? "👑 Captain"
                      : "👤 Member"}
                  </span>
                </div>
                <div className={styles.memberCount}>
                  {team.activePlayers.length} players
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTeamsModal;
