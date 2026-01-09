import React, { useEffect, useState } from "react";
import styles from "../styles/components/nav.module.css";
import NavButton from "./navButton";
import { Menu, X } from "lucide-react"; // Używamy ikon z lucide-react (masz je już w projekcie)

import rocketIcon from "../assets/rocket.svg";
import teamIcon from "../assets/team.svg";
import moderator from "../assets/Moderator.png";  

function Nav() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Stan otwarcia menu mobilnego

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Funkcja sprawdzająca uprawnienia
  const checkAdminRole = () => {
    const token = localStorage.getItem("jwt_token");
    const userJson = localStorage.getItem("currentUser");

    if (!token || !userJson) {
      setIsAdmin(false);
      return;
    }

    try {
      const user = JSON.parse(userJson);
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
    checkAdminRole();
    const handleAuthChange = () => checkAdminRole();
    window.addEventListener("authChange", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return (
    <>
      {/* Przycisk Burger Menu (widoczny tylko na mobile) */}
      <button 
        className={styles.burgerBtn} 
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={28} color="#ffffff" /> : <Menu size={28} color="#ffffff" />}
      </button>

      {/* Tło (overlay) przyciemniające resztę strony, gdy menu jest otwarte */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`} 
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar - dodajemy klasę 'open', jeśli stan isOpen === true */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <h2>Menu</h2>
        <ul>
          <li onClick={() => setIsOpen(false)}> {/* Zamyka menu po kliknięciu w link */}
            <NavButton name="Tournaments" path="/" icon={rocketIcon} />
          </li>
          <li onClick={() => setIsOpen(false)}>
            <NavButton name="Teams" path="/teams" icon={teamIcon} />
          </li>

          {isAdmin && (
            <li className={styles.adminSeparator} onClick={() => setIsOpen(false)}>
              <NavButton name="Admin Panel" path="/admin" icon={moderator} />
            </li>
          )}
        </ul>
      </aside>
    </>
  );
}

export default Nav;