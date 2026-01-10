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
            {gamesList.map(g => <option key={g.gameId} value={g.gameId}>{g.gameName}</option>)}
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

        <div className={styles.formGroup}>
          <label>Max Participants</label>
          <input 
            type="number" 
            className={styles.input} 
            value={formData.maxParticipants} 
            onChange={e => setFormData({...formData, maxParticipants: e.target.value})} 
          />
        </div>
        
        <div style={{display: 'flex', gap: '20px'}}>
            <div className={styles.formGroup} style={{flex: 1}}>
                <label>Start Date</label>
                <input 
                    type="datetime-local" 
                    className={styles.input} 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                />
            </div>
            <div className={styles.formGroup} style={{flex: 1}}>
                <label>End Date</label>
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