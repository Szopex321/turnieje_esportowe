import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // Do pobrania ID z URL
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import styles from "../styles/pages/TournamentBracketPage.module.css";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

const TournamentBracketPage = () => {
  const { tournamentId } = useParams(); // Pobiera ID z adresu URL
  const [bracketData, setBracketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBracket = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/brackets/${tournamentId}`
        );

        if (response.status === 404) {
          setError(
            "Drabinka nie została jeszcze wygenerowana przez administratora."
          );
          setLoading(false);
          return;
        }
        if (!response.ok) throw new Error("Błąd pobierania danych");

        const matches = await response.json();

        // 1. Grupujemy mecze po numerze rundy: { 1: [mecz, mecz], 2: [mecz] }
        const grouped = matches.reduce((acc, match) => {
          const round = match.roundNumber;
          if (!acc[round]) acc[round] = [];
          acc[round].push(match);
          return acc;
        }, {});

        // 2. Sortujemy mecze wewnątrz rundy po matchNumber, żeby były w dobrej kolejności w pionie
        Object.keys(grouped).forEach((round) => {
          grouped[round].sort((a, b) => a.matchNumber - b.matchNumber);
        });

        setBracketData(grouped);
      } catch (err) {
        console.error(err);
        setError("Wystąpił błąd podczas ładowania drabinki.");
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) fetchBracket();
  }, [tournamentId]);

  // Pomocnicza funkcja renderująca gracza/drużynę wewnątrz karty
  const renderParticipant = (type, id, name, score, isWinner) => {
    // Jeśli ID jest null, to znaczy, że czekamy na zwycięzcę z poprzedniej rundy
    if (!id) {
      return (
        <div className={styles.participantRow}>
          <span style={{ fontStyle: "italic", color: "#555" }}>
            Oczekiwanie...
          </span>
          <span>-</span>
        </div>
      );
    }

    // Ikona w zależności od typu (opcjonalne, ale wygląda ładnie)
    const icon = type === "team" ? "🛡️" : "👤";

    // Nazwa wyświetlana (jeśli backend nie zwraca name, używamy ID jako fallback)
    const displayName = name || (type === "team" ? `Team ${id}` : `User ${id}`);

    return (
      <div
        className={`${styles.participantRow} ${isWinner ? styles.winner : ""}`}
      >
        <span className={styles.participantName}>
          {icon} {displayName}
        </span>
        <span className={styles.score}>{score ?? 0}</span>
      </div>
    );
  };

  return (
    <>
      <TitleBar />
      <div className={styles.mainContainer}>
        <Nav />
        <div className={styles.content}>
          <div className={styles.header}>
            <h1>Drabinka Turniejowa</h1>
          </div>

          {loading && (
            <div className={styles.loading}>Ładowanie drabinki...</div>
          )}
          {error && <div className={styles.error}>{error}</div>}

          {!loading && !error && Object.keys(bracketData).length === 0 && (
            <div className={styles.empty}>Brak danych o meczach.</div>
          )}

          {!loading && !error && Object.keys(bracketData).length > 0 && (
            <div className={styles.bracketContainer}>
              {/* Iterujemy po numerach rund (kluczach obiektu) */}
              {Object.keys(bracketData).map((roundNum) => (
                <div key={roundNum} className={styles.roundColumn}>
                  <div className={styles.roundTitle}>Runda {roundNum}</div>

                  {bracketData[roundNum].map((match) => {
                    // Sprawdzamy zwycięzcę, aby go podświetlić na złoto
                    const p1Winner =
                      match.winnerId && match.winnerId === match.participant1Id;
                    const p2Winner =
                      match.winnerId && match.winnerId === match.participant2Id;

                    return (
                      <div
                        key={match.matchId || match.id}
                        className={styles.matchCard}
                      >
                        {/* Uczestnik 1 */}
                        {renderParticipant(
                          match.participant1Type,
                          match.participant1Id,
                          match.participant1Name, // Zakładam, że backend to zwraca lub dodasz Include
                          match.score1, // Jeśli backend zwraca wynik
                          p1Winner
                        )}

                        {/* Uczestnik 2 */}
                        {renderParticipant(
                          match.participant2Type,
                          match.participant2Id,
                          match.participant2Name,
                          match.score2, // Jeśli backend zwraca wynik
                          p2Winner
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TournamentBracketPage;
