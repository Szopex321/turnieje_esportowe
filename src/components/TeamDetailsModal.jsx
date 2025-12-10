/* eslint-disable no-irregular-whitespace */
import React, { useMemo, useState } from "react";
import styles from "../styles/components/TeamDetailsModal.module.css";
import TeamInvitationModal from "./TeamInvitationModal";

const API_BASE_URL = "/api";
const MAX_PLAYERS = 5;

const getCurrentUser = () => {
  try {
    const savedUserJSON = localStorage.getItem("currentUser");
    const jwtToken = localStorage.getItem("jwt_token");
    const currentUserIdString = localStorage.getItem("currentUserId");

    if (savedUserJSON && jwtToken && currentUserIdString) {
      const user = JSON.parse(savedUserJSON);
      return {
        userId: parseInt(currentUserIdString, 10),
        username: user.username,
        token: jwtToken,
      };
    }
  } catch (e) {
    console.error("Error reading user data:", e);
  }
  return null;
};

const PlayerItem = ({ player, isCaptain, onKick }) => (
  <div className={styles.playerItem}>
       {" "}
    <img
      src={player.avatarUrl || `https://i.pravatar.cc/150?u=${player.userId}`}
      alt={player.username}
      className={styles.playerAvatar}
    />
        <span className={styles.playerName}>{player.username}</span>   {" "}
    {player.isCaptain && <span className={styles.captainTag}>👑 Captain</span>} 
     {" "}
    {player.status === "Pending" && (
      <span className={styles.pendingTag}>⏳ Pending</span>
    )}
       {" "}
    {isCaptain && !player.isCaptain && (
      <button
        className={styles.kickButton}
        onClick={() => onKick(player.userId, player.username)}
        title={`Kick ${player.username} from team`}
      >
                ❌ Kick      {" "}
      </button>
    )}
     {" "}
  </div>
);

const TeamDetailsModal = ({
  team,
  onClose,
  onJoin,
  onRefresh,
  onNotificationsRefresh,
}) => {
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false); // const [showAvatarModal, setShowAvatarModal] = useState(false); // USUNIĘTY
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isLogged = !!currentUser;

  const userInTeam = useMemo(() => {
    if (!currentUser) return null;
    return team.players.find(
      (p) => parseInt(p.userId, 10) === currentUser.userId
    );
  }, [team.players, currentUser]);

  const userRole = useMemo(() => {
    if (!currentUser) return "None";

    if (currentUser.userId === parseInt(team.captainId, 10)) return "Captain";

    if (userInTeam) {
      if (userInTeam.status === "Member") return "Member";
      if (userInTeam.status === "Pending") return "Pending";
    }
    return "None";
  }, [userInTeam, team.captainId, currentUser]);

  const isCaptain = userRole === "Captain";
  const isMember = userRole === "Member";
  const isPending = userRole === "Pending";
  const isInTeam = userRole !== "None";

  const captain = team.players.find(
    (p) => parseInt(p.userId, 10) === parseInt(team.captainId, 10)
  );
  const acceptedMembers = team.players.filter(
    (p) =>
      (p.status === "Member" || p.status === "Captain") &&
      parseInt(p.userId, 10) !== parseInt(team.captainId, 10)
  );
  const activeMembersCount = captain
    ? 1 + acceptedMembers.length
    : acceptedMembers.length;

  const cleanupAndClose = (successMessage) => {
    console.log("Success:", successMessage);
    if (onNotificationsRefresh) onNotificationsRefresh();
    if (onRefresh) onRefresh();
    onClose();
  };

  const handleJoin = () => {
    setError(null);
    if (!isLogged) {
      setError("Musisz być zalogowany, aby dołączyć do drużyny.");
      return;
    }
    onJoin(team.id);
    onClose();
    if (onRefresh) {
      setTimeout(onRefresh, 500);
    }
    if (onNotificationsRefresh) {
      setTimeout(onNotificationsRefresh, 500);
    }
  };

  const handleDisbandTeam = async () => {
    if (!isCaptain) return;
    setError(null);

    if (activeMembersCount > 1) {
      setError(
        "Nie możesz rozwiązać drużyny, gdy są w niej inni członkowie. Wyrzuć ich najpierw."
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/teams/${team.id}/leave`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      if (response.ok) {
        cleanupAndClose(`💥 Pomyślnie rozwiązano drużynę "${team.name}".`);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(
          data.message ||
            `Nie udało się rozwiązać drużyny. Status: ${response.status}`
        );
      }
    } catch (err) {
      console.error("Disband error:", err);
      setError("Wystąpił błąd sieci podczas próby rozwiązania drużyny.");
    }
  };

  const handleLeaveTeam = async () => {
    if (!isMember) return;
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/teams/${team.id}/leave`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      if (response.ok) {
        cleanupAndClose(`🚪 Pomyślnie opuściłeś drużynę "${team.name}".`);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(
          data.message ||
            `Nie udało się opuścić drużyny. Status: ${response.status}`
        );
      }
    } catch (err) {
      console.error("Leave error:", err);
      setError("Wystąpił błąd sieci podczas próby opuszczenia drużyny.");
    }
  };

  const handleUpdateLogo = () => {
    // Funkcjonalność zmiany logo jest WYŁĄCZONA
    setError(
      "Funkcja zmiany logo jest tymczasowo niedostępna z powodu błędu serwera (405)."
    );
  };

  const handleKickPlayer = async (userIdToKick, username) => {
    if (!isCaptain || !currentUser) return;
    setError(null);

    if (parseInt(userIdToKick, 10) === currentUser.userId) {
      setError(
        "Nie możesz wyrzucić samego siebie. Użyj przycisku 'Rozwiąż Drużynę' (jeśli jesteś jedynym członkiem)."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/teams/${team.id}/kick/${userIdToKick}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        }
      );

      if (response.ok) {
        cleanupAndClose(`Pomyślnie wyrzucono ${username} z drużyny.`);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(
          data.message ||
            `Nie udało się wyrzucić gracza. Status: ${response.status}`
        );
      }
    } catch (err) {
      console.error("Kick error:", err);
      setError("Wystąpił błąd sieci podczas próby wyrzucenia gracza.");
    }
  };

  const handleOpenInviteModal = () => {
    setError(null);
    if (activeMembersCount >= MAX_PLAYERS) {
      setError(
        `Drużyna jest pełna (${MAX_PLAYERS} członków). Nie można wysłać więcej zaproszeń.`
      );
      return;
    }
    setShowInviteModal(true);
  };

  const visiblePlayers = captain
    ? [captain, ...acceptedMembers]
    : acceptedMembers;

  const pendingPlayers = team.players.filter((p) => p.status === "Pending");

  const canDisband = activeMembersCount === 1;
  const disbandTitle = canDisband
    ? "Rozwiąż drużynę (tylko ty jesteś członkiem)"
    : "Aby rozwiązać drużynę, musisz najpierw usunąć wszystkich pozostałych członków.";

  return (
    <>
           {" "}
      <div className={styles.modalOverlay} onClick={onClose}>
               {" "}
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
                    {error && <p className={styles.errorText}>❌ {error}</p>}   
               {" "}
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
                    <h2>{team.name}</h2>         {" "}
          <p className={styles.description}>{team.description}</p>
                    <hr className={styles.divider} />         {" "}
          <div className={styles.section}>
                       {" "}
            <h3>
                            🧑‍🤝‍🧑 Team Members ({visiblePlayers.length}/
              {MAX_PLAYERS})            {" "}
            </h3>
                       {" "}
            <div className={styles.playersList}>
                           {" "}
              {visiblePlayers.map((player) => (
                <PlayerItem
                  key={player.userId}
                  player={{
                    ...player,
                    isCaptain:
                      parseInt(player.userId, 10) ===
                      parseInt(team.captainId, 10),
                  }}
                  isCaptain={isCaptain}
                  onKick={handleKickPlayer}
                />
              ))}
                         {" "}
            </div>
                     {" "}
          </div>
                   {" "}
          {isCaptain && pendingPlayers.length > 0 && (
            <div className={styles.section}>
                           {" "}
              <h3 className={styles.pendingHeader}>
                                📨 Pending Requests ({pendingPlayers.length})  
                           {" "}
              </h3>
                           {" "}
              <div className={styles.playersList}>
                               {" "}
                {pendingPlayers.map((player) => (
                  <PlayerItem
                    key={player.userId}
                    player={player}
                    isCaptain={isCaptain}
                    onKick={handleKickPlayer}
                  />
                ))}
                             {" "}
              </div>
                         {" "}
            </div>
          )}
                    <hr className={styles.divider} />         {" "}
          <div className={styles.actions}>
                       {" "}
            {isCaptain ? (
              <>
                               {" "}
                <button
                  className={`${styles.manageButton} ${styles.inviteButton}`}
                  onClick={handleOpenInviteModal}
                  disabled={visiblePlayers.length >= MAX_PLAYERS}
                  title={
                    visiblePlayers.length >= MAX_PLAYERS
                      ? "Drużyna osiągnęła maksymalną liczbę graczy"
                      : "Zaproś nowego gracza"
                  }
                >
                                    📨 Zaproś (Invites)                {" "}
                </button>
                               {" "}
                <button
                  className={styles.manageButton}
                  onClick={handleUpdateLogo}
                >
                                    🖼️ Zmień Logo (Update Logo)                {" "}
                </button>
                               {" "}
                <button
                  className={`${styles.manageButton} ${styles.disbandButton}`}
                  onClick={handleDisbandTeam}
                  disabled={!canDisband}
                  title={disbandTitle}
                >
                                    💥 Rozwiąż Drużynę (Disband Team)          
                       {" "}
                </button>
                             {" "}
              </>
            ) : isMember ? (
              <button className={styles.leaveButton} onClick={handleLeaveTeam}>
                                🚪 Leave Team              {" "}
              </button>
            ) : isPending ? (
              <p className={styles.infoText}>
                                ⏳ Twoja prośba/zaproszenie oczekuje na
                akceptację kapitana.              {" "}
              </p>
            ) : isLogged && !isInTeam ? (
              <button className={styles.joinButton} onClick={handleJoin}>
                                ➕ Request to Join              {" "}
              </button>
            ) : (
              <p className={styles.infoText}>
                                Zaloguj się, aby móc poprosić o dołączenie do
                tej drużyny.              {" "}
              </p>
            )}
                       {" "}
            <button className={styles.closeButton} onClick={onClose}>
                            Zamknij            {" "}
            </button>
                     {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </div>
           {" "}
      {showInviteModal && (
        <TeamInvitationModal
          teamId={team.id}
          currentTeamMembers={team.players.filter(
            (p) => p.status === "Member" || p.isCaptain
          )}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={() => {
            if (onRefresh) onRefresh();
            if (onNotificationsRefresh) onNotificationsRefresh();
          }}
        />
      )}
            {/* {showAvatarModal && ( ... ) } */}   {" "}
    </>
  );
};

export default TeamDetailsModal;
