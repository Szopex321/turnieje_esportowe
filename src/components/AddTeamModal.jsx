import React, { useState, useEffect } from "react";
import styles from "../styles/components/AddTeamModal.module.css";
// Importujemy domyślny awatar, aby zachować spójność z TitleBar i TeamDetails
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
        // Jeśli brak awatara, używamy lokalnego defaultAvatar
        avatarUrl: user.avatar || user.avatarUrl || defaultAvatar,
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
  >
    <img
      src={user.avatarUrl || defaultAvatar}
      alt={user.username}
      className={styles.userAvatar}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = defaultAvatar;
      }}
    />
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

  const [avatars, setAvatars] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Funkcja pobierająca listę dostępnych awatarów drużyn z bazy
  const fetchAvatars = async (token) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE_URL}/Teams/avatars`, {
        method: "GET",
        headers: headers,
      });

      if (response.ok) {
        const data = await response.json();
        // Zapisujemy dane z API (oczekiwany format: [{ teamAvatarId: 1, url: "..." }, ...])
        setAvatars(data);
      } else {
        console.warn(
          "⚠️ Nie udało się pobrać awatarów, status:",
          response.status
        );
      }
    } catch (error) {
      console.error("❌ Błąd pobierania awatarów:", error);
    }
  };

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
        throw new Error("Error loading friends list.");
      }
      const data = await response.json();
      const friendList = data.map((friend) => ({
        userId: parseInt(friend.userId || friend.id, 10),
        username: friend.username,
        // Używamy defaultAvatar jeśli backend zwróci null/pusty string
        avatarUrl: friend.avatarUrl || defaultAvatar,
      }));
      setFriends(friendList);
    } catch (error) {
      console.error("Error fetching friends:", error);
      setErrorMessage("Failed to load friends list.");
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
      fetchAvatars(user.token);
      fetchFriends(user.token);
    } else {
      setIsLoading(false);
      // Próba pobrania awatarów nawet bez logowania (jeśli endpoint jest publiczny)
      fetchAvatars(null);
    }
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

    // --- LOGIKA LOSOWANIA AWATARA ---
    let randomAvatarUrl = null;

    if (avatars.length > 0) {
      const randomIndex = Math.floor(Math.random() * avatars.length);
      // Używamy właściwości .url (zgodnie z Twoim API)
      randomAvatarUrl = avatars[randomIndex].url;
      console.log("🎲 Wylosowano z bazy:", randomAvatarUrl);
    } else {
      console.warn(
        "⚠️ Lista awatarów jest pusta. Drużyna zostanie utworzona bez logo."
      );
    }

    const teamData = {
      TeamName: name.trim(), // Usuwamy zbędne spacje, co pomaga przy walidacji duplikatów
      Description: description,
      LogoUrl: randomAvatarUrl,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(teamData),
      });

      // --- OBSŁUGA BŁĘDÓW (NP. ZAJĘTA NAZWA) ---
      if (!response.ok) {
        // Pobieramy treść błędu (tekst lub JSON)
        const errorText = await response.text();
        let errorMsg = `Error ${response.status}: Failed to create team.`;

        try {
          // Próbujemy sparsować jako JSON
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.message || errorJson.title || errorText;
        } catch {
          // Jeśli to zwykły tekst (np. z return BadRequest("...")), używamy go bezpośrednio
          if (errorText) errorMsg = errorText;
        }

        throw new Error(errorMsg);
      }
      // ------------------------------------------

      const newTeamFromBackend = await response.json();
      const teamId = newTeamFromBackend.teamId;
      let failedInvitations = [];

      if (selectedPlayers.length > 0) {
        failedInvitations = await sendInvitations(teamId, selectedPlayers);
      }

      if (failedInvitations.length === 0) {
        if (onSave) onSave();
      } else
        alert(`Created with failed invites: ${failedInvitations.join(", ")}`);

      if (onSave) onSave();
    } catch (error) {
      console.error("Error creating team:", error);
      // Wyświetlamy użytkownikowi dokładny komunikat błędu z backendu
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

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
