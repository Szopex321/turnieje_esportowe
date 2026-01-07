import React, { useEffect, useState } from "react";
import MainPageContent from "./mainPageContent";

const TournamentList = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://projektturniej.onrender.com/api/Tournaments")
      .then((res) => res.json())
      .then((data) => {
        const now = new Date();

        const sortedData = data.sort((a, b) => {
          const startA = new Date(a.startDate);
          const endA = a.endDate ? new Date(a.endDate) : startA;

          const startB = new Date(b.startDate);
          const endB = b.endDate ? new Date(b.endDate) : startB;

          const getStatusWeight = (start, end) => {
            if (start > now) return 1;
            if (end < now) return 2;
            return 0;
          };

          const statusA = getStatusWeight(startA, endA);
          const statusB = getStatusWeight(startB, endB);

          if (statusA !== statusB) {
            return statusA - statusB;
          }

          if (statusA === 1) {
            return startA - startB;
          } else if (statusA === 2) {
            return endB - endA;
          } else {
            return startB - startA;
          }
        });

        setTournaments(sortedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Błąd:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <p style={{ color: "white", textAlign: "center" }}>
        Ładowanie turniejów...
      </p>
    );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {tournaments.map((t) => (
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
      ))}
    </div>
  );
};

export default TournamentList;
