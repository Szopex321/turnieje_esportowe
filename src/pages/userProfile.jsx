import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import styles from "../styles/pages/userProfile.module.css";
import defaultAvatar from "../assets/deafultAvatar.jpg"; // Pamiętaj o swojej literówce w nazwie pliku ;)

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Pobieramy dane z localStorage przy wejściu
  useEffect(() => {
    const savedUserJSON = localStorage.getItem("currentUser");
    if (savedUserJSON) {
      try {
        setUser(JSON.parse(savedUserJSON));
      } catch (e) {
        console.error("Błąd odczytu danych użytkownika");
      }
    } else {
      // Jeśli nie jest zalogowany, a próbuje wejść na profil -> login
      navigate("/login");
    }
  }, [navigate]);

  if (!user)
    return (
      <div style={{ color: "white", padding: 20 }}>Loading profile...</div>
    );

  return (
    <div className={styles.pageWrapper}>
      {/* 1. TitleBar na górze */}
      <TitleBar />

      <div className={styles.contentContainer}>
        {/* 2. Nav po lewej */}
        <Nav />

        {/* 3. Główna treść - Karta Profilu */}
        <main className={styles.mainContent}>
          <div className={styles.profileCard}>
            {/* Nagłówek z dużym avatarem */}
            <div className={styles.cardHeader}>
              <img
                src={user.avatar || defaultAvatar}
                alt="Profile"
                className={styles.largeAvatar}
              />
              <div className={styles.headerInfo}>
                <h2>{user.username}</h2>
                <p>{user.email || "No email provided"}</p>
                {/* Wyświetlamy rolę jeśli istnieje (np. ADMIN) */}
                {user.role && (
                  <span className={styles.roleBadge}>{user.role}</span>
                )}
              </div>
            </div>

            {/* Szczegóły użytkownika */}
            <div className={styles.detailsGrid}>
              <div className={styles.infoGroup}>
                <label className={styles.label}>First Name</label>
                <div className={styles.valueBox}>{user.firstName || "-"}</div>
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.label}>Last Name</label>
                <div className={styles.valueBox}>{user.lastName || "-"}</div>
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.label}>Username</label>
                <div className={styles.valueBox}>{user.username}</div>
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.label}>Account Status</label>
                <div className={styles.valueBox} style={{ color: "#4ade80" }}>
                  Active
                </div>
              </div>
            </div>

            {/* Przycisk akcji */}
            <button
              className={styles.actionButton}
              onClick={() => alert("Funkcja edycji wkrótce!")}
            >
              Edit Profile
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
