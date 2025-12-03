import React, { useState, useEffect } from "react";
import styles from "../styles/components/titleBar.module.css";
import Button from "./Button";
import logo from "../assets/logo.png";
import defaultAvatar from "../assets/deafultAvatar.jpg";
import { useNavigate } from "react-router-dom";

function TitleBar() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const savedUserJSON = localStorage.getItem("currentUser");
    const token = localStorage.getItem("jwt_token");

    if (savedUserJSON && token) {
      try {
        const user = JSON.parse(savedUserJSON);
        if (user && user.isLoggedIn) {
          setIsLoggedIn(true);
          setUsername(user.username);
          setAvatar(user.avatar);
        }
      } catch (e) {
        console.error("Błąd odczytu danych użytkownika", e);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("jwt_token");
      }
    }
  }, []);

  const goToProfile = () => {
    navigate("/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("currentUser");

    setIsLoggedIn(false);
    setUsername("");
    setAvatar(null);

    fetch("/api/auth/logout", { method: "POST" }).catch((err) =>
      console.log("Backend logout ignored")
    );

    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.titleSection}>
        <div className={styles.logo}>
          <img src={logo} alt="logo" className={styles.logoImage} />
        </div>
        <div className={styles.title}>
          <h2>eSports Tournament organizer</h2>
        </div>
      </div>

      <div className={styles.headerRight}>
        {isLoggedIn ? (
          <div className={styles.userInfoContainer}>
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
  );
}

export default TitleBar;
