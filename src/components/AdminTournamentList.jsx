import React from "react";
import { getCalculatedStatusColor, getTournamentStatus } from "../components/adminHelpers"; 
// Używamy stylów admina, bo to część panelu administracyjnego
import styles from "../styles/pages/adminPanel.module.css"; 

const AdminTournamentList = ({ 
    tournaments, 
    searchTerm, 
    setSearchTerm, 
    sortBy, 
    setSortBy, 
    onSelect, 
    onEdit, 
    onDelete 
}) => {

  // Logika filtrowania i sortowania po stronie klienta (dla Admina)
  const getProcessedTournaments = () => {
      // 1. Dodajemy status wyliczony
      let processed = tournaments.map(t => ({
          ...t,
          calculatedStatus: getTournamentStatus(t.startDate)
      }));

      // 2. Filtrowanie po nazwie
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          processed = processed.filter(t => 
              t.tournamentName.toLowerCase().includes(lower)
          );
      }

      // 3. Sortowanie
      processed.sort((a, b) => {
          const dateA = new Date(a.startDate);
          const dateB = new Date(b.startDate);
          const nameA = a.tournamentName.toLowerCase();
          const nameB = b.tournamentName.toLowerCase();

          switch (sortBy) {
              case 'dateDesc': return dateB - dateA;
              case 'dateAsc': return dateA - dateB;
              case 'nameAsc': return nameA.localeCompare(nameB);
              case 'nameDesc': return nameB.localeCompare(nameA);
              default: return 0;
          }
      });
      return processed;
  };

  const processedList = getProcessedTournaments();

  return (
    <div className={styles.tournamentListWrapper}>
      {/* Pasek filtrów admina */}
      <div className={styles.filtersBar} style={{display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center'}}>
        <input 
          type="text" 
          placeholder="🔍 Search tournaments..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.input}
          style={{flex: 1, padding: '10px'}}
        />
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className={styles.select}
          style={{width: '200px', padding: '10px'}}
        >
          <option value="dateAsc">📅 Date: Oldest First</option>
          <option value="dateDesc">📅 Date: Newest First</option>
          <option value="nameAsc">🔤 Name: A-Z</option>
          <option value="nameDesc">🔤 Name: Z-A</option>
        </select>
      </div>

      {/* Lista wierszy (List View) */}
      <div className={styles.tournamentList}>
        {processedList.length === 0 && <p style={{textAlign: 'center', color: '#888'}}>No tournaments found.</p>}
        
        {processedList.map(t => (
          <div key={t.id || t.tournamentId} className={styles.tournamentItem} onClick={() => onSelect(t)}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', flex: 1}}>
              {/* Miniaturka obrazka */}
              {t.imageUrl && (
                <img 
                  src={t.imageUrl} 
                  alt="Cover" 
                  style={{width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px'}} 
                />
              )}
              
              <div>
                <strong className={styles.itemTitle}>{t.tournamentName}</strong>
                <div className={styles.itemSubtitle}>
                  {/* Badge: Typ (Team/Solo) */}
                  <span style={{
                    textTransform: 'uppercase', 
                    fontSize: '0.7rem', 
                    background: t.registrationType === 'team' ? '#4f46e5' : '#2563eb',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginRight: '8px'
                  }}>
                    {t.registrationType === 'team' ? 'TEAM' : 'SOLO'}
                  </span>
                  
                  {/* Badge: Status (Upcoming/Ongoing) */}
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: getCalculatedStatusColor(t.calculatedStatus),
                    border: `1px solid ${getCalculatedStatusColor(t.calculatedStatus)}`,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    marginRight: '8px'
                  }}>
                    {t.calculatedStatus}
                  </span>

                  <span style={{color: '#aaa', fontSize: '0.8rem'}}>
                    {new Date(t.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Akcje Admina (Edycja/Usuwanie) */}
            <div className={styles.itemActions} style={{display: 'flex', gap: '10px'}}>
              <button 
                onClick={(e) => onEdit(t, e)}
                style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'}}
                title="Edit"
              >
                ✏️
              </button>
              <button 
                onClick={(e) => onDelete(t.tournamentId || t.id, e)}
                style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'}}
                title="Delete"
              >
                🗑️
              </button>
              <div className={styles.arrowIcon}>&rsaquo;</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTournamentList;