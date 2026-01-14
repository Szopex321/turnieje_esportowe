import React from "react";
import styles from "../styles/components/NotificationsModal.module.css";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

// Pobieranie tokena z LocalStorage
const getCurrentToken = () => localStorage.getItem("jwt_token");

// Pobieranie danych zalogowanego użytkownika
const getCurrentUser = () => {
  try {
    const savedUserJSON = localStorage.getItem("currentUser");
    const jwtToken = localStorage.getItem("jwt_token");
    if (savedUserJSON && jwtToken) {
      const user = JSON.parse(savedUserJSON);
      return {
        userId: parseInt(user.userId, 10),
        username: user.username,
        token: jwtToken,
      };
    }
  } catch (e) {
    console.error("Błąd odczytu danych użytkownika:", e);
  }
  return null;
};

// --- FUNKCJE API ---

// Oznaczenie powiadomienia jako przeczytane
const handleMarkAsRead = async (notificationId, onRefresh) => {
  const token = getCurrentToken();
  if (!token) return;
  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (response.ok) {
      onRefresh(); // Odśwież listę po sukcesie
    }
  } catch (e) {
    console.error("Błąd oznaczania jako przeczytane:", e);
  }
};

// Akceptacja zaproszenia do drużyny
const handleAcceptInvite = async (teamId, notificationId, onRefresh) => {
  const token = getCurrentToken();
  if (!token) return;
  try {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      handleMarkAsRead(notificationId, onRefresh);
    } else {
      console.error("Błąd akceptacji zaproszenia");
    }
  } catch (error) {
    console.error("Błąd sieci (Accept Invite):", error);
  }
};

// Akceptacja prośby o dołączenie (dla Kapitana)
const handleAcceptJoinRequest = async (
  teamId,
  userIdToApprove,
  notificationId,
  onRefresh
) => {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.token) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/teams/${teamId}/approve/${userIdToApprove}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      }
    );
    if (response.ok) {
      handleMarkAsRead(notificationId, onRefresh);
    }
  } catch (error) {
    console.error("Błąd akceptacji prośby o dołączenie:", error);
  }
};

// Odrzucenie prośby o dołączenie
const handleRejectJoinRequest = async (
  teamId,
  userIdToReject,
  notificationId,
  onRefresh
) => {
  // Tutaj logika backendowa odrzucenia (jeśli istnieje endpoint), 
  // na razie oznaczamy powiadomienie jako przeczytane.
  handleMarkAsRead(notificationId, onRefresh);
};

// Odrzucenie zaproszenia do drużyny
const handleRejectInvite = async (teamId, notificationId, onRefresh) => {
  handleMarkAsRead(notificationId, onRefresh);
};

// --- KOMPONENT POJEDYNCZEGO POWIADOMIENIA ---

const NotificationItem = ({ notification, onRefresh }) => {
  const isTeamInvite =
    notification.notificationType === "TeamInvite" && notification.relatedId;
  const isJoinRequest =
    notification.notificationType === "TeamJoinRequest" &&
    notification.relatedId;
  const teamId = notification.relatedId;
  const notificationId = notification.notificationId;
  const targetUserId = notification.relatedUserId;
  const displayMessage = notification.message;

  // Obsługa przycisków
  const handleAcceptInviteClick = (e) => {
    e.stopPropagation();
    handleAcceptInvite(teamId, notificationId, onRefresh);
  };

  const handleRejectInviteClick = (e) => {
    e.stopPropagation();
    handleRejectInvite(teamId, notificationId, onRefresh);
  };

  const handleAcceptJoinRequestClick = (e) => {
    e.stopPropagation();
    if (targetUserId) {
      handleAcceptJoinRequest(teamId, targetUserId, notificationId, onRefresh);
    } else {
      handleMarkAsRead(notificationId, onRefresh);
    }
  };

  const handleRejectJoinRequestClick = (e) => {
    e.stopPropagation();
    if (targetUserId) {
      handleRejectJoinRequest(teamId, targetUserId, notificationId, onRefresh);
    } else {
      handleMarkAsRead(notificationId, onRefresh);
    }
  };

  // Kliknięcie w powiadomienie (oznaczenie jako przeczytane, jeśli to nie jest akcja)
  const handleItemClick = () => {
    if (!isTeamInvite && !isJoinRequest && !notification.isRead) {
      handleMarkAsRead(notificationId, onRefresh);
    }
  };

  return (
    <div
      className={`${styles.notificationItem} ${
        !notification.isRead ? styles.unread : ""
      }`}
      onClick={handleItemClick}
    >
      <div className={styles.notificationHeader}>
        <p className={styles.notificationTitle}>{notification.title}</p>
        <span className={styles.time}>
          {new Date(notification.createdAt).toLocaleString()}
        </span>
      </div>
      <p className={styles.notificationMessage}>{displayMessage}</p>

      {/* Przyciski dla Zaproszenia do Drużyny */}
      {isTeamInvite && !notification.isRead && (
        <div className={styles.actions}>
          <button
            className={styles.acceptButton}
            onClick={handleAcceptInviteClick}
          >
            ✅ Akceptuj
          </button>
          <button
            className={styles.rejectButton}
            onClick={handleRejectInviteClick}
          >
            ❌ Odrzuć
          </button>
        </div>
      )}

      {/* Przyciski dla Prośby o Dołączenie */}
      {isJoinRequest && !notification.isRead && (
        <div className={styles.actions}>
          <button
            className={styles.acceptButton}
            onClick={handleAcceptJoinRequestClick}
            disabled={!targetUserId}
          >
            ✅ Akceptuj
          </button>
          <button
            className={styles.rejectButton}
            onClick={handleRejectJoinRequestClick}
            disabled={!targetUserId}
          >
            ❌ Odrzuć
          </button>
        </div>
      )}
    </div>
  );
};

// --- GŁÓWNY KOMPONENT MODALA ---

const NotificationsModal = ({ notifications, onClose, onRefresh }) => {
  // Sortowanie: najpierw nieprzeczytane, potem wg daty (najnowsze na górze)
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const handleMarkAllAsRead = async () => {
    const token = getCurrentToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/readAll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error("Błąd oznaczania wszystkich jako przeczytane:", e);
    }
  };

  const handleClearAll = async () => {
    if (sortedNotifications.length === 0) return;
    const token = getCurrentToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        onRefresh();
      } else {
        console.error("Nie udało się wyczyścić powiadomień");
      }
    } catch (e) {
      console.error("Błąd czyszczenia historii:", e);
    }
  };

  const hasUnread = sortedNotifications.some((n) => !n.isRead);
  const hasNotifications = sortedNotifications.length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🔔 Powiadomienia</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.controls}>
            <button
              onClick={handleMarkAllAsRead}
              disabled={!hasUnread}
              className={styles.markAllReadButton}
            >
              Oznacz wszystkie
            </button>
            <button
              onClick={handleClearAll}
              disabled={!hasNotifications}
              className={styles.clearAllButton}
              title="Usuń całą historię"
            >
              Wyczyść historię
            </button>
            <button onClick={onRefresh} className={styles.refreshButton} title="Odśwież">
              ↻
            </button>
          </div>

          {sortedNotifications.length === 0 ? (
            <p className={styles.empty}>Brak powiadomień.</p>
          ) : (
            <div className={styles.notificationsList}>
              {sortedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.notificationId}
                  notification={notification}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;