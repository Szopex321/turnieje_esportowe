import React, { useState } from 'react';
import styles from '../styles/pages/auth.module.css';
import { Link, useNavigate } from 'react-router-dom';

const LogIn = () => {
    const navigate = useNavigate();
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // Stan do wyświetlania błędów

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Reset błędów przed nową próbą

        try {
            const response = await fetch('/api/Auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username: login,
                    Password: password
                }),
            });

            // Fragment pliku LogIn.jsx wewnątrz if (response.ok)

            if (response.ok) {
                // 1. Pobierz dane, które zwrócił backend
                const responseData = await response.json().catch(() => ({}));

                // 2. Stwórz obiekt użytkownika (użyj danych z backendu lub loginu z formularza)
                const userToSave = {
                    username: responseData.username || login, // Jeśli backend nie zwraca username, używamy tego co wpisał user
                    avatar: responseData.avatar || '',        // Avatar z backendu (jeśli jest)
                    isLoggedIn: true
                };

                // 3. ZAPISZ DO LOCAL STORAGE
                localStorage.setItem('currentUser', JSON.stringify(userToSave));

                console.log("Zalogowano i zapisano dane lokalnie");
                navigate('/'); // Przekierowanie
            }
        } catch (err) {
            console.error("Błąd połączenia:", err);
            setError('Wystąpił błąd połączenia z serwerem.');
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.authCard}>
                <h2 className={styles.title}>Welcome Back</h2>
                <p className={styles.subtitle}>Log in to manage your tournaments</p>

                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Login</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="GamerTag123"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitButton}>
                        Log In
                    </button>
                </form>

                <p className={styles.footerText}>
                    Don't have an account?
                    <Link to="/signup" className={styles.link}>Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default LogIn;