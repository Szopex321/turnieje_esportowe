import React, { useState, useEffect } from "react";
import styles from "../styles/components/addTeamModal.module.css";

const MAX_PLAYERS = 5;

// Funkcja do pobrania zalogowanego użytkownika z localStorage
const getCurrentUser = () => {
  try {
    const savedUserJSON = localStorage.getItem("currentUser");
    const jwtToken = localStorage.getItem("jwt_token");

    if (savedUserJSON && jwtToken) {
      const user = JSON.parse(savedUserJSON);
      return {
        userId: user.userId,
        username: user.username,
        avatarUrl:
          user.avatar ||
          user.avatarUrl ||
          `https://i.pravatar.cc/150?u=${user.userId}`,
      };
    }
  } catch (e) {
    console.error("Błąd odczytu danych użytkownika:", e);
  }
  return null;
};

// Komponent UserListItem - zmieniony, aby przyjmować onError jako prop
const UserListItem = ({
  user,
  isSelected,
  isCaptain,
  onToggle,
  isDisabled = false,
  onError = null, // Dodany prop do obsługi błędów
}) => (
  <div
    className={`${styles.userListItem} ${isSelected ? styles.selected : ""} ${
      isCaptain ? styles.captain : ""
    } ${isDisabled ? styles.disabled : ""}`}
    onClick={(e) => {
      if (isDisabled) {
        if (onError) {
          onError("Jesteś Kapitanem tej drużyny i nie można Cię usunąć.");
        }
        return;
      }
      e.stopPropagation();
      onToggle(user);
    }}
    title={
      isDisabled ? "Nie można usunąć Kapitana" : "Kliknij, aby wybrać/odznaczyć"
    }
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
    <span className={styles.userName}>
      {user.username}
      {isCaptain && <span className={styles.captainBadge}> 👑 KAPITAN</span>}
    </span>
  </div>
);

const AddTeamModal = ({ onClose, onSave, availableUsers = [] }) => {
  // Pobierz zalogowanego użytkownika (Kapitana)
  const [currentUser, setCurrentUser] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    // Automatycznie dodaj zalogowanego użytkownika jako Kapitan
    if (user) {
      setSelectedPlayers([user]);
    }
  }, []);

  const clearError = () => setErrorMessage("");

  const handleTogglePlayer = (userToToggle) => {
    clearError();

    // Blokada usuwania Kapitana (zalogowanego użytkownika)
    if (currentUser && userToToggle.userId === currentUser.userId) {
      setErrorMessage("Jesteś Kapitanem tej drużyny i nie można Cię usunąć.");
      return;
    }

    const isCurrentlySelected = selectedPlayers.some(
      (p) => p.userId === userToToggle.userId
    );

    if (isCurrentlySelected) {
      const newSelection = selectedPlayers.filter(
        (p) => p.userId !== userToToggle.userId
      );
      setSelectedPlayers(newSelection);
    } else {
      if (selectedPlayers.length < MAX_PLAYERS) {
        const newPlayer = {
          userId: userToToggle.userId,
          username: userToToggle.username,
          avatarUrl: userToToggle.avatarUrl,
        };
        setSelectedPlayers((prev) => [...prev, newPlayer]);
      } else {
        setErrorMessage(
          `Za duża liczba graczy: Limit ${MAX_PLAYERS} członków drużyny.`
        );
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearError();

    if (!name.trim()) {
      setErrorMessage("Nazwa drużyny jest wymagana.");
      return;
    }

    if (selectedPlayers.length === 0) {
      setErrorMessage("Wybierz co najmniej jednego członka drużyny.");
      return;
    }

    // Walidacja: Kapitan musi być na pozycji 0
    if (!currentUser || selectedPlayers[0]?.userId !== currentUser.userId) {
      setErrorMessage(
        "Błąd: Kapitan (zalogowany użytkownik) musi być na pierwszej pozycji."
      );
      return;
    }

    onSave({
      name,
      description,
      players: selectedPlayers, // Kapitan jest na index 0
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Stwórz Nową Drużynę</h3>

        <form onSubmit={handleSubmit}>
          {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

          <div className={styles.formGroup}>
            <label htmlFor="name">Nazwa Drużyny:</label>
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
            <label htmlFor="description">Opis Drużyny:</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearError();
              }}
              placeholder="Wprowadź krótki opis drużyny..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>
              Członkowie Drużyny ({selectedPlayers.length} / {MAX_PLAYERS}):
            </label>
            <div className={styles.userListContainer}>
              {/* Wyświetlanie Kapitana (zalogowanego użytkownika) jako pierwszego */}
              {currentUser ? (
                <UserListItem
                  key={currentUser.userId}
                  user={currentUser}
                  isSelected={true}
                  isCaptain={true}
                  isDisabled={true}
                  onToggle={() => {}}
                  onError={setErrorMessage} // Przekazujemy funkcję setErrorMessage jako prop
                />
              ) : (
                <div
                  className={styles.errorText}
                  style={{ padding: "10px", margin: "5px 0" }}
                >
                  Nie jesteś zalogowany. Zaloguj się, aby tworzyć drużyny.
                </div>
              )}

              {/* Wyświetlanie pozostałych dostępnych użytkowników */}
              {availableUsers.length > 0 ? (
                availableUsers
                  .filter(
                    (user) => !currentUser || user.userId !== currentUser.userId
                  )
                  .map((user) => (
                    <UserListItem
                      key={user.userId}
                      user={user}
                      isSelected={selectedPlayers.some(
                        (p) => p.userId === user.userId
                      )}
                      isCaptain={false}
                      onToggle={handleTogglePlayer}
                      onError={setErrorMessage} // Przekazujemy funkcję setErrorMessage jako prop
                    />
                  ))
              ) : (
                <div style={{ padding: "10px", color: "#aaa" }}>
                  Brak dostępnych użytkowników do wyboru.
                </div>
              )}
            </div>

            <small>
              {currentUser ? (
                <>
                  Jesteś{" "}
                  <strong style={{ color: "#ffd700" }}>
                    Kapitanem ({currentUser.username})
                  </strong>{" "}
                  tej drużyny i nie możesz zostać usunięty.{" "}
                </>
              ) : (
                <>Nie jesteś zalogowany. Zaloguj się, aby tworzyć drużyny.</>
              )}
              Limit: {MAX_PLAYERS} osób.
            </small>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!currentUser || selectedPlayers.length === 0}
            >
              Zapisz Drużynę
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamModal;
