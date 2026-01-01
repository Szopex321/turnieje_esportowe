import React, { useState } from "react";
import styles from "../styles/pages/auth.module.css";
import { Link, useNavigate } from "react-router-dom";

const LogIn = ({ loadUser }) => {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ZMIANA 1: Zmieniamy nazwę funkcji na bardziej pasującą i zwracamy DANE, a nie true/false
  const fetchUserDetails = async (token) => {
    try {
      const meResponse = await fetch("/api/Auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (meResponse.ok) {
        const userData = await meResponse.json();
        
        // Zapisujemy ID tak jak wcześniej
        if (userData.id) {
          localStorage.setItem("currentUserId", String(userData.id));
        }

        console.log("Pobrano dane użytkownika z /me:", userData);
        return userData; // <--- ZWRACAMY CAŁY OBIEKT (tam powinien być avatar/url)
      }
      return null;
    } catch (err) {
      console.error("Błąd podczas żądania /api/Auth/me:", err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/Auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: login,
          Password: password,
        }),
      });

      if (response.ok) {
        const responseData = await response.json().catch(() => ({}));
        let token = null;

        if (responseData.token) {
          localStorage.setItem("jwt_token", responseData.token);
          token = responseData.token;
        }

        // ZMIANA 2: Pobieramy szczegóły użytkownika (w tym awatar) z endpointu /me
        let detailedUserData = null;
        if (token) {
          detailedUserData = await fetchUserDetails(token);
        }

        // ZMIANA 3: Priorytetyzujemy awatar pobrany z /me (detailedUserData)
        // Sprawdź w konsoli czy backend zwraca pole 'avatar' czy 'url'!
        const finalAvatar = detailedUserData?.avatarUrl || detailedUserData?.avatar || detailedUserData?.url || responseData.avatar || "";

        const userToSave = {
          username: responseData.username || detailedUserData?.username || login,
          avatar: finalAvatar, // <--- Tutaj trafia poprawny link
          role: responseData.role || "user",
          isLoggedIn: true,
        };

        localStorage.setItem("currentUser", JSON.stringify(userToSave));

        if (loadUser) {
          await loadUser();
        } else {
          window.dispatchEvent(new Event("storage"));
        }

        console.log("Zalogowano pomyślnie. Zapisany avatar:", finalAvatar);
        navigate("/");
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Błąd logowania. Sprawdź dane.");
      }
    } catch (err) {
      console.error("Błąd połączenia:", err);
      setError("Wystąpił błąd połączenia z serwerem.");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.authCard}>
        <h2 className={styles.title}>Welcome Back</h2>
        <p className={styles.subtitle}>Log in to manage your tournaments</p>

        {error && (
          <div style={{ color: "red", marginBottom: "10px", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Login</label>
            <input
              type="text"
              className={styles.input}
              placeholder="GamerTag123"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            Log In
          </button>
        </form>

        <p className={styles.footerText}>
          Don't have an account?
          <Link to="/signup" className={styles.link}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LogIn;