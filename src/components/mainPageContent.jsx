import { useEffect, useState } from "react";
import styles from "../styles/components/mainPageContent.module.css";
import Modal from "./modal";
import Button from "./Button";

function MainPageContent(props) {
  const {
    tournamentId, // Odbieramy ID turnieju
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
  const [isRegistering, setIsRegistering] = useState(false); // Stan ładowania przycisku

  const safeEndDate = endDate ? endDate : startDate;

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  // --- LOGIKA REJESTRACJI (POPRAWIONA) ---
  const handleRegister = async () => {
    // 1. UŻYWAMY KLUCZA "jwt_token" - tak jak zapisałeś w LogIn.js
    const token = localStorage.getItem("jwt_token");

    if (!token) {
      alert("You need to be logged in to register!");
      return;
    }

    setIsRegistering(true);

    try {
      // 2. Wysyłamy ID turnieju i Token do API
      const response = await fetch(`/api/TournamentRegistration/${tournamentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Backend .NET sam wyciągnie UserID z tokena
        },
        body: JSON.stringify({}) // Puste body (chyba że backend wymaga czegoś specyficznego)
      });

      if (response.ok) {
        alert("Success! You have been registered.");
        handleCloseModal();
      } else {
        const errorText = await response.text();
        alert(`Registration failed: ${errorText}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Connection error.");
    } finally {
      setIsRegistering(false);
    }
  };

  // --- LOGIKA DAT ---
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

    if (state === "Upcoming") {
      const diffTime = new Date(startDate) - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) setTimeInfo("Launches Today");
      else if (diffDays === 1) setTimeInfo("Launches Tomorrow");
      else if (diffDays <= 31) setTimeInfo(`Launches in ${diffDays} days`);
      else setTimeInfo(`Launches at ${new Date(startDate).toLocaleDateString()}`);
    } else if (state === "Ongoing") {
        // ... (Twoja logika ongoing)
        setTimeInfo("Ongoing");
    } else if (state === "Completed") {
        // ... (Twoja logika completed)
        setTimeInfo("Ended");
    }
  }, [state, startDate, safeEndDate]);

  return (
    <>
      {/* KAFELEK NA GŁÓWNEJ STRONIE - BEZ ZMIAN */}
      <div className={styles.container} onClick={handleOpenModal}>
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
          <ul className={styles.list}>
            <li><strong>Location:</strong> <span>{location}</span></li>
            <li><strong>Max Participants:</strong> <span>{maxParticipants}</span></li>
            <li><strong>Registration Type:</strong> <span>{registrationType}</span></li>
            <li><strong>State:</strong> <span>{state}</span></li>
          </ul>
        </div>
      </div>

      {/* MODAL - WYGLĄD ZACHOWANY, DODANA TYLKO FUNKCJA ONCLICK */}
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
            <li><strong>Localization:</strong> <span>{location}</span></li>
            <li><strong>Start Date:</strong> <span>{new Date(startDate).toLocaleDateString()}</span></li>
            <li><strong>End Date:</strong> <span>{endDate ? new Date(endDate).toLocaleDateString() : "TBA"}</span></li>
            <li><strong>Rules:</strong> <span>{rules || "Standard rules apply."}</span></li>
            <li><strong>Max Participants:</strong> <span>{maxParticipants}</span></li>
            <li><strong>Registration Type:</strong> <span>{registrationType}</span></li>
            <li><strong>Tournament Type:</strong> <span>{tournamentType}</span></li>
            <li><strong>State:</strong> <span>{state}</span></li>
          </ul>

          <div className={styles.modalActions}>
            <Button 
                // Zachowujemy małą literę 'registration' tak jak na Twoim screenie
                name={isRegistering ? "registering..." : "registration"} 
                className={styles.registrationButton}
                
                // PODPINAMY LOGIKĘ
                onClick={handleRegister}
                
                // Opcjonalnie: zablokuj przycisk jeśli turniej zakończony
                disabled={isRegistering || state === "Completed"} 
            />
          </div>
        </Modal>
      )}
    </>
  );
}

export default MainPageContent;