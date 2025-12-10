// components/TeamAvatarSelectionModal.jsx
import React, { useState, useEffect } from "react";
import styles from "../styles/components/TeamDetailsModal.module.css";

const API_BASE_URL = "/api";

const TeamAvatarSelectionModal = ({
  teamId,
  currentLogoUrl,
  onClose,
  onLogoSelected,
}) => {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/teams/avatars`);
        if (!response.ok) {
          throw new Error(`Błąd ładowania awatarów: ${response.status}`);
        }
        const data = await response.json();
        setAvatars(data);
      } catch (err) {
        console.error("Fetch avatars error:", err);
        setError("Nie udało się załadować listy awatarów.");
      } finally {
        setLoading(false);
      }
    };

    fetchAvatars();
  }, []);

  const handleSelect = (url) => {
    onLogoSelected(url);
    onClose();
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Ładowanie awatarów...</h3>
          <p>Proszę czekać.</p>
          <button className={styles.closeButton} onClick={onClose}>
            Anuluj
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles.avatarSelectionContent}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>🖼️ Wybierz Avatar Drużyny</h2>

        {error && <p className={styles.errorText}>❌ {error}</p>}

        <div className={styles.avatarGrid}>
          <div
            className={styles.avatarGridItem}
            onClick={() => handleSelect("")}
          >
            <div className={`${styles.teamAvatar} ${styles.removeAvatar}`}>
              ❌
            </div>
            <p>Usuń Logo</p>
          </div>

          {avatars.length > 0 ? (
            avatars.map((avatar) => (
              <div
                key={avatar.id}
                className={styles.avatarGridItem}
                onClick={() => handleSelect(avatar.url)}
              >
                <img
                  src={avatar.url}
                  alt={`Preset Avatar ${avatar.id}`}
                  className={`${styles.teamAvatar} ${
                    currentLogoUrl === avatar.url ? styles.selectedAvatar : ""
                  }`}
                />
              </div>
            ))
          ) : (
            <p>Brak dostępnych awatarów do wyboru.</p>
          )}
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          Anuluj
        </button>
      </div>
    </div>
  );
};

export default TeamAvatarSelectionModal;
