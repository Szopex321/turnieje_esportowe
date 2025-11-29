import React, { useState, useEffect } from 'react';
import styles from '../styles/components/nav.module.css';
import NavButton from './navButton';
import { Link, useLocation } from 'react-router-dom'; // Używamy Link do nawigacji

function Nav() {
    const [isAdmin, setIsAdmin] = useState(true);
    const location = useLocation(); // Żeby odświeżyć navbar po zmianie strony (np. po logowaniu)

    // Sprawdzamy rolę przy każdym renderze paska nawigacji
    useEffect(() => {
        const savedUserJSON = localStorage.getItem('currentUser');
        if (savedUserJSON) {
            try {
                const user = JSON.parse(savedUserJSON);
                // Sprawdzamy czy rola to 'admin' (wielkość liter ma znaczenie!)
                if (user.role === 'admin' && user.isLoggedIn) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } catch (e) {
                //setIsAdmin(false);
            }
        } else {
            //setIsAdmin(false);
        }
        setIsAdmin(true);
    }, [location]); // Zależność od 'location' wymusza odświeżenie po nawigacji

    return (
        <aside className={styles.sidebar}>
            <h2>Menu</h2>
            <ul>
                {/* Linkujemy przyciski do odpowiednich ścieżek */}
                <li>
                    <Link to="/tournaments" style={{textDecoration: 'none'}}>
                        <NavButton name="Tournaments" />
                    </Link>
                </li>
                <li>
                    <Link to="/teams" style={{textDecoration: 'none'}}>
                        <NavButton name="Team" />
                    </Link>
                </li>
                <li>
                    <Link to="/top" style={{textDecoration: 'none'}}>
                         <NavButton name="Top Players/Teams" />
                    </Link>
                </li>

                {/* --- SEKCJ ADMINA (Widoczna tylko dla admina) --- */}
                {isAdmin && (
                    <>
                        <li className={styles.separator}></li> {/* Opcjonalny separator w CSS */}
                        <li style={{marginTop: '20px'}}>
                            <Link to="/admin/add-tournament" style={{textDecoration: 'none'}}>
                                {/* Możesz tu użyć innej ikony w NavButton */}
                                <NavButton name="[Admin] Add Tournament" />
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </aside>
    );
}

export default Nav;