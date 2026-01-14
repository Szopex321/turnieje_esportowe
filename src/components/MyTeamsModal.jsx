import React from "react";
import styles from "../styles/components/MyTeamsModal.module.css";

const MyTeamsModal = ({ teams, currentUserId, onClose, onSelectTeam }) => {
  // --- FILTROWANIE DRUŻYN ---
  // Wybieramy tylko te drużyny, w których użytkownik jest obecny i nie ma statusu "Pending"
  const myTeams = teams.filter((team) => {
    const userInTeam = team.players.find((p) => p.userId === currentUserId);
    if (!userInTeam) return false;
    return userInTeam.status !== "Pending";
  });

  return (
    // Overlay (tło modala) zamykające okno po kliknięciu
    <div className={styles.overlay} onClick={onClose}>
      {/* Główny kontener modala - stopPropagation zapobiega zamykaniu przy kliknięciu w środek */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* NAGŁÓWEK */}
        <div className={styles.header}>
          <h2>MOJE DRUŻYNY</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* TREŚĆ - LISTA DRUŻYN */}
        <div className={styles.content}>
          {myTeams.length === 0 ? (
            // Komunikat, gdy użytkownik nie ma drużyn
            <p className={styles.empty}>Nie należysz jeszcze do żadnej drużyny.</p>
          ) : (
            // Mapowanie listy drużyn
            myTeams.map((team) => (
              <div
                key={team.id}
                className={styles.teamItem}
                onClick={() => {
                  onSelectTeam(team); // Wybór drużyny
                  onClose();          // Zamknięcie modala
                }}
              >
                {/* Logo drużyny */}
                <img src={team.logo} alt="logo" className={styles.teamLogo} />
                
                {/* Informacje o drużynie */}
                <div className={styles.teamInfo}>
                  <span className={styles.teamName}>{team.name}</span>
                  <span className={styles.roleText}>
                    {/* Sprawdzenie czy użytkownik jest kapitanem */}
                    {team.captainId === currentUserId
                      ? "👑 Kapitan"
                      : "👤 Członek"}
                  </span>
                </div>
                
                {/* Liczba graczy */}
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