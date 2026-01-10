import React from "react";
import styles from "../styles/components/NotificationsModal.module.css";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

const getCurrentToken = () => localStorage.getItem("jwt_token");

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
    console.error("Error reading user data:", e);
  }
  return null;
};

// --- API ACTIONS ---

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
      onRefresh();
    }
  } catch (e) {
    console.error("Error marking as read:", e);
  }
};

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
      console.error("Error accepting invitation");
    }
  } catch (error) {
    console.error("Error accepting invitation (Fetch Error):", error);
  }
};

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
    console.error("Error accepting join request:", error);
  }
};

const handleRejectJoinRequest = async (
  teamId,
  userIdToReject,
  notificationId,
  onRefresh
) => {
  handleMarkAsRead(notificationId, onRefresh);
};

const handleRejectInvite = async (teamId, notificationId, onRefresh) => {
  handleMarkAsRead(notificationId, onRefresh);
};

// --- COMPONENT: Notification Item ---

const NotificationItem = ({ notification, onRefresh }) => {
  const type = notification.notificationType;
  const teamId = notification.relatedId;
  const notificationId = notification.notificationId;
  const targetUserId = notification.relatedUserId;
  const displayMessage = notification.message;

  // Rozpoznawanie typów
  const isTeamInvite = type === "TeamInvite" && teamId;
  const isJoinRequest = type === "TeamJoinRequest" && teamId;

  // Nowe typy z Backend-u
  const isMatchReport = type === "MatchReport"; // Przeciwnik zgłosił wynik
  const isMatchResult = type === "MatchResult"; // Wynik końcowy (Win/Loss)

  // Ikony w zależności od typu
  let icon = "🔔";
  if (isTeamInvite) icon = "📨";
  if (isJoinRequest) icon = "🙋‍♂️";
  if (isMatchReport) icon = "📝"; // Notatnik/Ołówek dla raportu
  if (isMatchResult) {
    // Sprawdzamy treść, żeby dać odpowiednią ikonę
    if (notification.title?.toLowerCase().includes("zwycięstwo")) icon = "🏆";
    else if (notification.title?.toLowerCase().includes("przegrana"))
      icon = "💀";
    else icon = "⚔️";
  }

  // --- HANDLERS ---

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

  const handleItemClick = () => {
    // Kliknięcie w element oznacza go jako przeczytany (jeśli nie ma akcji)
    if (!notification.isRead) {
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
        <p className={styles.notificationTitle}>
          <span style={{ marginRight: "8px" }}>{icon}</span>
          {notification.title}
        </p>
        <span className={styles.time}>
          {new Date(notification.createdAt).toLocaleString()}
        </span>
      </div>
      <p className={styles.notificationMessage}>{displayMessage}</p>

      {/* AKCJE DLA ZAPROSZEŃ DO DRUŻYNY */}
      {isTeamInvite && !notification.isRead && (
        <div className={styles.actions}>
          <button
            className={styles.acceptButton}
            onClick={handleAcceptInviteClick}
          >
            ✅ Accept
          </button>
          <button
            className={styles.rejectButton}
            onClick={handleRejectInviteClick}
          >
            ❌ Reject
          </button>
        </div>
      )}

      {/* AKCJE DLA PROŚB O DOŁĄCZENIE */}
      {isJoinRequest && !notification.isRead && (
        <div className={styles.actions}>
          <button
            className={styles.acceptButton}
            onClick={handleAcceptJoinRequestClick}
            disabled={!targetUserId}
          >
            ✅ Accept
          </button>
          <button
            className={styles.rejectButton}
            onClick={handleRejectJoinRequestClick}
            disabled={!targetUserId}
          >
            ❌ Reject
          </button>
        </div>
      )}

      {/* INFO DLA MECZÓW (Tylko informacja wizualna, kliknięcie oznacza jako przeczytane) */}
      {(isMatchReport || isMatchResult) && !notification.isRead && (
        <div className={styles.infoFooter}>
          <span style={{ fontSize: "0.8rem", color: "#888" }}>
            {isMatchReport
              ? "Check the tournament bracket to confirm."
              : "Result recorded in bracket."}
          </span>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: Main Modal ---

const NotificationsModal = ({ notifications, onClose, onRefresh }) => {
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
      console.error("Error marking all as read:", e);
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
        console.error("Failed to clear notifications");
      }
    } catch (e) {
      console.error("Error clearing notifications:", e);
    }
  };

  const hasUnread = sortedNotifications.some((n) => !n.isRead);
  const hasNotifications = sortedNotifications.length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>🔔 Notifications</h2>
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
              Mark All Read
            </button>
            <button
              onClick={handleClearAll}
              disabled={!hasNotifications}
              className={styles.clearAllButton}
              title="Delete all history"
            >
              Clear History
            </button>
            <button onClick={onRefresh} className={styles.refreshButton}>
              ↻
            </button>
          </div>

          {sortedNotifications.length === 0 ? (
            <p className={styles.empty}>No notifications.</p>
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
