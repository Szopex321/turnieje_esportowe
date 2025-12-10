import React, { useState, useEffect, useCallback, useRef } from "react";
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
  if (!token) {
    return { success: false, message: "Missing authorization token" };
  }
  const url = `${API_BASE_URL}/${base}/${endpoint}`;
  const config = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  if (body && (method === "POST" || method === "PUT" || method === "DELETE")) {
    config.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error ${response.status}: ${errorText || response.statusText}`
      );
    }
    if (response.status === 204) {
      return { success: true, data: {} };
    }
    const data = await response.json().catch(() => ({}));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
const formatUserData = (item) => {
  const senderNameValue =
    item.SenderName || item.senderName || item.username || "Anonymous";
  const senderIdValue =
    item.SenderId ||
    item.senderId ||
    item.RequesterId ||
    item.UserId ||
    item.id ||
    0;
  return {
    id: item.id || item.userId || item._id || item.UserId || 0,
    username: item.username || item.Username || senderNameValue,
    avatar: item.avatar || item.avatarUrl || item.AvatarUrl || defaultAvatar,
    isOnline: item.isOnline || item.online || item.IsActive || false,
    displayName: item.displayName || item.username || item.Username,
    requestId: item.requestId || item.RequestId,
    senderId: senderIdValue,
    senderName: senderNameValue,
    createdAt: item.createdAt || item.sentAt || item.SentAt,
  };
};
const checkFriendshipStatus = (
  userId,
  friendsList,
  requestsList,
  currentUserId
) => {
  if (!userId || userId === currentUserId) return "none";
  const isFriend = friendsList.some((friend) => {
    const friendId = friend.id || friend.userId || friend._id;
    return friendId === userId;
  });
  if (isFriend) return "friend";
  const pendingFromUser = requestsList.some((request) => {
    const senderId = request.senderId || request.SenderId;
    return senderId === userId;
  });
  if (pendingFromUser) return "pending_from_them";
  return "none";
};
const FriendsModal = ({ onClose }) => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("friends");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const searchTimeout = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const currentUserId = currentUser.id || currentUser.userId || 0;
  useEffect(() => {
    if (!localStorage.getItem("jwt_token")) {
      setError("Please log in to manage friends.");
    }
  }, []);
  const loadData = useCallback(async () => {
    if (!localStorage.getItem("jwt_token")) return;
    setLoading(true);
    setError(null);
    setMessage(null);
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
        const friendsData = Array.isArray(friendsRes.data)
          ? friendsRes.data
          : friendsRes.data.friends || friendsRes.data.data || [];
        setFriends(friendsData.map(formatUserData));
      } else {
        console.error("Failed to load friends:", friendsRes.message);
      }
      if (requestsRes.success) {
        const requestsData = Array.isArray(requestsRes.data)
          ? requestsRes.data
          : requestsRes.data.requests || requestsRes.data.data || [];
        setRequests(requestsData.map(formatUserData));
      } else {
        setError(
          "Błąd ładowania próśb: Upewnij się, że API /friends/requests działa i zwraca poprawny JSON."
        );
        console.error("Failed to load requests:", requestsRes.message);
      }
      const usersData = Array.isArray(usersRes)
        ? usersRes
        : usersRes.users || usersRes.data || [];
      const formattedUsers = usersData
        .map(formatUserData)
        .filter((user) => user.id !== currentUserId);
      setUsers(formattedUsers);
    } catch (err) {
      setError("Error loading data: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);
  useEffect(() => {
    const updateStatuses = () => {
      if (users.length === 0) return;
      const newStatuses = { ...userStatuses };
      for (const user of users) {
        if (user.id && user.id !== currentUserId) {
          const status = checkFriendshipStatus(
            user.id,
            friends,
            requests,
            currentUserId
          );
          newStatuses[user.id] = status;
        }
      }
      setUserStatuses(newStatuses);
    };
    if (users.length > 0) {
      updateStatuses();
    }
  }, [users, friends, requests, currentUserId]);
  useEffect(() => {
    if (localStorage.getItem("jwt_token")) {
      loadData();
    }
  }, [loadData]);
  const handleRemoveFriend = async (friendId, friendName) => {
    if (!friendId) return;
    setLoading(true);
    const result = await fetchAPI(`remove/${friendId}`, "DELETE");
    if (result.success) {
      setMessage({ type: "success", text: `${friendName} removed` });
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
      setUserStatuses((prev) => ({
        ...prev,
        [friendId]: "none",
      }));
      await loadData();
    } else {
      setMessage({ type: "error", text: `Error: ${result.message}` });
    }
    setLoading(false);
  };
  const sendInvite = async (userId, username) => {
    if (!userId) return;
    setLoading(true);
    const result = await fetchAPI(`invite/${userId}`, "POST");
    if (result.success) {
      setMessage({
        type: "success",
        text: `Invitation sent to ${username}`,
      });
      setSearch("");
      setSearchResults([]);
      setActiveTab("requests");
      setUserStatuses((prev) => ({
        ...prev,
        [userId]: "pending_from_me",
      }));
    } else {
      setMessage({ type: "error", text: `Błąd wysyłania: ${result.message}` });
    }
    setLoading(false);
  };
  const handleRequest = async (type, requesterId, requesterName) => {
    if (!requesterId || requesterId === 0) {
      setMessage({
        type: "error",
        text: "Błąd: Brak poprawnego ID nadawcy prośby (ID: 0).",
      });
      console.error("Missing Requester ID for action:", type);
      return;
    }
    setLoading(true);
    let endpoint;
    let method;
    if (type === "accept") {
      endpoint = `accept/${requesterId}`;
      method = "POST";
    } else {
      endpoint = `remove/${requesterId}`;
      method = "DELETE";
    }
    const result = await fetchAPI(endpoint, method);
    if (result.success) {
      setMessage({
        type: "success",
        text: `Invitation ${type === "accept" ? "accepted" : "declined"}`,
      });
      setRequests((prev) =>
        prev.filter((req) => {
          const reqId = req.senderId;
          return reqId !== requesterId;
        })
      );
      if (type === "accept") {
        await loadData();
      }
      setUserStatuses((prev) => ({
        ...prev,
        [requesterId]: type === "accept" ? "friend" : "none",
      }));
    } else {
      setMessage({ type: "error", text: `Error: ${result.message}` });
    }
    setLoading(false);
  };
  const handleSearch = useCallback(
    (query) => {
      if (query.trim().length < 3) {
        setSearchResults([]);
        return;
      }
      const results = users.filter((user) => {
        if (user.id === currentUserId) return false;
        return (
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(query.toLowerCase())
        );
      });
      setSearchResults(results);
    },
    [users, currentUserId]
  );
  const handleSearchChange = (value) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length >= 3) {
      searchTimeout.current = setTimeout(() => handleSearch(value), 300);
    } else {
      setSearchResults([]);
    }
  };
  const renderInviteButton = (user) => {
    const status = userStatuses[user.id] || "checking";
    switch (status) {
      case "friend":
        return (
          <button className={styles.friendBtn} disabled>
            ✓ Friend
          </button>
        );
      case "pending_from_them":
        return (
          <button
            className={styles.pendingBtn}
            onClick={() => setActiveTab("requests")}
          >
            📩 Invitation to You
          </button>
        );
      case "pending_from_me":
        return (
          <button className={styles.pendingBtn} disabled>
            ⏳ Invitation Sent
          </button>
        );
      case "checking":
        return (
          <button className={styles.inviteBtn} disabled>
            Checking...
          </button>
        );
      case "error":
        return (
          <button className={styles.errorBtn} disabled>
            Error
          </button>
        );
      case "none":
      default:
        return (
          <button
            className={styles.inviteBtn}
            onClick={() => sendInvite(user.id, user.username)}
            disabled={loading}
          >
            Invite
          </button>
        );
    }
  };
  const renderUserItem = (user, type = "friend") => {
    const uniqueKey = `${type}-${
      user.requestId || user.id || user.senderId || new Date().getTime()
    }`;
    return (
      <div key={uniqueKey} className={styles.userItem}>
        <img
          src={user.avatar}
          alt={user.username}
          className={styles.avatar}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultAvatar;
          }}
        />
        <div className={styles.userInfo}>
          <span className={styles.username}>
            {type === "request"
              ? user.senderName
              : user.displayName || user.username}
          </span>
          {user.displayName && user.displayName !== user.username && (
            <span className={styles.userHandle}>@{user.username}</span>
          )}
          {type === "request" && user.createdAt && (
            <span className={styles.requestTime}>
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
        {type === "friend" && (
          <div className={styles.actions}>
            <span
              className={`${styles.status} ${
                user.isOnline ? styles.online : styles.offline
              }`}
            >
              {user.isOnline ? "ONLINE" : "OFFLINE"}
            </span>
            <button
              className={styles.removeBtn}
              onClick={() => handleRemoveFriend(user.id, user.username)}
              disabled={loading}
            >
              Remove
            </button>
          </div>
        )}
        {type === "request" && (
          <div className={styles.actions}>
            <button
              className={styles.acceptBtn}
              onClick={() =>
                handleRequest(
                  "accept",
                  user.senderId,
                  user.senderName || user.username
                )
              }
              disabled={loading}
            >
              ✓
            </button>
            <button
              className={styles.rejectBtn}
              onClick={() =>
                handleRequest(
                  "decline",
                  user.senderId,
                  user.senderName || user.username
                )
              }
              disabled={loading}
            >
              ✕
            </button>
          </div>
        )}
        {type === "search" && (
          <div className={styles.searchActions}>{renderInviteButton(user)}</div>
        )}
      </div>
    );
  };
  const renderContent = () => {
    if (loading && activeTab !== "send") {
      return (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadData}>Try Again</button>
        </div>
      );
    }
    switch (activeTab) {
      case "friends":
        return friends.length === 0 ? (
          <div className={styles.empty}>
            <p>No Friends</p>
            <button onClick={() => setActiveTab("send")}>Add Friends</button>
          </div>
        ) : (
          <div className={styles.list}>
            {friends.map((user) => renderUserItem(user, "friend"))}
          </div>
        );
      case "requests":
        return requests.length === 0 ? (
          <div className={styles.empty}>
            <p>No Pending Requests</p>
          </div>
        ) : (
          <div className={styles.list}>
            {requests.map((user) => renderUserItem(user, "request"))}
          </div>
        );
      case "send":
        return (
          <div className={styles.sendTab}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search users (min. 3 chars)..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={styles.results}>
              {searchResults.length > 0 ? (
                searchResults.map((user) => renderUserItem(user, "search"))
              ) : search.length >= 3 ? (
                <p className={styles.noResults}>No Results Found</p>
              ) : (
                <p className={styles.infoText}>
                  {search.length > 0
                    ? "Type at least 3 characters"
                    : "Search users to add friends"}
                </p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
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
          <button
            className={`${styles.tab} ${
              activeTab === "friends" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("friends")}
          >
            Friends ({friends.length})
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "requests" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("requests")}
          >
            Requests ({requests.length})
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "send" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("send")}
          >
            Add
          </button>
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
        <div className={styles.content}>{renderContent()}</div>
      </div>
    </div>
  );
};
export default FriendsModal;
