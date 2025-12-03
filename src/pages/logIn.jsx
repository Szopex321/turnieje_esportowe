import React, { useState } from "react";
import styles from "../styles/pages/auth.module.css";
import { Link, useNavigate } from "react-router-dom";

const LogIn = ({ loadUser }) => {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

        if (responseData.token) {
          localStorage.setItem("jwt_token", responseData.token);
          console.log("Token JWT zapisany.");
        }

        const userToSave = {
          username: responseData.username || login,
          avatar: responseData.avatar || "",
          role: responseData.role || "user",
          isLoggedIn: true,
        };

        localStorage.setItem("currentUser", JSON.stringify(userToSave));

        if (loadUser) {
          await loadUser();
        } else {
          window.dispatchEvent(new Event("storage"));
        }

        console.log("Zalogowano pomyślnie.");
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
          <div
            style={{ color: "red", marginBottom: "10px", textAlign: "center" }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
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
