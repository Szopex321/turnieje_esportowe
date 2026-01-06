import React, { useEffect, useState } from "react";
import styles from "../styles/components/nav.module.css";
import NavButton from "./navButton";

function Nav() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Funkcja sprawdzająca uprawnienia
  const checkAdminRole = () => {
    // 1. Pobieramy TOKEN oraz dane użytkownika
    const token = localStorage.getItem("jwt_token");
    const userJson = localStorage.getItem("currentUser");

    // Jeśli brakuje tokenu LUB danych użytkownika -> na pewno nie jest adminem
    if (!token || !userJson) {
      setIsAdmin(false);
      return;
    }

    try {
      const user = JSON.parse(userJson);
      
      // 2. Sprawdzamy rolę
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

    // Nasłuchuj na zdarzenie logowania/wylogowania
    // (Upewnij się, że w Login.jsx i funkcji Logout wywołujesz to zdarzenie)
    const handleAuthChange = () => checkAdminRole();
    window.addEventListener("authChange", handleAuthChange);
    
    // Nasłuchuj na zmiany w localStorage (np. wylogowanie w innej karcie)
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

        {/* Renderuj ten przycisk TYLKO jeśli isAdmin === true */}
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