/* eslint-disable no-irregular-whitespace */
import React, { useState, useEffect, useCallback } from "react";
import styles from "../styles/components/titleBar.module.css";
import Button from "./Button";
import logo from "../assets/logo.png";
import defaultAvatar from "../assets/deafultAvatar.jpg";
import { useNavigate } from "react-router-dom";
import FriendsModal from "./FriendsModal";
import friendsIcon from "../assets/friendsIcon.png";
import NotificationsModal from "./NotificationsModal";
import MyTeamsModal from "./MyTeamsModal"; // 1. Importuj nowy modal
import { Bell, Users } from "lucide-react";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

function TitleBar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] =
    useState(false);
  const [isMyTeamsModalOpen, setIsMyTeamsModalOpen] = useState(false); // 2. Stan widoczności modalu drużyn
  const [teams, setTeams] = useState([]); // 3. Stan na dane drużyn
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // 4. Funkcja pobierająca drużyny (potrzebna dla MyTeamsModal)
  const fetchAllTeams = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`);
      if (response.ok) {
        const data = await response.json();
        // Mapujemy dane, aby pasowały do formatu oczekiwanego przez MyTeamsModal
        const mappedTeams = data.map((team) => ({
          id: team.teamId,
          name: team.teamName,
          captainId: team.captainId,
          logo:
            team.logoUrl ||
            `https://placehold.co/150/999999/FFFFFF?text=${(
              team.teamName || "T"
            )
              .substring(0, 2)
              .toUpperCase()}`,
          players: team.teamMembers
            ? team.teamMembers.map((m) => ({ userId: m.userId }))
            : [],
          activePlayers: team.teamMembers
            ? team.teamMembers.filter((m) => m.status === "Member")
            : [],
        }));
        setTeams(mappedTeams);
      }
    } catch (error) {
      console.error("Błąd pobierania drużyn:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("jwt_token");
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        const unreadCount = data.filter(
          (notification) => !notification.isRead
        ).length;
        setUnreadNotifications(unreadCount);
      }
    } catch (error) {
      console.error("Błąd pobierania powiadomień:", error);
    }
  }, []);

  useEffect(() => {
    const savedUserJSON = localStorage.getItem("currentUser");
    const token = localStorage.getItem("jwt_token");
    const savedUserId = localStorage.getItem("currentUserId");
    if (savedUserJSON && token) {
      try {
        const user = JSON.parse(savedUserJSON);
        if (user && user.isLoggedIn) {
          setIsLoggedIn(true);
          setUsername(user.username);
          setAvatar(user.avatar);
          if (savedUserId) {
            setUserId(parseInt(savedUserId, 10));
          }
          fetchNotifications();
          fetchAllTeams(); // Pobierz drużyny po zalogowaniu
          const interval = setInterval(fetchNotifications, 30000);
          return () => clearInterval(interval);
        }
      } catch (e) {
        console.error("Błąd odczytu danych użytkownika", e);
        localStorage.clear();
      }
    }
  }, [fetchNotifications, fetchAllTeams]);

  const goToProfile = () => {
    navigate("/profile");
  };

  const toggleFriendsModal = () => {
    setIsFriendsModalOpen((prev) => !prev);
  };

  const toggleNotificationsModal = () => {
    setIsNotificationsModalOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUserId");
    setIsLoggedIn(false);
    setUsername("");
    setAvatar(null);
    setUserId(null);
    setNotifications([]);
    setUnreadNotifications(0);
    navigate("/login");
  };

  const handleRefreshNotifications = () => {
    fetchNotifications();
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <div
            className={styles.logo}
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <img src={logo} alt="logo" className={styles.logoImage} />
          </div>
          <div className={styles.title}>
            <h2>eSports Tournament organizer</h2>
          </div>
        </div>

        <div className={styles.headerRight}>
          {isLoggedIn ? (
            <div className={styles.userInfoContainer}>
              {/* ZMIENIONO: Przycisk teraz otwiera modal */}
              <button
                onClick={() => setIsMyTeamsModalOpen(true)}
                className={styles.iconButton}
                title="My Teams"
              >
                <Users size={24} className={styles.teamIcon} />
              </button>

              <button
                onClick={toggleNotificationsModal}
                className={styles.notificationButton}
                title="Notifications"
              >
                <Bell size={24} className={styles.notificationIcon} />
                {unreadNotifications > 0 && (
                  <span className={styles.notificationBadge}>
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>

              <button
                onClick={toggleFriendsModal}
                className={styles.friendsIconButton}
                title="Friends"
              >
                <img
                  src={friendsIcon}
                  alt="Friends Icon"
                  className={styles.friendsIcon}
                />
              </button>

              <div
                className={styles.userProfile}
                onClick={goToProfile}
                style={{ cursor: "pointer" }}
                title="Go to profile"
              >
                <span className={styles.welcomeText}>
                  Welcome, <strong>{username}</strong>
                </span>
                <img
                  src={avatar || defaultAvatar}
                  alt="User Avatar"
                  className={styles.userAvatar}
                />
              </div>

              <Button
                name="Log Out"
                onClick={handleLogout}
                className={styles.logoutButton}
              />
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Button
                name="log in"
                onClick={() => navigate("/login")}
                className={styles.logInButton}
              />
              <Button
                name="sign up"
                onClick={() => navigate("/signup")}
                className={styles.signUpButton}
              />
            </div>
          )}
        </div>
      </header>

      {/* MODALE */}
      {isFriendsModalOpen && <FriendsModal onClose={toggleFriendsModal} />}

      {isNotificationsModalOpen && (
        <NotificationsModal
          notifications={notifications}
          onClose={toggleNotificationsModal}
          onRefresh={handleRefreshNotifications}
        />
      )}

      {/* 5. Renderowanie Modalu Moich Drużyn */}
      {isMyTeamsModalOpen && (
        <MyTeamsModal
          teams={teams}
          currentUserId={userId}
          onClose={() => setIsMyTeamsModalOpen(false)}
          onSelectTeam={(team) => {
            navigate(`/teams?id=${team.id}`);
            setIsMyTeamsModalOpen(false);
          }}
        />
      )}
    </>
  );
}

export default TitleBar;
