import React, { useState, useEffect, useCallback } from "react";
import styles from "../styles/components/titleBar.module.css";
import Button from "./Button";
import logo from "../assets/logo.png";
import defaultAvatar from "../assets/deafultAvatar.jpg";
import { useNavigate } from "react-router-dom";
import FriendsModal from "./FriendsModal";
import NotificationsModal from "./NotificationsModal";
import MyTeamsModal from "./MyTeamsModal";
import TeamDetailsModal from "./TeamDetailsModal";
import { Bell, Users, Flag } from "lucide-react";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

function TitleBar() {
  const navigate = useNavigate();

  // Stany użytkownika
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [userId, setUserId] = useState(null);

  // Stany widoczności modali
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isMyTeamsModalOpen, setIsMyTeamsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Dane aplikacji
  const [selectedTeamForDetails, setSelectedTeamForDetails] = useState(null);
  const [teams, setTeams] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Sprawdza poprawność URL avatara, zwracając domyślny w razie błędu
  const getValidAvatar = useCallback((url) => {
    if (!url || url === "string" || url.includes("pravatar.cc")) {
      return defaultAvatar;
    }
    return url;
  }, []);

  // Pobiera listę drużyn i mapuje strukturę danych pod widok (w tym obsługę brakujących logo)
  const fetchAllTeams = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teams`);
      if (response.ok) {
        const data = await response.json();
        const mappedTeams = data.map((team) => ({
          id: team.teamId,
          name: team.teamName,
          description: team.description,
          captainId: team.captainId,
          logo: team.logoUrl || `https://placehold.co/150/999999/FFFFFF?text=${(team.teamName || "T").substring(0, 2).toUpperCase()}`,
          players: team.teamMembers
            ? team.teamMembers.map((m) => ({
                userId: m.user?.userId || m.userId,
                username: m.user?.username || "Gracz",
                avatarUrl: getValidAvatar(m.user?.avatarUrl),
                status: m.status,
              }))
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
  }, [getValidAvatar]);

  // Pobiera powiadomienia dla zalogowanego użytkownika i zlicza nieprzeczytane
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
        const unreadCount = data.filter((notification) => !notification.isRead).length;
        setUnreadNotifications(unreadCount);
      }
    } catch (error) {
      console.error("Błąd pobierania powiadomień:", error);
    }
  }, []);

  // Inicjalizacja: przywracanie sesji z localStorage i ustawienie interwału odświeżania
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
          fetchAllTeams();
          
          const interval = setInterval(fetchNotifications, 30000);
          return () => clearInterval(interval);
        }
      } catch (e) {
        console.error("Błąd odczytu danych użytkownika", e);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("currentUserId");
      }
    }
  }, [fetchNotifications, fetchAllTeams]);

  // Nawigacja i obsługa modali
  const goToProfile = () => navigate("/profile");
  const goToMyTeams = () => setIsMyTeamsModalOpen(true);
  const toggleFriendsModal = () => setIsFriendsModalOpen((prev) => !prev);
  const toggleNotificationsModal = () => setIsNotificationsModalOpen((prev) => !prev);

  // Wylogowanie: czyszczenie danych lokalnych i reset stanu
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

  const handleRefreshNotifications = () => fetchNotifications();

  const handleSelectTeamFromList = (team) => {
    setSelectedTeamForDetails(team);
    setIsDetailsModalOpen(true);
    setIsMyTeamsModalOpen(false);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.logo} onClick={() => navigate("/")}>
            <img src={logo} alt="logo" className={styles.logoImage} />
          </div>
          <div className={styles.title}>
            <h2>eSports Tournament organizer</h2>
          </div>
        </div>

        <div className={styles.headerRight}>
          {isLoggedIn ? (
            <div className={styles.userInfoContainer}>
              <button onClick={goToMyTeams} className={styles.iconButton} title="My Teams">
                <Flag size={24} className={styles.teamIcon} />
              </button>

              <button onClick={toggleNotificationsModal} className={styles.notificationButton} title="Notifications">
                <Bell size={24} className={styles.notificationIcon} />
                {unreadNotifications > 0 && (
                  <span className={styles.notificationBadge}>
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>

              <button onClick={toggleFriendsModal} className={styles.friendsIconButton} title="Friends">
                <Users size={24} className={styles.friendsIcon} />
              </button>

              <div className={styles.userProfile} onClick={goToProfile} title="Go to profile">
                <span className={styles.welcomeText}>
                  Welcome, <strong>{username}</strong>
                </span>
                <img src={avatar || defaultAvatar} alt="User Avatar" className={styles.userAvatar} />
              </div>

              <Button name="Log Out" onClick={handleLogout} className={styles.logoutButton} />
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Button name="log in" onClick={() => navigate("/login")} className={styles.logInButton} />
              <Button name="sign up" onClick={() => navigate("/signup")} className={styles.signUpButton} />
            </div>
          )}
        </div>
      </header>

      {isFriendsModalOpen && <FriendsModal onClose={toggleFriendsModal} />}
      
      {isNotificationsModalOpen && (
        <NotificationsModal
          notifications={notifications}
          onClose={toggleNotificationsModal}
          onRefresh={handleRefreshNotifications}
        />
      )}

      {isMyTeamsModalOpen && (
        <MyTeamsModal
          teams={teams}
          currentUserId={userId}
          onClose={() => setIsMyTeamsModalOpen(false)}
          onSelectTeam={handleSelectTeamFromList}
        />
      )}

      {isDetailsModalOpen && selectedTeamForDetails && (
        <TeamDetailsModal
          team={selectedTeamForDetails}
          onClose={() => setIsDetailsModalOpen(false)}
          onRefresh={fetchAllTeams}
          onNotificationsRefresh={handleRefreshNotifications}
        />
      )}
    </>
  );
}

export default TitleBar;