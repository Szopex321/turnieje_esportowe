import React, { useState, useEffect } from "react";
import styles from "../styles/pages/auth.module.css";
import { Link, useNavigate } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const [avatarList, setAvatarList] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null); // Przechowujemy URL (string)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 1. POBIERANIE AWATARÓW ---
  useEffect(() => {
    const fetchAvatars = async () => {
        try {
            const response = await fetch('/api/avatars');
            
            if (response.ok) {
                const data = await response.json();
                setAvatarList(data); // Zapisujemy całe obiekty (id, url, name)
                
                // POPRAWKA: Ustawiamy domyślny URL, pobierając .url z pierwszego obiektu
                if (data.length > 0) {
                    setSelectedAvatar(data[0].url); 
                }
            } else {
                console.error("Błąd pobierania awatarów");
            }
        } catch (err) {
            console.error("Błąd sieci:", err);
        }
    };

    fetchAvatars();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (url) => {
    setSelectedAvatar(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Hasła nie są takie same!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        Password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        avatarUrl: selectedAvatar || "", // Wysyłamy URL
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("Rejestracja udana!");
        navigate("/login");
      } else {
        const data = await response.json().catch(() => ({}));
        let errorMessage = data.message || "Rejestracja nie powiodła się.";
        if (data.errors) errorMessage = Object.values(data.errors).flat().join(" ");
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
      <div className={styles.authCard} style={{ maxWidth: '500px' }}>
        <h2 className={styles.title}>Create Account</h2>
        <p className={styles.subtitle}>Choose your avatar</p>

        {/* --- POPRAWIONA SEKCJA AWATARÓW --- */}
        <div className={styles.avatarGrid}>
            {avatarList.length > 0 ? (
                avatarList.map((avatarObj) => (
                    <img
                        key={avatarObj.id} // Używamy ID z bazy jako klucza
                        src={avatarObj.url} // <--- TU BYŁ BŁĄD: Teraz bierzemy .url
                        alt={avatarObj.name || "Avatar"} // Używamy nazwy z bazy
                        onClick={() => handleAvatarSelect(avatarObj.url)}
                        className={`${styles.avatarOption} ${selectedAvatar === avatarObj.url ? styles.avatarSelected : ''}`}
                    />
                ))
            ) : (
                <p style={{ color: "#aaa", fontSize: "0.9rem" }}>Loading avatars...</p>
            )}
        </div>

        {error && (
          <div style={{ color: "red", margin: "15px 0", textAlign: "center" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          {/* ... reszta formularza bez zmian ... */}
          <div className={styles.formRow}>
            <div className={`${styles.inputGroup} ${styles.halfWidth}`}>
              <label className={styles.label}>First Name</label>
              <input type="text" name="firstName" className={styles.input} placeholder="John" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className={`${styles.inputGroup} ${styles.halfWidth}`}>
              <label className={styles.label}>Last Name</label>
              <input type="text" name="lastName" className={styles.input} placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <input type="text" name="username" className={styles.input} placeholder="GamerTag123" value={formData.username} onChange={handleChange} required />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input type="email" name="email" className={styles.input} placeholder="name@example.com" value={formData.email} onChange={handleChange} required />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input type="password" name="password" className={styles.input} placeholder="••••••••" value={formData.password} onChange={handleChange} required />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirm Password</label>
            <input type="password" name="confirmPassword" className={styles.input} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account? <Link to="/login" className={styles.link}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;