import React, { useState, useEffect } from "react";
import styles from "../styles/components/titleBar.module.css";
import Button from "./Button";
import logo from "../assets/logo.png";
import defaultAvatar from "../assets/deafultAvatar.jpg";
import { useNavigate } from "react-router-dom";

function TitleBar() {
  const navigate = useNavigate();

  // Domyślne stany
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(null);

  // 1. Przy załadowaniu strony sprawdzamy localStorage (Optimistic UI)
  useEffect(() => {
    const savedUserJSON = localStorage.getItem("currentUser");
    const token = localStorage.getItem("jwt_token");

    if (savedUserJSON && token) {
      try {
        const user = JSON.parse(savedUserJSON);

        // Jeśli w localStorage są dane i flaga isLoggedIn jest true
        if (user && user.isLoggedIn) {
          setIsLoggedIn(true);
          setUsername(user.username);
          setAvatar(user.avatar);
        }
      } catch (e) {
        // Jeśli dane są uszkodzone, czyścimy je
        console.error("Błąd odczytu danych użytkownika", e);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("jwt_token");
      }
    }
  }, []);

  // 2. Funkcja przenosząca na profil
  const goToProfile = () => {
    navigate("/profile");
  };

  // 3. Funkcja wylogowania
  const handleLogout = () => {
    // 🔥 USUNIĘTO: ZBĘDNY I BŁĘDNY FETCH DO BACKENDU DLA LOGOUT

    // Usuwamy klucz autoryzacyjny JWT
    localStorage.removeItem("jwt_token");

    // Czyścimy dane użytkownika z localStorage
    localStorage.removeItem("currentUser");

    // Reset stanów komponentu
    setIsLoggedIn(false);
    setUsername("");
    setAvatar(null);

    // Przekierowanie na logowanie
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      {/* LEWA STRONA: LOGO I TYTUŁ */}
      <div className={styles.titleSection}>
        <div className={styles.logo}>
          <img src={logo} alt="logo" className={styles.logoImage} />
        </div>
        <div className={styles.title}>
          <h2>eSports Tournament organizer</h2>
        </div>
      </div>

      {/* PRAWA STRONA: AUTH */}
      <div className={styles.headerRight}>
        {isLoggedIn ? (
          // --- WIDOK ZALOGOWANEGO ---
          <div className={styles.userInfoContainer}>
            {/* Klikalna sekcja z profilem */}
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

            {/* Przycisk wylogowania */}
            <Button
              name="Log Out"
              onClick={handleLogout}
              className={styles.logoutButton}
            />
          </div>
        ) : (
          // --- WIDOK GOŚCIA ---
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
  );
}

export default TitleBar;
