import React, { useState, useEffect } from 'react';
// Reużywamy stylów z auth, bo pasują idealnie do formularza
import styles from '../styles/pages/auth.module.css';
import { useNavigate } from 'react-router-dom';

const AddTournament = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Sprawdzenie bezpieczeństwa na wejściu (jeśli ktoś wpisze URL z palca)
    useEffect(() => {
        // const savedUserJSON = localStorage.getItem('currentUser');
        // if (savedUserJSON) {
        //     const user = JSON.parse(savedUserJSON);
        //     if (user.role !== 'admin') {
        //         // Jeśli nie jest adminem, wyrzuć go na stronę główną
        //         navigate('/');
        //     }
        // } else {
        //      // Jeśli niezalogowany, do logowania
        //     navigate('/login');
        // }
    }, [navigate]);


    const [formData, setFormData] = useState({
        tournament_name: '',
        game_id: '', // To będzie select
        description: '',
        rules: '',
        start_date: '',
        end_date: '',
        max_participants: '',
        tournament_format: 'single_elimination', // Wartość domyślna
        registration_type: 'solo' // Wartość domyślna
    });

    // Przykładowe gry (docelowo pobierane z backendu)
    const gamesList = [
        { id: 1, name: "League of Legends" },
        { id: 2, name: "Counter-Strike 2" },
        { id: 3, name: "Fortnite" }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Konwertujemy liczby, reszta jako tekst
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'max_participants' || name === 'game_id') ? parseInt(value) || '' : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log("Wysyłanie danych turnieju:", formData);

        try {
            // TUTAJ ZMIEŃ ADRES NA SWÓJ ENDPOINT BACKENDOWY
            const response = await fetch('/api/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Tu ewentualnie token jeśli używasz headerów, a nie ciastek
                },
                // Pamiętaj o credentials: 'include' jeśli używasz ciastek!
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert("Turniej dodany pomyślnie!");
                navigate('/tournaments'); // Przekierowanie do listy turniejów
            } else {
                const data = await response.json().catch(() => ({}));
                setError(data.message || "Błąd podczas dodawania turnieju.");
            }
        } catch (err) {
            console.error(err);
            setError("Błąd połączenia z serwerem.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // Używamy pageContainer z auth.module.css żeby wycentrować
        <div className={styles.pageContainer} style={{paddingTop: '100px', alignItems: 'flex-start'}}>
             {/* Dodatkowy styl inline żeby poszerzyć kartę dla tego formularza */}
            <div className={styles.authCard} style={{maxWidth: '800px'}}>
                <h2 className={styles.title}>Create New Tournament</h2>
                <p className={styles.subtitle}>Admin Panel</p>

                {error && <div style={{ color: '#ef4444', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.formContainer}>

                    {/* --- NAZWA I GRA (W jednym rzędzie) --- */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div className={styles.inputGroup} style={{ flex: 2 }}>
                            <label className={styles.label}>Tournament Name</label>
                            <input type="text" name="tournament_name" className={styles.input} required value={formData.tournament_name} onChange={handleChange} />
                        </div>
                        <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>Game</label>
                            <select name="game_id" className={styles.input} required value={formData.game_id} onChange={handleChange} style={{ appearance: 'auto' }}>
                                <option value="">Select Game...</option>
                                {gamesList.map(game => (
                                    <option key={game.id} value={game.id}>{game.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* --- OPISY --- */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Description</label>
                        <textarea name="description" className={styles.input} rows="3" value={formData.description} onChange={handleChange} />
                    </div>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Rules</label>
                        <textarea name="rules" className={styles.input} rows="3" value={formData.rules} onChange={handleChange} />
                    </div>

                    {/* --- DATY (datetime-local) --- */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>Start Date & Time</label>
                            <input type="datetime-local" name="start_date" className={styles.input} required value={formData.start_date} onChange={handleChange} />
                        </div>
                        <div className={styles.inputGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>End Date & Time</label>
                            <input type="datetime-local" name="end_date" className={styles.input} required value={formData.end_date} onChange={handleChange} />
                        </div>
                    </div>

                    {/* --- USTAWIENIA TURNIEJU --- */}
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                         <div className={styles.inputGroup} style={{ flex: 1, minWidth: '150px' }}>
                            <label className={styles.label}>Max Participants</label>
                            <input type="number" name="max_participants" className={styles.input} required min="2" value={formData.max_participants} onChange={handleChange} />
                        </div>

                        <div className={styles.inputGroup} style={{ flex: 1, minWidth: '150px' }}>
                            <label className={styles.label}>Format</label>
                            <select name="tournament_format" className={styles.input} required value={formData.tournament_format} onChange={handleChange} style={{ appearance: 'auto' }}>
                                <option value="single_elimination">Single Elimination</option>
                                <option value="double_elimination">Double Elimination</option>
                                <option value="round_robin">Round Robin</option>
                            </select>
                        </div>

                         <div className={styles.inputGroup} style={{ flex: 1, minWidth: '150px' }}>
                            <label className={styles.label}>Registration Type</label>
                             <select name="registration_type" className={styles.input} required value={formData.registration_type} onChange={handleChange} style={{ appearance: 'auto' }}>
                                <option value="solo">Solo</option>
                                <option value="team">Team</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={loading} style={{marginTop: '20px'}}>
                        {loading ? 'Creating...' : 'Create Tournament'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddTournament;