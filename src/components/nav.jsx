import React, { useEffect, useState } from "react";
import styles from "../styles/components/nav.module.css";
import NavButton from "./navButton";
import { Menu, X } from "lucide-react"; // Ikony menu (hamburger) i zamknięcia (X)

// Importy ikon lokalnych (assets)
import rocketIcon from "../assets/rocket.svg";
import teamIcon from "../assets/team.svg";
import moderator from "../assets/Moderator.png";  

function Nav() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Stan: false = zamknięte, true = otwarte

  // Funkcja przełączająca widoczność menu mobilnego
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // --- FUNKCJA SPRAWDZAJĄCA UPRAWNIENIA ADMINA ---
  const checkAdminRole = () => {
    const token = localStorage.getItem("jwt_token");
    const userJson = localStorage.getItem("currentUser");

    // Jeśli brak tokena lub danych użytkownika -> nie jest adminem
    if (!token || !userJson) {
      setIsAdmin(false);
      return;
    }

    try {
      const user = JSON.parse(userJson);
      // Sprawdzenie roli (uwzględniamy wielkość liter)
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

  // --- EFEKT: NASŁUCHIWANIE ZMIAN LOGOWANIA ---
  useEffect(() => {
    checkAdminRole(); // Sprawdź przy pierwszym załadowaniu

    // Obsługa customowego zdarzenia 'authChange' (jeśli używasz go przy logowaniu/wylogowaniu)
    const handleAuthChange = () => checkAdminRole();
    window.addEventListener("authChange", handleAuthChange);
    
    // Obsługa zmian w localStorage (np. wylogowanie w innej karcie)
    window.addEventListener("storage", handleAuthChange);

    // Sprzątanie event listenerów przy odmontowaniu komponentu
    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return (
    <>
      {/* 1. PRZYCISK BURGERA (Widoczny tylko na Mobile) */}
      <button 
        className={styles.burgerBtn} 
        onClick={toggleMenu}
        aria-label="Przełącz menu"
      >
        {/* Jeśli otwarte -> pokaż X, jeśli zamknięte -> pokaż paski (Menu) */}
        {isOpen ? <X size={28} color="#ffffff" /> : <Menu size={28} color="#ffffff" />}
      </button>

      {/* 2. OVERLAY (Ciemne tło pod menu na mobile) */}
      {/* Kliknięcie w tło zamyka menu */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`} 
        onClick={() => setIsOpen(false)}
      />

      {/* 3. SIDEBAR (Pasek boczny) */}
      {/* Dodajemy klasę .open, jeśli stan isOpen === true */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <h2>Menu</h2>
        <ul>
          <li onClick={() => setIsOpen(false)}> {/* Zamknij menu po kliknięciu */}
            <NavButton name="Tournaments" path="/" icon={rocketIcon} />
          </li>
          <li onClick={() => setIsOpen(false)}>
            <NavButton name="Teams" path="/teams" icon={teamIcon} />
          </li>

          {/* Wyświetl panel admina tylko jeśli użytkownik ma uprawnienia */}
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