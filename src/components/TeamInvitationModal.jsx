import React, { useState, useEffect } from "react";
import styles from "../styles/components/TeamInvitationModal.module.css";
// Poprawiona literówka w nazwie pliku (deafult -> default)
import defaultAvatar from "../assets/deafultAvatar.jpg";

const API_BASE_URL = "https://projektturniej.onrender.com/api";
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
        avatarUrl: user.avatar || user.avatarUrl,
      };
    }
  } catch (e) {
    console.error("Error reading user data:", e);
  }
  return null;
};

const UserListItem = ({
  user,
  isSelected,
  onToggle,
  isDisabled = false,
}) => (
  <div
    className={`${styles.userListItem} ${
      isSelected ? styles.selected : ""
    } ${isDisabled ? styles.disabled : ""}`}
    onClick={(e) => {
      if (isDisabled) return;
      e.stopPropagation();
      onToggle(user);
    }}
    title={isDisabled ? "Cannot select (Team full)" : "Click to select"}
  >
    <div className={styles.avatarContainer}>
      <img
        src={user.avatarUrl || defaultAvatar}
        alt={user.username}
        className={styles.userAvatar}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = defaultAvatar;
        }}
      />
      {isSelected && <div className={styles.checkIcon}>✓</div>}
    </div>
    <span className={styles.userName}>{user.username}</span>
  </div>
);

const TeamInvitationModal = ({
  teamId,
  currentTeamMembers,
  onClose,
  onInviteSent,
}) => {
  const [currentUser] = useState(getCurrentUser());
  const [friends, setFriends] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Obliczamy ile miejsc jest zajętych (ignorujemy Pending, bo Pending + zaproszenia to osobne limity w logice,
  // ale tutaj zakładamy, że zapraszamy na wolne sloty MAX - Accepted).
  // *Dostosuj filtr statusu do swojej logiki biznesowej, jeśli 'Pending' też zajmuje slot.*
  const acceptedMembers = currentTeamMembers.filter(
    (p) => p.status !== "Pending"
  ).length;
  
  const availableSlots = MAX_PLAYERS - acceptedMembers;

  const clearError = () => setErrorMessage("");

  const fetchFriends = async (token) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Error loading friends list.");
      }

      const data = await response.json();

      const existingTeamPlayerIds = new Set(
        currentTeamMembers.map((m) => Number(m.userId))
      );

      const friendList = data
        .map((f) => ({
          userId: Number(f.userId),
          username: f.username,
          avatarUrl: f.avatarUrl,
        }))
        .filter((f) => !existingTeamPlayerIds.has(f.userId));

      setFriends(friendList);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.token) fetchFriends(currentUser.token);
    else setIsLoading(false);
  }, [currentUser]);

  const handleTogglePlayer = (user) => {
    clearError();
    const isSelected = selectedPlayers.some((p) => p.userId === user.userId);

    if (isSelected) {
      setSelectedPlayers((prev) =>
        prev.filter((p) => p.userId !== user.userId)
      );
    } else {
      if (availableSlots - selectedPlayers.length <= 0) {
        setErrorMessage("No available slots left.");
        return;
      }
      setSelectedPlayers((prev) => [...prev, user]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (selectedPlayers.length === 0) {
      setErrorMessage("Select at least one player.");
      return;
    }

    setIsSending(true);

    const requests = selectedPlayers.map((player) =>
      fetch(`${API_BASE_URL}/teams/${teamId}/invite/${player.userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      })
    );

    const results = await Promise.allSettled(requests);

    const successfulUserIds = selectedPlayers
      .filter(
        (_, i) => results[i].status === "fulfilled" && results[i].value.ok
      )
      .map((p) => p.userId);

    // Usuwamy zaproszonych z listy przyjaciół (lokalnie)
    setFriends((prev) =>
      prev.filter((f) => !successfulUserIds.includes(f.userId))
    );

    setSelectedPlayers([]);
    setIsSending(false);

    if (onInviteSent) onInviteSent();
    onClose();
    
    if (successfulUserIds.length > 0) {
      console.log(`✅ Sent ${successfulUserIds.length} invitation(s).`);
    }
  };

  const remainingSlots = availableSlots - selectedPlayers.length;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Invite Friends</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {errorMessage && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>!</span>
              {errorMessage}
            </div>
        )}

        <div className={styles.statsContainer}>
             <span className={styles.slotsLabel}>Available Slots:</span>
             <span className={`${styles.slotsValue} ${remainingSlots === 0 ? styles.slotsFull : ''}`}>
                {remainingSlots} / {MAX_PLAYERS}
             </span>
        </div>

        <div className={styles.listContainer}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading friends...</div>
          ) : friends.length > 0 ? (
            friends.map((user) => (
              <UserListItem
                key={user.userId}
                user={user}
                isSelected={selectedPlayers.some(
                  (p) => p.userId === user.userId
                )}
                isDisabled={
                  remainingSlots <= 0 &&
                  !selectedPlayers.some((p) => p.userId === user.userId)
                }
                onToggle={handleTogglePlayer}
              />
            ))
          ) : (
            <div className={styles.emptyState}>
                <span>👥</span>
                <p>No available friends to invite.</p>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleSubmit}
            disabled={isSending || selectedPlayers.length === 0}
          >
            {isSending ? "Sending..." : `Invite ${selectedPlayers.length > 0 ? `(${selectedPlayers.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamInvitationModal;