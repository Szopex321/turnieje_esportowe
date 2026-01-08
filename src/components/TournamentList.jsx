import React, { useEffect, useState } from "react";
import MainPageContent from "./mainPageContent";

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stan filtra: 'all', 'upcoming', 'ongoing', 'finished'
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);

    // Budowanie URL w zależności od filtra
    // Jeśli filter to "all", pobieramy wszystko z /api/Tournaments
    // Jeśli inny, używamy query param np. /api/tournaments?status=upcoming
    // Uwaga: używam 'tournaments' (mała litera) dla filtra, zgodnie ze screenem API,
    // ale 'Tournaments' (duża litera) dla domyślnego, tak jak było w Twoim kodzie.
    
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
        // Sortowanie klienta pozostawiam jako pomocnicze, 
        // chociaż backend już powinien zwrócić przefiltrowane dane.
        // Tutaj proste sortowanie po dacie startu (najbliższe najpierw).
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
  }, [filter]); // Uruchom ponownie, gdy zmieni się filtr

  // Style dla przycisków filtrowania
  const filterButtonStyle = (isActive) => ({
    padding: "10px 20px",
    margin: "0 5px",
    backgroundColor: isActive ? "#d90429" : "#2b2d42", // Czerwony aktywny, ciemny nieaktywny
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.3s"
  });

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      
      {/* SEKCJA FILTROWANIA */}
      <div style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        <button 
            style={filterButtonStyle(filter === "all")} 
            onClick={() => setFilter("all")}
        >
            All
        </button>
        <button 
            style={filterButtonStyle(filter === "upcoming")} 
            onClick={() => setFilter("upcoming")}
        >
            Upcoming
        </button>
        <button 
            style={filterButtonStyle(filter === "ongoing")} 
            onClick={() => setFilter("ongoing")}
        >
            Ongoing
        </button>
        <button 
            style={filterButtonStyle(filter === "finished")} 
            onClick={() => setFilter("finished")}
        >
            Finished
        </button>
      </div>

      {/* LISTA TURNIEJÓW */}
      {loading ? (
        <p style={{ color: "white", textAlign: "center" }}>
          Ładowanie turniejów...
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px",
            justifyContent: "center",
            width: "100%",
          }}
        >
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
              <p style={{ color: "#8d99ae", fontSize: "1.2rem" }}>Brak turniejów w tej kategorii.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TournamentList;