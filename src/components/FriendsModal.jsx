import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import styles from "../styles/components/FriendsModal.module.css";
import defaultAvatar from "../assets/deafultAvatar.jpg";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

const fetchAPI = async (
  endpoint,
  method = "GET",
  body = null,
  base = "friends"
) => {
  const token = localStorage.getItem("jwt_token");
  if (!token) return { success: false, message: "Brak tokenu autoryzacji" };

  const config = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (body && ["POST", "PUT", "DELETE"].includes(method)) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${base}/${endpoint}`, config);

    if (response.status === 204) return { success: true, data: {} };

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Błąd ${response.status}: ${errorText || response.statusText}`
      );
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const formatUserData = (item) => {
  return {
    id: parseInt(item.id || item.userId || item._id || item.UserId || 0, 10),
    username: item.username || item.Username || item.SenderName || "Unknown",
    avatar: item.avatar || item.avatarUrl || item.AvatarUrl || defaultAvatar,
    isOnline: item.isOnline || item.online || item.IsActive || false,
    displayName: item.displayName || item.username || item.Username,
    requestId: item.requestId || item.RequestId,
    senderId: parseInt(
      item.SenderId || item.senderId || item.RequesterId || 0,
      10
    ),
    senderName: item.SenderName || item.senderName || item.username,
    createdAt: item.createdAt || item.sentAt || item.SentAt,
  };
};

const FriendsModal = ({ onClose }) => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("friends");
  const [searchTerm, setSearchTerm] = useState("");

  const searchTimeoutRef = useRef(null);

  const currentUserId = useMemo(() => {
    const directId = localStorage.getItem("currentUserId");
    if (directId) return parseInt(directId, 10);

    try {
      const userObj = JSON.parse(localStorage.getItem("currentUser") || "{}");
      return parseInt(userObj.id || userObj.userId || 0, 10);
    } catch {
      return 0;
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!localStorage.getItem("jwt_token")) return;
    setLoading(true);
    setError(null);

    try {
      const [friendsRes, requestsRes, usersRes] = await Promise.all([
        fetchAPI("", "GET"),
        fetchAPI("requests", "GET"),
        fetch(`${API_BASE_URL}/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
          },
        }).then((r) => r.json().catch(() => ({}))),
      ]);

      if (friendsRes.success) {
        const rawFriends = Array.isArray(friendsRes.data)
          ? friendsRes.data
          : friendsRes.data.friends || [];
        setFriends(rawFriends.map(formatUserData));
      }

      if (requestsRes.success) {
        const rawRequests = Array.isArray(requestsRes.data)
          ? requestsRes.data
          : requestsRes.data.requests || [];
        setRequests(rawRequests.map(formatUserData));
      }

      const rawUsers = Array.isArray(usersRes)
        ? usersRes
        : usersRes.users || [];
      const formattedUsers = rawUsers
        .map(formatUserData)
        .filter((u) => u.id !== currentUserId);
      setAllUsers(formattedUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemoveFriend = async (friendId, friendName) => {
    if (!window.confirm(`Are you sure you want to remove ${friendName}?`))
      return;

    const result = await fetchAPI(`remove/${friendId}`, "DELETE");
    if (result.success) {
      setMessage({ type: "success", text: `${friendName} removed` });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } else {
      setMessage({ type: "error", text: result.message });
    }
  };

  const handleRequestAction = async (action, requesterId) => {
    const endpoint =
      action === "accept" ? `accept/${requesterId}` : `remove/${requesterId}`;
    const method = action === "accept" ? "POST" : "DELETE";

    const result = await fetchAPI(endpoint, method);
    if (result.success) {
      setMessage({
        type: "success",
        text: `Request ${action === "accept" ? "accepted" : "declined"}`,
      });

      setRequests((prev) => prev.filter((r) => r.senderId !== requesterId));

      if (action === "accept") {
        const newFriend =
          allUsers.find((u) => u.id === requesterId) ||
          requests.find((r) => r.senderId === requesterId);
        if (newFriend)
          setFriends((prev) => [...prev, formatUserData(newFriend)]);
      }
    } else {
      setMessage({ type: "error", text: result.message });
    }
  };

  const sendInvite = async (userId, username) => {
    const result = await fetchAPI(`invite/${userId}`, "POST");
    if (result.success) {
      setMessage({ type: "success", text: `Invite sent to ${username}` });
      setSearchTerm("");
      setActiveTab("requests");
    } else {
      setMessage({ type: "error", text: result.message });
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (value.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      const lowerQuery = value.toLowerCase();
      const results = allUsers.filter((user) => {
        if (user.id === currentUserId) return false;

        return (
          user.username.toLowerCase().includes(lowerQuery) ||
          user.displayName?.toLowerCase().includes(lowerQuery)
        );
      });
      setSearchResults(results);
    }, 300);
  };

  const getFriendshipStatus = (userId) => {
    if (userId === currentUserId) return "self";
    if (friends.some((f) => f.id === userId)) return "friend";
    if (requests.some((r) => r.senderId === userId)) return "pending_received";
    return "none";
  };

  const UserItem = ({ user, type }) => {
    const status = getFriendshipStatus(user.id);

    if (user.id === currentUserId) return null;

    let subText = null;
    if (type === "request" && user.createdAt) {
      subText = new Date(user.createdAt).toLocaleDateString();
    } else if (type === "request") {
      subText = "Pending request";
    }

    return (
      <div className={styles.userItem}>
        <img
          src={user.avatar}
          alt="avatar"
          className={styles.avatar}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultAvatar;
          }}
        />

        <div className={styles.userInfo}>
          <span className={styles.username}>
            {type === "request" ? user.senderName : user.displayName}
          </span>
          {subText && (
            <span
              className={styles.userHandle}
              style={{ fontSize: "0.8rem", color: "#888" }}
            >
              {subText}
            </span>
          )}
        </div>

        <div className={styles.actions}>
          {type === "friend" && (
            <>
              <span
                className={`${styles.status} ${
                  user.isOnline ? styles.online : styles.offline
                }`}
              >
                {user.isOnline ? "ON" : "OFF"}
              </span>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemoveFriend(user.id, user.username)}
              >
                Remove
              </button>
            </>
          )}

          {type === "request" && (
            <>
              <button
                className={styles.acceptBtn}
                onClick={() => handleRequestAction("accept", user.senderId)}
              >
                ✓
              </button>
              <button
                className={styles.rejectBtn}
                onClick={() => handleRequestAction("remove", user.senderId)}
              >
                ✕
              </button>
            </>
          )}

          {type === "search" && (
            <>
              {status === "friend" && (
                <button className={styles.friendBtn} disabled>
                  ✓ Friend
                </button>
              )}
              {status === "pending_received" && (
                <button
                  className={styles.pendingBtn}
                  onClick={() => setActiveTab("requests")}
                >
                  Check Inbox
                </button>
              )}
              {status === "none" && user.id !== currentUserId && (
                <button
                  className={styles.inviteBtn}
                  onClick={() => sendInvite(user.id, user.username)}
                >
                  + Invite
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>FRIENDS</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.tabs}>
          {["friends", "requests", "send"].map((tab) => (
            <button
              key={tab}
              className={`${styles.tab} ${
                activeTab === tab ? styles.active : ""
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "friends" && ` (${friends.length})`}
              {tab === "requests" &&
                requests.length > 0 &&
                ` (${requests.length})`}
            </button>
          ))}
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className={styles.messageClose}
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.content}>
          {loading && !allUsers.length ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <>
              {activeTab === "friends" &&
                (friends.length === 0 ? (
                  <div className={styles.empty}>
                    <p>No friends yet.</p>
                  </div>
                ) : (
                  <div className={styles.list}>
                    {friends.map((u) => (
                      <UserItem key={u.id} user={u} type="friend" />
                    ))}
                  </div>
                ))}

              {activeTab === "requests" &&
                (requests.length === 0 ? (
                  <div className={styles.empty}>
                    <p>No pending requests.</p>
                  </div>
                ) : (
                  <div className={styles.list}>
                    {requests.map((u) => (
                      <UserItem key={u.senderId} user={u} type="request" />
                    ))}
                  </div>
                ))}

              {activeTab === "send" && (
                <div className={styles.sendTab}>
                  <div className={styles.searchBox}>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <div className={styles.results}>
                    {searchResults.map((u) => (
                      <UserItem key={u.id} user={u} type="search" />
                    ))}
                    {searchTerm.length >= 3 && searchResults.length === 0 && (
                      <p className={styles.noResults}>No users found.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsModal;
