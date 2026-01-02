import React from "react";
import styles from "../styles/components/MyTeamsModal.module.css";

const MyTeamsModal = ({ teams, currentUserId, onClose, onSelectTeam }) => {
  // Filtrowanie drużyn, w których jesteś członkiem lub kapitanem
  const myTeams = teams.filter((team) =>
    team.players.some((p) => p.userId === currentUserId)
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>MOJE DRUŻYNY</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {myTeams.length === 0 ? (
            <p className={styles.empty}>
              Nie należysz jeszcze do żadnej drużyny.
            </p>
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
                      ? "👑 Kapitan"
                      : "👤 Członek"}
                  </span>
                </div>
                <div className={styles.memberCount}>
                  {team.activePlayers.length} graczy
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
