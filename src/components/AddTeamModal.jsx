import React, { useState, useEffect } from "react";
import styles from "../styles/components/AddTeamModal.module.css";
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
  isCaptain,
  onToggle,
  isDisabled = false,
  onError = null,
}) => (
  <div
    className={`${styles.userListItem}${
      isSelected ? ` ${styles.selected}` : ""
    }${isCaptain ? ` ${styles.captain}` : ""}${
      isDisabled ? ` ${styles.disabled}` : ""
    }`}
    onClick={(e) => {
      if (isDisabled) {
        if (onError)
          onError("You are the Captain of this team and cannot be removed.");
        return;
      }
      e.stopPropagation();
      onToggle(user);
    }}
    title={isDisabled ? "Cannot remove Captain" : "Click to select/unselect"}
  >
    <img
      src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.userId}`}
      alt={user.username}
      className={styles.userAvatar}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = `https://i.pravatar.cc/150?u=${user.userId}`;
      }}
    />
    {/* KLUCZOWA POPRAWKA STABILNOŚCI DLA CSS (UCINANIE TEKSTU) */}
    <span className={styles.userName}>
      <span className={styles.usernameDisplay}>{user.username}</span>
      {isCaptain && <span className={styles.captainBadge}>👑 CAPTAIN</span>}
    </span>
  </div>
);

const AddTeamModal = ({ onClose, onSave }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Zmieniono z powrotem na 'friends'
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Przywrócono endpoint /friends
  const fetchFriends = async (token) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/friends`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Server error." }));
        throw new Error(errorData.message || "Error loading friends list.");
      }
      const data = await response.json();
      const friendList = data.map((friend) => ({
        userId: parseInt(friend.userId || friend.id, 10), // Dostosowanie do userId/id z backendu
        username: friend.username,
        avatarUrl:
          friend.avatarUrl ||
          `https://i.pravatar.cc/150?u=${friend.userId || friend.id}`,
      }));
      setFriends(friendList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setErrorMessage(`Failed to load friends list: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitations = async (teamId, players) => {
    const invitations = players.map((player) =>
      fetch(`${API_BASE_URL}/teams/${teamId}/invite/${player.userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
      })
    );
    const results = await Promise.allSettled(invitations);
    const failedInvitations = results
      .filter(
        (result) =>
          result.status === "rejected" || (result.value && !result.value.ok)
      )
      .map((result, index) => players[index].username);
    return failedInvitations;
  };

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user && user.token) {
      fetchFriends(user.token);
    } else setIsLoading(false);
  }, []);

  const clearError = () => setErrorMessage("");

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
      if (selectedPlayers.length < MAX_PLAYERS - 1) {
        const newPlayer = {
          userId: userToToggle.userId,
          username: userToToggle.username,
          avatarUrl: userToToggle.avatarUrl,
        };
        setSelectedPlayers((prev) => [...prev, newPlayer]);
      } else
        setErrorMessage(
          `Too many players: Limit is ${
            MAX_PLAYERS - 1
          } invited players (plus captain).`
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (!name.trim()) {
      setErrorMessage("Team name is required.");
      return;
    }
    if (!currentUser) {
      setErrorMessage("Error: You must be logged in to create a team.");
      return;
    }
    setIsSaving(true);
    const teamData = { TeamName: name, Description: description };
    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(teamData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error ${response.status}: Failed to create team.`
        );
      }
      const newTeamFromBackend = await response.json();
      const teamId = newTeamFromBackend.teamId;
      let failedInvitations = [];
      if (selectedPlayers.length > 0) {
        failedInvitations = await sendInvitations(teamId, selectedPlayers);
      }
      if (failedInvitations.length === 0) {
        if (selectedPlayers.length > 0)
          alert(
            "✅ Team successfully created. All invitations have been sent!"
          );
        else alert("✅ Team successfully created!");
      } else
        alert(
          `✅ Team successfully created. However, failed to send invitations to: ${failedInvitations.join(
            ", "
          )}.`
        );
      if (onSave) onSave();
    } catch (error) {
      console.error("Error creating team:", error);
      setErrorMessage(`Server error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Użytkownicy do wyświetlenia (filtrowanie zalogowanego kapitana)
  const availableFriends = friends.filter(
    (friend) => !currentUser || friend.userId !== currentUser.userId
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Create New Team</h3>
        <form onSubmit={handleSubmit}>
          {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
          <div className={styles.formGroup}>
            <label htmlFor="name">Team Name:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError();
              }}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="description">Team Description:</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearError();
              }}
              placeholder="Enter a brief team description..."
            />
          </div>
          <div className={styles.formGroup}>
            <label>
              Team Members ({selectedPlayers.length + 1}/{MAX_PLAYERS}):{" "}
            </label>
            <div className={styles.userListContainer}>
              {currentUser && (
                <UserListItem
                  key={currentUser.userId}
                  user={currentUser}
                  isSelected={true}
                  isCaptain={true}
                  isDisabled={true}
                  onToggle={() => {}}
                  onError={setErrorMessage}
                />
              )}
              {isLoading ? (
                <div style={{ padding: "10px", color: "#888" }}>
                  Loading friends...
                </div>
              ) : availableFriends.length > 0 ? (
                availableFriends.map((user) => (
                  <UserListItem
                    key={user.userId}
                    user={user}
                    isSelected={selectedPlayers.some(
                      (p) => p.userId === user.userId
                    )}
                    isCaptain={false}
                    onToggle={handleTogglePlayer}
                    onError={setErrorMessage}
                  />
                ))
              ) : (
                <div style={{ padding: "10px", color: "#aaa" }}>
                  No accepted friends available to select.
                </div>
              )}
            </div>
            <small>
              {currentUser ? (
                <>
                  You are the{" "}
                  <strong style={{ color: "#ffd700" }}>
                    Captain ({currentUser.username})
                  </strong>{" "}
                  of this team.{" "}
                </>
              ) : (
                <>You are not logged in. Log in to create teams.</>
              )}
              Limit: {MAX_PLAYERS} members total ({MAX_PLAYERS - 1} invited
              players plus captain).
            </small>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!currentUser || isSaving}
            >
              {isSaving ? "Saving..." : "Save Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddTeamModal;
