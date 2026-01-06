import React, { useEffect, useState } from "react";
import styles from "../styles/components/nav.module.css";
import NavButton from "./navButton";

function Nav() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Funkcja sprawdzająca uprawnienia
  const checkAdminRole = () => {
    // 1. Pobieramy obiekt currentUser (nie sam token!)
    const userJson = localStorage.getItem("currentUser");

    if (!userJson) {
      setIsAdmin(false);
      return;
    }

    try {
      const user = JSON.parse(userJson);
      
      // 2. Sprawdzamy czy rola to admin (z małej lub dużej litery dla pewności)
      if (user.role === "admin" || user.role === "Admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      console.error("Błąd odczytu danych użytkownika:", e);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Sprawdź przy wejściu na stronę
    checkAdminRole();

    // Nasłuchuj na zdarzenie logowania (żeby przycisk pojawił się od razu)
    const handleAuthChange = () => checkAdminRole();
    window.addEventListener("authChange", handleAuthChange);
    
    // Nasłuchuj na zmiany w pamięci (opcjonalne, dla innych kart)
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return (
    <aside className={styles.sidebar}>
      <h2>Menu</h2>
      <ul>
        <li>
          <NavButton name="Tournaments" path="/" />
        </li>
        <li>
          <NavButton name="Teams" path="/teams" />
        </li>
        <li>
          <NavButton name="Top Players/Teams" />
        </li>

        {isAdmin && (
          <li style={{ marginTop: "20px", borderTop: "1px solid #444", paddingTop: "10px" }}>
            <NavButton name="Admin Panel" path="/admin" />
          </li>
        )}
      </ul>
    </aside>
  );
}

export default Nav;