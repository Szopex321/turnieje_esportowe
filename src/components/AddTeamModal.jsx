import React, { useState } from "react";
import styles from "../styles/components/addTeamModal.module.css";

const MAX_PLAYERS = 5;

// Rozszerzony komponent, aby pokazać, czy użytkownik jest Kapitanem
const UserListItem = ({ user, isSelected, isCaptain, onToggle }) => (
  <div
    className={`${styles.userListItem} ${isSelected ? styles.selected : ""} ${
      isCaptain ? styles.captain : ""
    }`}
    onClick={(e) => {
      e.stopPropagation();
      onToggle(user);
    }}
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
    {user.username}
    {isCaptain && <span className={styles.captainLabel}>👑 KAPITAN</span>}
  </div>
);

const AddTeamModal = ({ onClose, onSave, availableUsers = [] }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const clearError = () => setErrorMessage("");

  const handleTogglePlayer = (userToToggle) => {
    clearError();

    const isCurrentlySelected = selectedPlayers.some(
      (p) => p.userId === userToToggle.userId
    );

    if (isCurrentlySelected) {
      // Usunięcie gracza
      const newSelection = selectedPlayers.filter(
        (p) => p.userId !== userToToggle.userId
      );
      // Jeśli usunięto kapitana, pierwszy z listy staje się nowym kapitanem
      setSelectedPlayers(newSelection);
    } else {
      // Dodanie gracza
      if (selectedPlayers.length < MAX_PLAYERS) {
        const newPlayer = {
          userId: userToToggle.userId,
          username: userToToggle.username,
          avatarUrl: userToToggle.avatarUrl,
        };
        // Pierwszy dodany gracz staje się automatycznie kapitanem (poprzez kolejność w tablicy)
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

    // Wysłanie danych. Kapitan jest zawsze na indeksie 0,
    // co było ustalone w komponencie TeamsPage.jsx przy obsłudze onSave.
    onSave({
      name,
      description,
      players: selectedPlayers,
    });
  };

  // Używamy tego w mapowaniu, aby określić, kto jest kapitanem
  const captainId =
    selectedPlayers.length > 0 ? selectedPlayers[0].userId : null;

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
              {availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <UserListItem
                    key={user.userId}
                    user={user}
                    isSelected={selectedPlayers.some(
                      (p) => p.userId === user.userId
                    )}
                    // DODANE: Prop isCaptain
                    isCaptain={user.userId === captainId}
                    onToggle={handleTogglePlayer}
                  />
                ))
              ) : (
                <div>Brak dostępnych użytkowników lub ładowanie...</div>
              )}
            </div>
            <small>
              Kliknij, aby wybrać/odznaczyć gracza. Pierwszy wybrany gracz to
              automatycznie **Kapitan**. Limit: {MAX_PLAYERS} osób.
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
            <button type="submit" className={styles.saveButton}>
              Zapisz Drużynę
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamModal;
