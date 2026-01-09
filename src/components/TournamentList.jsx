import React, { useEffect, useState } from "react";
import MainPageContent from "./mainPageContent";
// Zakładam, że stworzysz ten plik w styles/components/
import styles from "../styles/components/TournamentList.module.css"; 

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    let url = "https://projektturniej.onrender.com/api/Tournaments";
    
    if (filter !== "all") {
        url = `https://projektturniej.onrender.com/api/tournaments?status=${filter}`;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        const sortedData = data.sort((a, b) => {
            return new Date(a.startDate) - new Date(b.startDate);
        });

        setTournaments(sortedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Błąd:", err);
        setLoading(false);
      });
  }, [filter]);

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
                {status.charAt(0).toUpperCase() + status.slice(1)}
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
                    currentParticipants={t.currentParticipants || 0}
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