import React from "react";
import styles from "../styles/pages/adminPanel.module.css";

const TournamentForm = ({ 
    formData, 
    setFormData, 
    onSubmit, 
    onCancel, 
    gamesList, 
    isEditing 
}) => {

  // Bezpieczna zmiana liczby uczestników
  const adjustParticipants = (amount) => {
    // Parsujemy na int, jeśli puste to traktujemy jako 0
    const currentVal = parseInt(formData.maxParticipants) || 0;
    const newVal = Math.max(0, currentVal + amount);
    setFormData({ ...formData, maxParticipants: newVal });
  };

  return (
    <div className={styles.tabContent}>
      <h2>{isEditing ? "Edit Tournament" : "Create New Tournament"}</h2>
      
      <form onSubmit={onSubmit}>
        <div className={styles.formGroup}>
          <label>Tournament Name</label>
          <input 
            type="text" 
            className={styles.input} 
            required 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Image URL</label>
          <input 
            type="text" 
            className={styles.input} 
            value={formData.imageUrl} 
            onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
          />
        </div>

        <div className={styles.formGroup}>
          <label>Game</label>
          <select 
            className={styles.select} 
            required 
            value={formData.gameId} 
            onChange={e => setFormData({...formData, gameId: e.target.value})}
          >
            <option value="">-- Select Game --</option>
            {gamesList.map(g => (
              <option key={g.gameId} value={g.gameId}>{g.gameName}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
            <label>Type</label>
            <select 
                className={styles.select} 
                value={formData.registrationType} 
                onChange={e => setFormData({...formData, registrationType: e.target.value})}
            >
                <option value="individual">Individual</option>
                <option value="team">Team Based</option>
            </select>
        </div>

        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea 
            className={styles.textarea} 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
          />
        </div>

        {/* Sekcja Licznika Uczestników */}
        <div className={styles.formGroup}>
          <label>Max Participants</label>
          <div className={styles.stepperContainer}>
            <button 
                type="button" 
                className={styles.stepperBtn} 
                onClick={() => adjustParticipants(-1)}
            >−</button>
            
            <input 
                type="number" 
                className={styles.stepperInput} 
                value={formData.maxParticipants} 
                onChange={e => setFormData({...formData, maxParticipants: e.target.value})} 
            />

            <button 
                type="button" 
                className={styles.stepperBtn} 
                onClick={() => adjustParticipants(1)}
            >+</button>
          </div>
        </div>
        
        {/* Wiersz z datami (układ 50/50) */}
        <div className={styles.formRow}>
            <div className={styles.formCol}>
                <label className={styles.labelSmall}>Start Date</label>
                <input 
                    type="datetime-local" 
                    className={styles.input} 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                />
            </div>
            <div className={styles.formCol}>
                <label className={styles.labelSmall}>End Date</label>
                <input 
                    type="datetime-local" 
                    className={styles.input} 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                />
            </div>
        </div>

        <div className={styles.buttonGroup}>
            <button type="submit" className={styles.createBtn}>
                {isEditing ? "Save Changes" : "Create Tournament"}
            </button>
            {isEditing && (
                <button type="button" className={styles.cancelBtn} onClick={onCancel}>
                    Cancel
                </button>
            )}
        </div>
      </form>
    </div>
  );
};

export default TournamentForm;