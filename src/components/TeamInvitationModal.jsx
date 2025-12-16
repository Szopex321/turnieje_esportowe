import React, { useState, useEffect } from "react";
import styles from "../styles/components/TeamInvitationModal.module.css";

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
        avatarUrl:
          user.avatar ||
          user.avatarUrl ||
          `https://i.pravatar.cc/150?u=${currentUserIdString}`,
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
  isInvited = false,
}) => (
  <div
    className={`${styles["invitationModal-userListItem"]}${
      isSelected ? ` ${styles["invitationModal-selected"]}` : ""
    }${isDisabled ? ` ${styles["invitationModal-disabled"]}` : ""}`}
    onClick={(e) => {
      if (isDisabled) return;
      e.stopPropagation();
      onToggle(user);
    }}
    title={isDisabled ? "Cannot select" : "Click to select/unselect"}
  >
    <img
      src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.userId}`}
      alt={user.username}
      className={styles["invitationModal-userAvatar"]}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = `https://i.pravatar.cc/150?u=${user.userId}`;
      }}
    />
    <span className={styles["invitationModal-userName"]}>{user.username}</span>
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
          avatarUrl: f.avatarUrl || `https://i.pravatar.cc/150?u=${f.userId}`,
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

    setFriends((prev) =>
      prev.filter((f) => !successfulUserIds.includes(f.userId))
    );

    setSelectedPlayers([]);
    setIsSending(false);

    if (onInviteSent) onInviteSent();
    onClose();
    if (successfulUserIds.length > 0) {
      alert(`✅ Sent ${successfulUserIds.length} invitation(s).`);
    }
  };

  return (
    <div className={styles["invitationModal-overlay"]} onClick={onClose}>
      <div
        className={styles["invitationModal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>📨 Invite Friends to Team</h3>
        {errorMessage && (
          <p className={styles["invitationModal-errorText"]}>{errorMessage}</p>
        )}
        <p>
          Available slots:{" "}
          <strong
            style={{
              color:
                availableSlots - selectedPlayers.length > 0 ? "green" : "red",
            }}
          >
            {availableSlots - selectedPlayers.length}
          </strong>{" "}
          / {availableSlots}
        </p>
        <div className={styles["invitationModal-userListContainer"]}>
          {isLoading ? (
            <p>Loading friends...</p>
          ) : friends.length > 0 ? (
            friends.map((user) => (
              <UserListItem
                key={user.userId}
                user={user}
                isSelected={selectedPlayers.some(
                  (p) => p.userId === user.userId
                )}
                isDisabled={
                  availableSlots - selectedPlayers.length <= 0 &&
                  !selectedPlayers.some((p) => p.userId === user.userId)
                }
                onToggle={handleTogglePlayer}
              />
            ))
          ) : (
            <p style={{ color: "#aaa" }}>No available friends to invite.</p>
          )}
        </div>

        <div className={styles["invitationModal-actions"]}>
          <button
            className={styles["invitationModal-cancelButton"]}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles["invitationModal-saveButton"]}
            onClick={handleSubmit}
            disabled={isSending || selectedPlayers.length === 0}
          >
            {isSending ? "Sending..." : "Send Invitations"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamInvitationModal;
