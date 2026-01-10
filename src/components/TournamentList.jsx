import React, { useEffect, useState } from "react";
import MainPageContent from "./mainPageContent";
import styles from "../styles/components/TournamentList.module.css"; 

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);

    // 1. ZAWSZE pobieramy wszystkie turnieje (ignorujemy filtrowanie backendu)
    const url = "https://projektturniej.onrender.com/api/tournaments";

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        const now = new Date();

        // 2. WŁASNE FILTROWANIE PO STRONIE KLIENTA
        const filteredData = data.filter((t) => {
            if (filter === "all") return true;

            const start = new Date(t.startDate);
            let end;

            // Logika ustalania daty zakończenia
            if (t.endDate) {
                // Jeśli jest podana data końca, używamy jej
                end = new Date(t.endDate);
            } else {
                // Jeśli BRAK daty końca -> turniej trwa do końca dnia rozpoczęcia (23:59:59)
                end = new Date(start);
                end.setHours(23, 59, 59, 999);
            }

            // Logika statusów
            if (filter === "upcoming") {
                // Nadchodzący: obecny czas jest przed czasem startu
                return now < start;
            }
            if (filter === "ongoing") {
                // Trwający: obecny czas jest między startem a końcem
                return now >= start && now <= end;
            }
            if (filter === "finished") {
                // Zakończony: obecny czas jest po dacie końca
                return now > end;
            }
            return true;
        });

        // 3. Sortowanie (od najbliższych)
        const sortedData = filteredData.sort((a, b) => {
            return new Date(a.startDate) - new Date(b.startDate);
        });

        setTournaments(sortedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Błąd:", err);
        setLoading(false);
      });
  }, [filter]); // Odśwież, gdy zmienimy zakładkę

  return (
    <div className={styles.container}>
      
      {/* SEKCJA FILTROWANIA */}
      <div className={styles.filterContainer}>
        {['all', 'upcoming', 'ongoing', 'finished'].map((status) => (
            <button 
                key={status}
                className={`${styles.filterBtn} ${filter === status ? styles.active : ''}`} 
                onClick={() => setFilter(status)}
            >
                {status === 'all' ? 'Wszystkie' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
        ))}
      </div>

      {/* LISTA TURNIEJÓW */}
      {loading ? (
        <p className={styles.loadingText}>Ładowanie turniejów...</p>
      ) : (
        <div className={styles.listGrid}>
          {tournaments.length > 0 ? (
            tournaments.map((t) => (
                <MainPageContent
                    key={t.tournamentId}
                    tournamentId={t.tournamentId}
                    currentParticipants={t.participantsCount || 0}
                    title={t.tournamentName}
                    description={t.description}
                    baner={t.imageUrl}
                    startDate={t.startDate}
                    endDate={t.endDate}
                    location={t.game ? t.game.gameName : "Online"}
                    maxParticipants={t.maxParticipants}
                    registrationType={t.registrationType}
                    tournamentType={t.tournamentFormat}
                    rules={t.rules}
                />
            ))
          ) : (
              <p className={styles.emptyText}>Brak turniejów w tej kategorii.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentList;