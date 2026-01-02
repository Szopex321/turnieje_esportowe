import React, { useState, useEffect } from "react";
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

const fetchUsernameById = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error("Failed to fetch users");
    const data = await response.json();
    const user = data.find((u) => u.userId === userId);
    return user ? user.username : `ID ${userId}`;
  } catch (e) {
    console.error(`Error fetching username for ID ${userId}:`, e);
    return `ID ${userId}`;
  }
};

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
    } else {
      console.error("Failed to mark notification as read:", response.status);
    }
  } catch (e) {
    console.error("Error marking as read:", e);
  }
};

const handleAcceptInvite = async (teamId, notificationId, onRefresh) => {
  const token = getCurrentToken();
  if (!token) {
    console.error("No authentication token.");
    return;
  }
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
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Error accepting invitation:",
        errorData.message || `Error ${response.status} while joining team.`
      );
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
  if (!currentUser || !currentUser.token) {
    console.error("You must be logged in");
    return;
  }
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
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "Error accepting player:",
        errorData.message || "Error accepting player"
      );
    }
  } catch (error) {
    console.error("Error accepting join request (Fetch Error):", error);
  }
};

const handleRejectJoinRequest = async (
  teamId,
  userIdToReject,
  notificationId,
  onRefresh
) => {
  console.log(
    `❌ Join request from player ID: ${userIdToReject} rejected (marked as read).`
  );
  handleMarkAsRead(notificationId, onRefresh);
};

const handleRejectInvite = async (teamId, notificationId, onRefresh) => {
  console.log(`❌ Team invitation ID: ${teamId} rejected (marked as read).`);
  handleMarkAsRead(notificationId, onRefresh);
};

const NotificationItem = ({ notification, onRefresh }) => {
  const [displayMessage, setDisplayMessage] = useState(notification.message);

  const isTeamInvite =
    notification.notificationType === "TeamInvite" && notification.relatedId;
  const isJoinRequest =
    notification.notificationType === "TeamJoinRequest" &&
    notification.relatedId;
  const teamId = notification.relatedId;
  const notificationId = notification.notificationId;
  const targetUserId = notification.relatedUserId;

  useEffect(() => {
    const friendRequestPattern = /Użytkownik Ktoś \(ID:\s*(\d+)\)/;

    if (
      notification.notificationType === "FriendRequest" &&
      friendRequestPattern.test(notification.message)
    ) {
      const match = notification.message.match(friendRequestPattern);
      if (match) {
        const problematicId = parseInt(match[1], 10);
        if (problematicId) {
          fetchUsernameById(problematicId).then((username) => {
            const newMessage = notification.message.replace(
              friendRequestPattern,
              `Użytkownik ${username}`
            );
            setDisplayMessage(newMessage);
          });
        }
      }
    } else {
      setDisplayMessage(notification.message);
    }
  }, [notification.message, notification.notificationType]);

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
      console.error(
        "Error: Cannot identify player ID for acceptance (missing RelatedUserId)."
      );
      handleMarkAsRead(notificationId, onRefresh);
    }
  };

  const handleRejectJoinRequestClick = (e) => {
    e.stopPropagation();
    if (targetUserId) {
      handleRejectJoinRequest(teamId, targetUserId, notificationId, onRefresh);
    } else {
      console.error("Error: Cannot identify player ID for rejection.");
      handleMarkAsRead(notificationId, onRefresh);
    }
  };

  const handleItemClick = () => {
    if (!isTeamInvite && !isJoinRequest && !notification.isRead) {
      handleMarkAsRead(notificationId, onRefresh);
    }
  };

  return (
    <div
      key={notificationId}
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

      {isTeamInvite && !notification.isRead && (
        <div className={styles.actions}>
          <button
            className={styles.acceptButton}
            onClick={handleAcceptInviteClick}
          >
            ✅ Accept Invitation
          </button>
          <button
            className={styles.rejectButton}
            onClick={handleRejectInviteClick}
          >
            ❌ Reject Invitation
          </button>
        </div>
      )}

      {isJoinRequest && !notification.isRead && (
        <div className={styles.actions}>
          <button
            className={styles.acceptButton}
            onClick={handleAcceptJoinRequestClick}
            disabled={!targetUserId}
          >
            ✅ Accept Player
          </button>
          <button
            className={styles.rejectButton}
            onClick={handleRejectJoinRequestClick}
            disabled={!targetUserId}
          >
            ❌ Reject Request
          </button>
        </div>
      )}

      {!isTeamInvite && !isJoinRequest && !notification.isRead && (
        <button
          className={styles.markReadButton}
          onClick={(e) => {
            e.stopPropagation();
            handleMarkAsRead(notificationId, onRefresh);
          }}
        >
          ✓ Mark as Read
        </button>
      )}
    </div>
  );
};

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

  const hasUnread = sortedNotifications.some((n) => !n.isRead);

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
              Mark All as Read
            </button>
            <button onClick={onRefresh} className={styles.refreshButton}>
              Refresh
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
