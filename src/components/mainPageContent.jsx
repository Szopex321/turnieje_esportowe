import { useEffect, useState } from "react";
import styles from "../styles/components/mainPageContent.module.css";
import Modal from "./modal";
import Button from "./Button";

function MainPageContent(props) {
  const {
    id, // <--- Odbieramy ID turnieju
    title,
    description,
    baner,
    startDate,
    endDate,
    location,
    rules,
    maxParticipants,
    registrationType,
    tournamentType,
  } = props;

  const [state, setState] = useState("Upcoming");
  const [timeInfo, setTimeInfo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Stan do obsługi ładowania podczas zapisywania
  const [isRegistering, setIsRegistering] = useState(false);

  const safeEndDate = endDate ? endDate : startDate;

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // --- LOGIKA REJESTRACJI ---
  const handleRegister = async () => {
    // 1. Pobierz token z localStorage (zakładam, że klucz to 'token' lub 'user')
    // Jeśli trzymasz cały obiekt usera, użyj: JSON.parse(localStorage.getItem('user')).token
    const token = localStorage.getItem('token'); 

    if (!token) {
      alert("Musisz być zalogowany, aby wziąć udział w turnieju!");
      return;
    }

    setIsRegistering(true);

    try {
      // 2. Wyślij zapytanie do Backend .NET
      // Sprawdź w swojej dokumentacji API jaki jest dokładny endpoint.
      // Częsty wzorzec: POST /api/Tournaments/{id}/participants
      const response = await fetch(`https://projektturniej.onrender.com/api/Tournaments/${id}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Przekazujemy token JWT
        },
        // Jeśli backend wymaga body, dodaj je tutaj, np: JSON.stringify({})
      });

      if (response.ok) {
        alert("Pomyślnie zapisano na turniej!");
        handleCloseModal();
      } else {
        // Obsługa błędów z backendu (np. brak miejsc, użytkownik już zapisany)
        const errorData = await response.text(); // lub response.json() zależnie od backendu
        alert(`Błąd rejestracji: ${errorData || response.statusText}`);
      }
    } catch (error) {
      console.error("Błąd sieci:", error);
      alert("Wystąpił problem z połączeniem.");
    } finally {
      setIsRegistering(false);
    }
  };

  // --- LOGIKA DAT (bez zmian) ---
  useEffect(() => {
    if (!startDate) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tournamentStartDate = new Date(startDate);
    const tournamentEndDate = new Date(safeEndDate);

    if (tournamentStartDate > today) {
      setState("Upcoming");
    } else if (tournamentEndDate < today) {
      setState("Completed");
    } else {
      setState("Ongoing");
    }
  }, [startDate, safeEndDate]);

  useEffect(() => {
    if (!startDate) return;
    const today = new Date();
    // ... (reszta logiki daty bez zmian) ...
    // Skróciłem dla czytelności odpowiedzi, wstaw tu swój oryginalny kod dat
    if (state === "Upcoming") {
        const diffTime = new Date(startDate) - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if(diffDays > 0) setTimeInfo(`Launches in ${diffDays} days`);
    }
  }, [state, startDate, safeEndDate]);

  return (
    <>
      <div className={styles.container} onClick={handleOpenModal}>
        {/* ... (Baner i podgląd bez zmian) ... */}
        <div className={styles.bannerWrapper}>
          <img
            src={baner || "https://placehold.co/600x400?text=No+Image"}
            alt="Tournament Banner"
            className={styles.banner}
          />
        </div>
        <div className={styles.contentWrapper}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.timeInfo}>{timeInfo}</div>
            {/* Reszta listy... */}
        </div>
      </div>

      {isModalOpen && (
        <Modal onClose={handleCloseModal}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <img
            src={baner || "https://placehold.co/600x400?text=No+Image"}
            alt="Tournament Banner"
            className={styles.modalBanner}
          />
          <p className={styles.modalDescription}>
            {description || "Brak opisu."}
          </p>

          <ul className={styles.modalList}>
            {/* ... (Lista szczegółów bez zmian) ... */}
            <li><strong>State:</strong> <span>{state}</span></li>
          </ul>

          <div className={styles.modalActions}>
            {/* DODANO: Obsługa onClick i disable podczas ładowania */}
            <Button 
                name={isRegistering ? "Registering..." : "Registration"} 
                className={styles.registrationButton} 
                onClick={handleRegister}
                disabled={isRegistering || state === "Completed"} // Blokada jeśli zakończony
            />
          </div>
        </Modal>
      )}
    </>
  );
}

export default MainPageContent;