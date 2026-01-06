import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import styles from "../styles/pages/TournamentBracketPage.module.css";
// Import ikon do rozróżnienia gracza od drużyny
import { User, Shield, Trophy } from "lucide-react";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

const TournamentBracketPage = () => {
  const { tournamentId } = useParams();
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

        // 1. Grupujemy mecze po numerze rundy
        const grouped = matches.reduce((acc, match) => {
          const round = match.roundNumber;
          if (!acc[round]) acc[round] = [];
          acc[round].push(match);
          return acc;
        }, {});

        // 2. Sortujemy mecze wewnątrz rundy po matchNumber
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

  // Funkcja renderująca pojedynczego uczestnika w meczu
  const renderParticipant = (type, id, name, score, isWinner) => {
    // Jeśli ID jest null, to znaczy, że czekamy na zwycięzcę z poprzedniej rundy
    if (!id) {
      return (
        <div className={`${styles.participantRow} ${styles.emptyRow}`}>
          <span className={styles.placeholderText}>Oczekiwanie...</span>
          <span className={styles.dash}>-</span>
        </div>
      );
    }

    // Wybór ikony w zależności od typu (1vs1 czy Drużyna)
    const Icon = type === "team" ? Shield : User;

    // Fallback dla nazwy
    const displayName =
      name || (type === "team" ? `Team ${id}` : `Gracz ${id}`);

    return (
      <div
        className={`${styles.participantRow} ${
          isWinner ? styles.winnerRow : styles.loserRow
        }`}
      >
        <div className={styles.participantInfo}>
          <Icon
            size={16}
            className={isWinner ? styles.iconWinner : styles.iconNormal}
          />
          <span className={isWinner ? styles.textWinner : styles.textNormal}>
            {displayName}
          </span>
          {isWinner && <Trophy size={14} className={styles.trophyIcon} />}
        </div>
        <div
          className={`${styles.scoreBox} ${isWinner ? styles.scoreWinner : ""}`}
        >
          {score ?? 0}
        </div>
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

          {error && (
            <div className={styles.errorContainer}>
              <div className={styles.errorMessage}>{error}</div>
            </div>
          )}

          {!loading && !error && Object.keys(bracketData).length === 0 && (
            <div className={styles.empty}>Brak danych o meczach.</div>
          )}

          {!loading && !error && Object.keys(bracketData).length > 0 && (
            <div className={styles.bracketContainer}>
              {/* Renderowanie kolumn rund */}
              {Object.keys(bracketData).map((roundNum) => (
                <div key={roundNum} className={styles.roundColumn}>
                  <div className={styles.roundTitle}>Runda {roundNum}</div>

                  <div className={styles.matchesList}>
                    {bracketData[roundNum].map((match) => {
                      // Sprawdzamy kto wygrał (na podstawie winnerId z backendu)
                      const p1Winner =
                        match.winnerId &&
                        match.winnerId === match.participant1Id;
                      const p2Winner =
                        match.winnerId &&
                        match.winnerId === match.participant2Id;

                      return (
                        <div
                          key={match.matchId || match.id}
                          className={styles.matchCard}
                        >
                          {/* Match Header */}
                          <div className={styles.matchHeader}>
                            <div className={styles.matchNumber}>
                              Mecz {match.matchNumber || "1"}
                            </div>
                            {(p1Winner || p2Winner) && (
                              <div className={styles.completedBadge}>
                                Zakończony
                              </div>
                            )}
                          </div>

                          <div className={styles.matchBody}>
                            {/* Uczestnik 1 */}
                            {renderParticipant(
                              match.participant1Type,
                              match.participant1Id,
                              match.participant1Name,
                              match.score1,
                              p1Winner
                            )}

                            {/* VS Separator */}
                            <div className={styles.vsSeparator}>VS</div>

                            {/* Uczestnik 2 */}
                            {renderParticipant(
                              match.participant2Type,
                              match.participant2Id,
                              match.participant2Name,
                              match.score2,
                              p2Winner
                            )}
                          </div>

                          {/* Match Footer - Winner Info */}
                          {(p1Winner || p2Winner) && (
                            <div className={styles.matchFooter}>
                              <div className={styles.winnerInfo}>
                                Zwycięzca:{" "}
                                {p1Winner
                                  ? match.participant1Name
                                  : match.participant2Name}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
