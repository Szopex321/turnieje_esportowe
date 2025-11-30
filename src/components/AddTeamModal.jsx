import React, { useState } from "react";
import styles from "../styles/components/addTeamModal.module.css";

const MAX_PLAYERS = 5;

const UserListItem = ({ user, isSelected, onToggle }) => (
  <div
    className={`${styles.userListItem} ${isSelected ? styles.selected : ""}`}
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
      setSelectedPlayers((prev) =>
        prev.filter((p) => p.userId !== userToToggle.userId)
      );
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

    onSave({
      name,
      description,
      players: selectedPlayers,
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
              {availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <UserListItem
                    key={user.userId}
                    user={user}
                    isSelected={selectedPlayers.some(
                      (p) => p.userId === user.userId
                    )}
                    onToggle={handleTogglePlayer}
                  />
                ))
              ) : (
                <div>Brak dostępnych użytkowników lub ładowanie...</div>
              )}
            </div>
            <small>
              Kliknij, aby wybrać/odznaczyć gracza. Limit: {MAX_PLAYERS} osób.
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
