import React, { useState, useEffect } from "react";
// Upewnij się, że nazwa pliku CSS jest poprawna (wcześniej używałeś addTeamModal.module.css)
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

// Zaktualizowany komponent UserListItem
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
    title={isDisabled ? "Already a team member" : "Click to select/unselect"}
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
    <span className={styles["invitationModal-userName"]}>
      {user.username}
      {isInvited && (
        <span
          className={styles["invitationModal-pendingTag"]}
          style={{ fontSize: "10px" }}
        >
          INVITED
        </span>
      )}
    </span>
  </div>
);

// Zaktualizowany komponent TeamInvitationModal
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

  const currentMembersCount = currentTeamMembers.length;
  const availableSlots = MAX_PLAYERS - currentMembersCount;

  const clearError = () => setErrorMessage("");

  const fetchFriends = async (token) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/friends`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Error loading friends list.");
      }
      const data = await response.json();

      const existingMemberIds = new Set(
        currentTeamMembers.map((p) => parseInt(p.userId, 10))
      );

      const friendList = data
        .map((friend) => ({
          userId: parseInt(friend.userId, 10),
          username: friend.username,
          avatarUrl:
            friend.avatarUrl || `https://i.pravatar.cc/150?u=${friend.userId}`,
        }))
        .filter((friend) => !existingMemberIds.has(friend.userId));

      setFriends(friendList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setErrorMessage(`Failed to load friends list: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.token) {
      fetchFriends(currentUser.token);
    } else setIsLoading(false);
  }, [currentUser]);

  const handleTogglePlayer = (userToToggle) => {
    clearError();
    const isCurrentlySelected = selectedPlayers.some(
      (p) => p.userId === userToToggle.userId
    );

    if (isCurrentlySelected) {
      const newSelection = selectedPlayers.filter(
        (p) => p.userId !== userToToggle.userId
      );
      setSelectedPlayers(newSelection);
    } else {
      if (selectedPlayers.length < availableSlots) {
        setSelectedPlayers((prev) => [...prev, userToToggle]);
      } else {
        setErrorMessage(
          `Limit exceeded: Only ${availableSlots} slots remaining.`
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (selectedPlayers.length === 0) {
      setErrorMessage("Select at least one player to invite.");
      return;
    }
    setIsSending(true);

    const invitations = selectedPlayers.map((player) =>
      fetch(`${API_BASE_URL}/teams/${teamId}/invite/${player.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
      })
    );

    const results = await Promise.allSettled(invitations);

    const successfulInvites = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok
    ).length;
    const failedInvites = selectedPlayers.length - successfulInvites;

    setIsSending(false);
    onClose();

    if (onInviteSent) onInviteSent();

    if (successfulInvites > 0) {
      alert(`✅ Successfully sent ${successfulInvites} invitation(s).`);
    }
    if (failedInvites > 0) {
      alert(`⚠️ Failed to send ${failedInvites} invitation(s).`);
    }
  };

  return (
    // Używamy nowej klasy CSS: invitationModal-overlay
    <div className={styles["invitationModal-overlay"]} onClick={onClose}>
      {/* Używamy nowej klasy CSS: invitationModal-content */}
      <div
        className={styles["invitationModal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>📨 Invite Friends to Team</h3>
        <form onSubmit={handleSubmit}>
          {/* Używamy nowej klasy CSS: invitationModal-errorText */}
          {errorMessage && (
            <p className={styles["invitationModal-errorText"]}>
              {errorMessage}
            </p>
          )}

          {/* Używamy nowej klasy CSS: invitationModal-formGroup */}
          <div className={styles["invitationModal-formGroup"]}>
            <label>
              Available Slots:{" "}
              <strong style={{ color: availableSlots > 0 ? "green" : "red" }}>
                {availableSlots}
              </strong>{" "}
              / {MAX_PLAYERS - currentMembersCount}
            </label>
            {/* Używamy nowej klasy CSS: invitationModal-userListContainer */}
            <div className={styles["invitationModal-userListContainer"]}>
              {isLoading ? (
                <div style={{ padding: "10px", color: "#888" }}>
                  Loading friends...
                </div>
              ) : friends.length > 0 ? (
                friends.map((user) => (
                  <UserListItem
                    key={user.userId}
                    user={user}
                    isSelected={selectedPlayers.some(
                      (p) => p.userId === user.userId
                    )}
                    onToggle={handleTogglePlayer}
                    isDisabled={
                      availableSlots <= 0 &&
                      !selectedPlayers.some((p) => p.userId === user.userId)
                    }
                  />
                ))
              ) : (
                <div style={{ padding: "10px", color: "#aaa" }}>
                  No available friends to invite.
                </div>
              )}
            </div>
            {/* Używamy nowej klasy CSS: invitationModal-formGroup small */}
            <small className={styles["invitationModal-formGroup"]}>
              Select up to {availableSlots} friends to send an invitation.
            </small>
          </div>

          {/* Używamy nowej klasy CSS: invitationModal-actions */}
          <div className={styles["invitationModal-actions"]}>
            {/* Używamy nowej klasy CSS: invitationModal-cancelButton */}
            <button
              type="button"
              className={styles["invitationModal-cancelButton"]}
              onClick={onClose}
            >
              Cancel
            </button>
            {/* Używamy nowej klasy CSS: invitationModal-saveButton */}
            <button
              type="submit"
              className={styles["invitationModal-saveButton"]}
              disabled={
                !currentUser ||
                isSending ||
                selectedPlayers.length === 0 ||
                availableSlots <= 0
              }
            >
              {isSending ? "Sending..." : "Send Invitations"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamInvitationModal;
