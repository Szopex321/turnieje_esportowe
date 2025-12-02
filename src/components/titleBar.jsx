import React, { useState, useEffect } from 'react';
import styles from "../styles/components/titleBar.module.css";
import Button from "./Button";
import logo from "../assets/logo.png";
import defaultAvatar from "../assets/deafultAvatar.jpg"; // Pamiętaj o nazwie pliku z Twojego screena
import { useNavigate } from 'react-router-dom';

function TitleBar() {
    const navigate = useNavigate();

    // Domyślne stany
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState(null);

    // 1. Przy załadowaniu strony sprawdzamy localStorage (Optimistic UI)
    useEffect(() => {
    // Wyciągnąłem logikę sprawdzania do osobnej funkcji, żeby jej użyć dwa razy
    const checkAuth = () => {
        const savedUserJSON = localStorage.getItem('currentUser');
        if (savedUserJSON) {
            try {
                const user = JSON.parse(savedUserJSON);
                if (user && user.isLoggedIn) {
                    setIsLoggedIn(true);
                    setUsername(user.username);
                    setAvatar(user.avatar);
                }
            } catch (e) {
                console.error("Błąd danych", e);
                localStorage.removeItem('currentUser');
            }
        } else {
            // Ważne: Jeśli nie ma usera, czyścimy stan (na wypadek wylogowania)
            setIsLoggedIn(false);
            setUsername("");
            setAvatar(null);
        }
    };

    // 1. Sprawdź przy pierwszym załadowaniu
    checkAuth();

    // 2. Nasłuchuj na sygnał z LogIn.jsx (lub z innej karty przeglądarki)
    window.addEventListener('storage', checkAuth);
    // Opcjonalnie nasłuchuj też własnego zdarzenia, jeśli użyłeś "authChange"
    window.addEventListener('authChange', checkAuth); 

    // 3. Sprzątanie po wyjściu z komponentu
    return () => {
        window.removeEventListener('storage', checkAuth);
        window.removeEventListener('authChange', checkAuth);
    };
}, []);

    // 2. Funkcja przenosząca na profil
    const goToProfile = () => {
        navigate('/profile');
    };

    // 3. Funkcja wylogowania
    const handleLogout = () => {
        // Wyczyść localStorage (Frontend zapomina usera)
        localStorage.removeItem('currentUser');
        
        // Reset stanów
        setIsLoggedIn(false);
        setUsername("");
        setAvatar(null);

        // Próba powiadomienia backendu o usunięciu ciasteczka (fire-and-forget)
        fetch('/api/auth/logout', { method: 'POST' }).catch(err => console.log('Backend logout ignored'));

        // Przekierowanie na logowanie
        navigate('/login');
    };

    return (
        <header className={styles.header}>
            {/* LEWA STRONA: LOGO I TYTUŁ */}
            <div className={styles.titleSection}>
                <div className={styles.logo}>
                    <img src={logo} alt="logo" className={styles.logoImage}/>
                </div>
                <div className={styles.title}>
                    <h2>eSports Tournament organizer</h2>
                </div>
            </div>

            {/* PRAWA STRONA: AUTH */}
            <div className={styles.headerRight}>
                {isLoggedIn ? (
                    // --- WIDOK ZALOGOWANEGO ---
                    <div className={styles.userInfoContainer}>
                        
                        {/* Klikalna sekcja z profilem */}
                        <div 
                            className={styles.userProfile} 
                            onClick={goToProfile}
                            style={{ cursor: 'pointer' }} // Pokazuje, że można kliknąć
                            title="Go to profile"
                        >
                            <span className={styles.welcomeText}>
                                Welcome, <strong>{username}</strong>
                            </span>
                            <img 
                                src={avatar || defaultAvatar} 
                                alt="User Avatar" 
                                className={styles.userAvatar} 
                            />
                        </div>

                        {/* Przycisk wylogowania */}
                        <Button 
                            name="Log Out" 
                            onClick={handleLogout} 
                            className={styles.logoutButton} 
                        />
                    </div>
                ) : (
                    // --- WIDOK GOŚCIA ---
                    <div className={styles.authButtons}>
                        <Button 
                            name="log in" 
                            onClick={() => navigate('/login')} 
                            className={styles.logInButton} 
                        />
                        <Button 
                            name="sign up" 
                            onClick={() => navigate('/signup')} 
                            className={styles.signUpButton} 
                        />
                    </div>
                )}
            </div>
        </header>
    );
}

export default TitleBar;