import React, { useEffect, useState } from "react";
import MainPageContent from "./mainPageContent"; 
import styles from "../styles/components/TournamentList.module.css"; 

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);

    const url = "https://projektturniej.onrender.com/api/tournaments";

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetujemy czas dzisiejszy do północy

        // Funkcja pomocnicza do określania statusu i dat
        const getTournamentInfo = (t) => {
            const start = new Date(t.startDate);
            start.setHours(0, 0, 0, 0); // Reset startu do północy

            let end;
            if (t.endDate) {
                end = new Date(t.endDate);
            } else {
                // Jeśli brak daty końca, to koniec jest w tym samym dniu co start
                end = new Date(start);
            }
            // Koniec dnia to 23:59:59
            end.setHours(23, 59, 59, 999);

            let status = 'upcoming'; 
            
            // LOGIKA PORÓWNYWANIA DAT:
            if (today > end) {
                status = 'finished';
            } else if (today >= start && today <= end) {
                status = 'ongoing';
            } else {
                status = 'upcoming';
            }

            return { start, end, status };
        };

        // 1. FILTROWANIE
        const filteredData = data.filter((t) => {
            if (filter === "all") return true;
            const { status } = getTournamentInfo(t);
            return status === filter;
        });

        // 2. SORTOWANIE
        const sortedData = filteredData.sort((a, b) => {
            const infoA = getTournamentInfo(a);
            const infoB = getTournamentInfo(b);

            const priority = {
                'ongoing': 1,
                'upcoming': 2,
                'finished': 3
            };

            const priorityA = priority[infoA.status];
            const priorityB = priority[infoB.status];

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return infoA.start - infoB.start;
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
      
      {/* SEKCJA FILTROWANIA - TERAZ PO ANGIELSKU */}
      <div className={styles.filterContainer}>
        {['all', 'upcoming', 'ongoing', 'finished'].map((status) => (
            <button 
                key={status}
                className={`${styles.filterBtn} ${filter === status ? styles.active : ''}`} 
                onClick={() => setFilter(status)}
            >
                {/* TŁUMACZENIE BUTTONÓW NA ANGIELSKI */}
                {status === 'all' ? 'All' : 
                 status === 'upcoming' ? 'Upcoming' :
                 status === 'ongoing' ? 'Ongoing' : 'Finished'}
            </button>
        ))}
      </div>

      {/* LISTA TURNIEJÓW */}
      {loading ? (
        <p className={styles.loadingText}>Loading tournaments...</p>
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
              <p className={styles.emptyText}>No tournaments found in this category.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentList;