import React, { useState } from 'react';
import styles from '../styles/pages/auth.module.css';
import { Link, useNavigate } from 'react-router-dom';

const LogIn = () => {
    const navigate = useNavigate();
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/Auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Ważne dla ciasteczek HttpOnly
                body: JSON.stringify({ 
                    username: login,
                    Password: password // Upewnij się, że backend oczekuje dużej litery 'P'
                }),
            });

            if (response.ok) {
                // 1. Pobieramy dane użytkownika z odpowiedzi backendu
                const responseData = await response.json().catch(() => ({}));

                // 2. Tworzymy obiekt do zapisania w przeglądarce
                const userToSave = {
                    username: responseData.username || login, // Jeśli backend nie zwróci nicku, użyj tego z inputa
                    avatar: responseData.avatar || '',
                    role: responseData.role || 'user', // Zapisujemy rolę (dla panelu Admina)
                    isLoggedIn: true
                };

                // 3. Zapisujemy w localStorage
                localStorage.setItem('currentUser', JSON.stringify(userToSave));

                // 4. KLUCZOWY MOMENT (ROZWIĄZANIE 1):
                // Wysyłamy sygnał do TitleBar, żeby się odświeżył bez przeładowania strony
                window.dispatchEvent(new Event("storage"));
                
                console.log("Zalogowano pomyślnie i wysłano sygnał odświeżenia");
                navigate('/');
            } else {
                const data = await response.json().catch(() => ({}));
                setError(data.message || 'Błąd logowania. Sprawdź dane.');
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

                {error && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}

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