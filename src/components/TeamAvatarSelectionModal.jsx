import React, { useState, useEffect } from "react";
import styles from "../styles/components/TeamAvatarSelectionModal.module.css";

const API_BASE_URL = "/api";

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

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/teams/avatars`);
        if (!response.ok) {
          throw new Error("Failed to fetch team avatars");
        }
        const data = await response.json();

        const formattedAvatars = data.map((item) => ({
          teamAvatarId: item.teamAvatarId,
          teamAvatarName: item.teamAvatarName,
          url: item.url,
        }));

        setAvatars(formattedAvatars);

        const initialSelection = formattedAvatars.find(
          (a) => a.url === currentLogoUrl
        );
        setSelectedAvatar(initialSelection || null);
      } catch (err) {
        setError(err.message);
        console.error("Fetch avatars error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvatars();
  }, [currentLogoUrl]);

  const handleSelectAvatar = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleConfirmSelection = () => {
    if (selectedAvatar) {
      onLogoSelected(selectedAvatar.url);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeModalBtn}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h3>🖼️ Wybierz Logo Drużyny</h3>

        {error && <p className={styles.errorText}>Błąd ładowania: {error}</p>}

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
