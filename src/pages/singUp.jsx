import React, { useState } from 'react';
import styles from '../styles/pages/auth.module.css';
import { Link, useNavigate } from 'react-router-dom';
import defaultAvatar from '../assets/deafultAvatar.jpg'; 

const SignUp = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        PasswordHash: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const urlToBase64 = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Hasła nie są takie same!");
            return;
        }

        setLoading(true);

        try {
            let avatarBase64 = '';
            try {
                avatarBase64 = await urlToBase64(defaultAvatar);
            } catch (imgError) {
                console.error("Nie udało się przetworzyć avatara:", imgError);
            }

            const payload = {
                username: formData.username,
                email: formData.email,
                PasswordHash: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                avatar: avatarBase64
            };

            const response = await fetch('/api/users', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                console.log("Rejestracja udana!");
                navigate('/login');
            } else {
                const data = await response.json().catch(() => ({}));
                
                let errorMessage = 'Rejestracja nie powiodła się.';
                if (data.errors) {
                    errorMessage = Object.values(data.errors).flat().join(' ');
                } else if (data.message) {
                    errorMessage = data.message;
                }
                
                setError(errorMessage);
            }

        } catch (err) {
            console.error("Błąd sieci:", err);
            setError("Wystąpił błąd połączenia z serwerem.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.authCard}>
                <h2 className={styles.title}>Create Account</h2>
                
                {/* Avatar z klasą CSS */}
                <div className={styles.avatarContainer}>
                    <img 
                        src={defaultAvatar} 
                        alt="Default Avatar" 
                        className={styles.avatarImage} 
                    />
                </div>

                <p className={styles.subtitle}>Join the eSports community today</p>

                {error && <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

                {/* Formularz z klasą CSS */}
                <form onSubmit={handleSubmit} className={styles.formContainer}>
                    
                    {/* Wiersz z Imieniem i Nazwiskiem */}
                    <div className={styles.formRow}>
                        {/* Dodajemy klasę halfWidth, żeby inputy dzieliły miejsce po połowie */}
                        <div className={`${styles.inputGroup} ${styles.halfWidth}`}>
                            <label className={styles.label}>First Name</label>
                            <input 
                                type="text" 
                                name="firstName"
                                className={styles.input} 
                                placeholder="John"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={`${styles.inputGroup} ${styles.halfWidth}`}>
                            <label className={styles.label}>Last Name</label>
                            <input 
                                type="text" 
                                name="lastName"
                                className={styles.input} 
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Username</label>
                        <input 
                            type="text" 
                            name="username"
                            className={styles.input} 
                            placeholder="GamerTag123"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input 
                            type="email" 
                            name="email"
                            className={styles.input} 
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Password</label>
                        <input 
                            type="password" 
                            name="password"
                            className={styles.input} 
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Confirm Password</label>
                        <input 
                            type="password" 
                            name="confirmPassword"
                            className={styles.input} 
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className={styles.footerText}>
                    Already have an account? 
                    <Link to="/login" className={styles.link}>Log in</Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;