import React from "react";
import {
  getCalculatedStatusColor,
  getTournamentStatus,
} from "../components/adminHelpers";
import styles from "../styles/pages/adminPanel.module.css";

const AdminTournamentList = ({
  tournaments,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  onSelect,
  onEdit,
  onDelete,
}) => {
  // Logika: Obliczanie statusu, filtrowanie po nazwie i sortowanie listy
  const getProcessedTournaments = () => {
    let processed = tournaments.map((t) => ({
      ...t,
      calculatedStatus: getTournamentStatus(t.startDate),
    }));

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      processed = processed.filter((t) =>
        t.tournamentName.toLowerCase().includes(lower)
      );
    }

    processed.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      const nameA = a.tournamentName.toLowerCase();
      const nameB = b.tournamentName.toLowerCase();

      switch (sortBy) {
        case "dateDesc":
          return dateB - dateA;
        case "dateAsc":
          return dateA - dateB;
        case "nameAsc":
          return nameA.localeCompare(nameB);
        case "nameDesc":
          return nameB.localeCompare(nameA);
        default:
          return 0;
      }
    });
    return processed;
  };

  const processedList = getProcessedTournaments();

  return (
    <div className={styles.tournamentListWrapper}>
      {/* Sekcja filtrów: Wyszukiwanie i Sortowanie */}
      <div className={styles.filtersBar}>
        <input
          type="text"
          placeholder="🔍 Search tournaments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${styles.input} ${styles.searchInput}`}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`${styles.select} ${styles.sortSelect}`}
        >
          <option value="dateAsc">📅 Date: Oldest First</option>
          <option value="dateDesc">📅 Date: Newest First</option>
          <option value="nameAsc">🔤 Name: A-Z</option>
          <option value="nameDesc">🔤 Name: Z-A</option>
        </select>
      </div>

      {/* Wyświetlanie listy turniejów */}
      <div className={styles.tournamentList}>
        {processedList.length === 0 && (
          <p className={styles.emptyListMessage}>No tournaments found.</p>
        )}

        {processedList.map((t) => {
          const statusColor = getCalculatedStatusColor(t.calculatedStatus);

          return (
            <div
              key={t.id || t.tournamentId}
              className={styles.tournamentItem}
              onClick={() => onSelect(t)}
            >
              <div className={styles.itemContent}>
                {t.imageUrl && (
                  <img
                    src={t.imageUrl}
                    alt="Cover"
                    className={styles.itemImage}
                  />
                )}

                <div>
                  <strong className={styles.itemTitle}>
                    {t.tournamentName}
                  </strong>
                  <div className={styles.itemSubtitle}>
                    {/* Odznaka: Typ rejestracji */}
                    <span
                      className={`${styles.badgeBase} ${
                        t.registrationType === "team"
                          ? styles.badgeTeam
                          : styles.badgeSolo
                      }`}
                    >
                      {t.registrationType === "team" ? "TEAM" : "SOLO"}
                    </span>

                    {/* Odznaka: Status (kolor przekazywany przez zmienną CSS) */}
                    <span
                      className={styles.badgeStatus}
                      style={{ "--status-color": statusColor }}
                    >
                      {t.calculatedStatus}
                    </span>

                    <span className={styles.dateText}>
                      {new Date(t.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Akcje: Edycja i Usuwanie */}
              <div className={styles.itemActions}>
                <button
                  onClick={(e) => onEdit(t, e)}
                  className={styles.iconBtn}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => onDelete(t.tournamentId || t.id, e)}
                  className={styles.iconBtn}
                  title="Delete"
                >
                  🗑️
                </button>
                <div className={styles.arrowIcon}>&rsaquo;</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTournamentList;