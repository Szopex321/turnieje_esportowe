import React, { useState, useEffect } from 'react';
import styles from "../styles/components/titleBar.module.css";
import Button from "./Button";
import logo from "../assets/logo.png";
import defaultAvatar from "../assets/deafultAvatar.jpg"; 
import { useNavigate } from 'react-router-dom';

function TitleBar() {
    const navigate = useNavigate();

    // Domyślne stany - puste
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState(null);

    // 1. Przy załadowaniu strony sprawdzamy localStorage
    useEffect(() => {
        // Pobierz zapisany ciąg znaków
        const savedUserJSON = localStorage.getItem('currentUser');

        if (savedUserJSON) {
            try {
                // Zamień tekst z powrotem na obiekt
                const user = JSON.parse(savedUserJSON);
                
                // Ustaw stany
                setIsLoggedIn(true);
                setUsername(user.username);
                setAvatar(user.avatar);
            } catch (e) {
                // Jeśli dane są uszkodzone, wyczyść je
                localStorage.removeItem('currentUser');
            }
        }
    }, []); // Pusta tablica [] oznacza "wykonaj tylko raz po załadowaniu"

    const handleLogout = () => {
        // 1. Wyczyść localStorage (Frontend zapomina usera)
        localStorage.removeItem('currentUser');
        
        // 2. Reset stanów
        setIsLoggedIn(false);
        setUsername("");
        setAvatar(null);

        // 3. (Opcjonalnie) Spróbuj powiadomić backend, żeby usunął ciastko
        // Nawet jeśli ten fetch się nie uda (bo nie ma endpointu), frontend i tak wyloguje wizualnie
        fetch('/api/auth/logout', { method: 'POST' }).catch(err => console.log('Backend logout ignored'));

        navigate('/');
    };

    return (
        <header className={styles.header}>
            <div className={styles.titleSection}>
                <div className={styles.logo}>
                    <img src={logo} alt="logo" className={styles.logoImage}/>
                </div>
                <div className={styles.title}>
                    <h2>eSports Tournament organizer</h2>
                </div>
            </div>

            <div className={styles.headerRight}>
                {isLoggedIn ? (
                    // WIDOK ZALOGOWANEGO
                    <div className={styles.userInfoContainer}>
                        <div className={styles.userProfile}>
                            <span className={styles.welcomeText}>
                                Welcome, <strong>{username}</strong>
                            </span>
                            <img 
                                src={avatar || defaultAvatar} 
                                alt="User Avatar" 
                                className={styles.userAvatar} 
                            />
                        </div>
                        <Button 
                            name="Log Out" 
                            onClick={handleLogout} 
                            className={styles.logoutButton} 
                        />
                    </div>
                ) : (
                    // WIDOK GOŚCIA
                    <div className={styles.authButtons}>
                        <Button name="log in" onClick={() => navigate('/login')} className={styles.logInButton} />
                        <Button name="sign up" onClick={() => navigate('/signup')} className={styles.signUpButton} />
                    </div>
                )}
            </div>
        </header>
    );
}

export default TitleBar;