// Ostateczna wersja TeamDetailsModal.jsx (Poprawiona autoryzacja)
import React, { useMemo, useState } from "react";
import styles from "../styles/components/TeamDetailsModal.module.css";
import TeamInvitationModal from "./TeamInvitationModal";
import TeamAvatarSelectionModal from "./TeamAvatarSelectionModal";
import defaultAvatar from "../assets/deafultAvatar.jpg"; // Upewnij się, że ścieżka jest poprawna

const API_BASE_URL = "https://projektturniej.onrender.com/api"; // Pełny URL API
const MAX_PLAYERS = 5;

// Funkcja fallback (zapasowa)
const getCurrentUserFallback = () => {
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
    <div className={styles.playerAvatarContainer}>
      <img
        src={player.avatarUrl || defaultAvatar}
        alt={player.username}
        className={styles.playerAvatar}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = defaultAvatar;
        }}
      />
      {player.isCaptain && (
        <div className={styles.captainIndicator} title="Captain">
          👑
        </div>
      )}
    </div>

    <div className={styles.playerInfo}>
      <span className={styles.playerName}>{player.username}</span>
      <div className={styles.playerTags}>
        {player.isCaptain && <span className={styles.captainTag}>Captain</span>}
        {player.status === "Pending" && (
          <span className={styles.pendingTag}>Pending</span>
        )}
      </div>
    </div>

    {isCaptain && !player.isCaptain && (
      <button
        className={styles.kickButton}
        onClick={() => onKick(player.userId, player.username)}
        title={`Kick ${player.username} from team`}
      >
        Remove
      </button>
    )}
  </div>
);

const TeamDetailsModal = ({
  team,
  onClose,
  onJoin,
  onRefresh,
  onNotificationsRefresh,
  currentUserOverride, // Odbieramy dane z TitleBar
}) => {
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [localLogo, setLocalLogo] = useState(team.logo);

  // Używamy przekazanych danych lub fallbacku
  const currentUser = useMemo(() => {
    if (currentUserOverride) return currentUserOverride;
    return getCurrentUserFallback();
  }, [currentUserOverride]);

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
    onClose(localLogo);
  };

  const handleJoin = () => {
    setError(null);
    if (!isLogged) {
      setError("Musisz być zalogowany, aby dołączyć do drużyny.");
      return;
    }
    onJoin(team.id);
    onClose();
    if (onRefresh) setTimeout(onRefresh, 500);
    if (onNotificationsRefresh) setTimeout(onNotificationsRefresh, 500);
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
    setError(null);
    setShowAvatarModal(true);
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
      <div className={styles.modalOverlay} onClick={() => onClose(localLogo)}>
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={styles.closeModalBtn}
            onClick={() => onClose(localLogo)}
            aria-label="Close"
          >
            ×
          </button>

          {error && (
            <div className={styles.errorMessage}>
              <div className={styles.errorIcon}>!</div>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <div className={styles.teamHeader}>
            <div className={styles.logoContainer}>
              <img
                src={localLogo}
                alt={`${team.name} logo`}
                className={styles.teamLogo}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://placehold.co/150/2c3e50/ecf0f1?text=${(
                    team.name || "T"
                  )
                    .substring(0, 2)
                    .toUpperCase()}`;
                }}
              />
            </div>
            <div className={styles.teamInfo}>
              <h2 className={styles.teamName}>{team.name}</h2>
              <p className={styles.teamDescription}>{team.description}</p>
              <div className={styles.teamStats}>
                <span className={styles.statBadge}>
                  {visiblePlayers.length}/{MAX_PLAYERS} members
                </span>
                {isCaptain && <span className={styles.roleBadge}>Captain</span>}
              </div>
            </div>
          </div>

          <div className={styles.contentSections}>
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Team Members</h3>
                <span className={styles.sectionSubtitle}>
                  {visiblePlayers.length} of {MAX_PLAYERS}
                </span>
              </div>
              <div className={styles.playersList}>
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
              </div>
            </div>

            {isCaptain && pendingPlayers.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>Pending Requests</h3>
                  <span className={styles.pendingCount}>
                    {pendingPlayers.length}
                  </span>
                </div>
                <div className={`${styles.playersList} ${styles.pendingList}`}>
                  {pendingPlayers.map((player) => (
                    <PlayerItem
                      key={player.userId}
                      player={player}
                      isCaptain={isCaptain}
                      onKick={handleKickPlayer}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.actionSection}>
            {isCaptain ? (
              <div className={styles.captainActions}>
                <div className={styles.actionRow}>
                  <button
                    className={`${styles.actionButton} ${styles.inviteButton}`}
                    onClick={handleOpenInviteModal}
                    disabled={visiblePlayers.length >= MAX_PLAYERS}
                    title={
                      visiblePlayers.length >= MAX_PLAYERS
                        ? "Drużyna osiągnęła maksymalną liczbę graczy"
                        : "Zaproś nowego gracza"
                    }
                  >
                    <span className={styles.buttonIcon}>📨</span>
                    Invite Player
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.secondaryButton}`}
                    onClick={handleUpdateLogo}
                  >
                    <span className={styles.buttonIcon}>🖼️</span>
                    Change Logo
                  </button>
                </div>
                <button
                  className={`${styles.actionButton} ${styles.dangerButton}`}
                  onClick={handleDisbandTeam}
                  disabled={!canDisband}
                  title={disbandTitle}
                >
                  <span className={styles.buttonIcon}>💥</span>
                  Disband Team
                </button>
              </div>
            ) : isMember ? (
              <button
                className={`${styles.actionButton} ${styles.dangerButton} ${styles.fullWidth}`}
                onClick={handleLeaveTeam}
              >
                <span className={styles.buttonIcon}>🚪</span>
                Leave Team
              </button>
            ) : isPending ? (
              <div className={styles.statusMessage}>
                <div className={styles.statusIcon}>⏳</div>
                <div>
                  <p className={styles.statusTitle}>Request Pending</p>
                  <p className={styles.statusSubtitle}>
                    Your request is waiting for captain's approval
                  </p>
                </div>
              </div>
            ) : isLogged && !isInTeam ? (
              <button
                className={`${styles.actionButton} ${styles.primaryButton} ${styles.fullWidth}`}
                onClick={handleJoin}
              >
                <span className={styles.buttonIcon}>➕</span>
                Request to Join
              </button>
            ) : (
              <div className={styles.statusMessage}>
                <div className={styles.statusIcon}>🔒</div>
                <p>Log in to request joining this team</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInviteModal && (
        <TeamInvitationModal
          teamId={team.id}
          currentTeamMembers={team.players}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={() => {
            if (onRefresh) onRefresh();
            if (onNotificationsRefresh) onNotificationsRefresh();
          }}
        />
      )}

      {showAvatarModal && (
        <TeamAvatarSelectionModal
          teamId={team.id}
          currentLogoUrl={localLogo}
          onClose={() => setShowAvatarModal(false)}
          onLogoSelected={(newUrl) => {
            setLocalLogo(newUrl);
            setShowAvatarModal(false);
            setError(null);
          }}
        />
      )}
    </>
  );
};

export default TeamDetailsModal;
