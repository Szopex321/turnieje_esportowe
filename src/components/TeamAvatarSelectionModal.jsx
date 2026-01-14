import React, { useState, useEffect } from "react";
import styles from "../styles/components/TeamAvatarSelectionModal.module.css";

const API_BASE_URL = "/api";

// Komponent pomocniczy wyświetlający pojedynczy kafelek z awatarem
const AvatarItem = ({ avatar, isSelected, onClick }) => (
  <div
    key={avatar.teamAvatarId}
    className={`${styles.avatarGridItem} ${
      isSelected ? styles.selectedAvatarContainer : ""
    }`}
    onClick={() => onClick(avatar)}
    title={avatar.teamAvatarName}
  >
    <img
      src={avatar.url}
      alt={avatar.teamAvatarName}
      className={`${styles.teamAvatar} ${
        isSelected ? styles.selectedAvatar : ""
      }`}
    />
  </div>
);

const TeamAvatarSelectionModal = ({
  teamId,
  currentLogoUrl,
  onClose,
  onLogoSelected,
}) => {
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pobieranie listy dostępnych awatarów przy montowaniu komponentu
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/teams/avatars`);
        if (!response.ok) {
          throw new Error("Nie udało się pobrać awatarów drużyn.");
        }
        const data = await response.json();

        // Mapowanie danych (jeśli backend zwraca inną strukturę, tutaj to ujednolicamy)
        const formattedAvatars = data.map((item) => ({
          teamAvatarId: item.teamAvatarId,
          teamAvatarName: item.teamAvatarName,
          url: item.url,
        }));

        setAvatars(formattedAvatars);

        // Ustawienie aktualnie używanego logo jako wybranego (jeśli istnieje na liście)
        const initialSelection = formattedAvatars.find(
          (a) => a.url === currentLogoUrl
        );
        setSelectedAvatar(initialSelection || null);
      } catch (err) {
        setError(err.message);
        console.error("Błąd pobierania awatarów:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatars();
  }, [currentLogoUrl]);

  // Obsługa kliknięcia w awatar
  const handleSelectAvatar = (avatar) => {
    setSelectedAvatar(avatar);
  };

  // Zatwierdzenie wyboru
  const handleConfirmSelection = () => {
    if (selectedAvatar) {
      onLogoSelected(selectedAvatar.url);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      {/* stopPropagation zapobiega zamknięciu modala przy kliknięciu w jego wnętrze */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeModalBtn}
          onClick={onClose}
          aria-label="Zamknij"
        >
          ×
        </button>
        <h3>🖼️ Wybierz Logo Drużyny</h3>

        {error && <p className={styles.errorText}>Błąd: {error}</p>}

        {isLoading ? (
          <p>Ładowanie awatarów...</p>
        ) : (
          <div className={styles.avatarGrid}>
            {avatars.map((avatar) => (
              <AvatarItem
                key={avatar.teamAvatarId}
                avatar={avatar}
                isSelected={
                  selectedAvatar &&
                  selectedAvatar.teamAvatarId === avatar.teamAvatarId
                }
                onClick={handleSelectAvatar}
              />
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Anuluj
          </button>
          <button
            onClick={handleConfirmSelection}
            className={styles.confirmButton}
            disabled={!selectedAvatar || isLoading}
          >
            Potwierdź Wybór
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamAvatarSelectionModal;