import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import styles from "../styles/pages/userProfile.module.css";
import defaultAvatar from "../assets/deafultAvatar.jpg";

const UserProfile = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    avatarUrl: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // --- 1. POBIERANIE DANYCH ---
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("jwt_token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("/api/Auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setFormData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            username: userData.username || "", // Username pobieramy, ale nie będziemy edytować
            email: userData.email || "",
            avatarUrl: userData.avatarUrl || userData.avatar || ""
          });
        } else {
          console.error("Nie udało się pobrać profilu");
          const savedUser = localStorage.getItem("currentUser");
          if (savedUser) {
             const parsed = JSON.parse(savedUser);
             setUser(parsed);
             setFormData(parsed);
          }
        }
      } catch (err) {
        console.error("Błąd sieci:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // --- 2. OBSŁUGA FORMULARZA ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- 3. ZAPISYWANIE ZMIAN ---
  const handleSave = async () => {
    setMessage("");
    try {
      const token = localStorage.getItem("jwt_token");
      const userId = user.id || localStorage.getItem("currentUserId");

      // Pamiętaj: Username nie powinien być zmieniany, więc backend powinien to ignorować
      // lub po prostu wysyłamy ten sam username co był.
      const response = await fetch(`/api/Users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        
        const updatedUser = { ...user, ...formData };
        setUser(updatedUser);

        localStorage.setItem("currentUser", JSON.stringify({
            ...updatedUser,
            isLoggedIn: true
        }));
        
        window.dispatchEvent(new Event("storage"));
      } else {
        setMessage("Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage("Network error occurred.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage("");
    setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || user.avatar || ""
    });
  };

  if (loading) return <div style={{ color: "white", padding: 20 }}>Loading profile...</div>;
  if (!user) return null;

  return (
    <div className={styles.pageWrapper}>
      <TitleBar />
      <div className={styles.contentContainer}>
        <Nav />
        <main className={styles.mainContent}>
          <div className={styles.profileCard}>
            
            {/* Nagłówek Profilu */}
            <div className={styles.cardHeader}>
              <img
                src={formData.avatarUrl || defaultAvatar}
                alt="Profile"
                className={styles.largeAvatar}
              />
              <div className={styles.headerInfo}>
                {/* ZMIANA: Zawsze wyświetlamy tylko tekst, nigdy input dla Username w nagłówku */}
                <h2>{user.username}</h2>
                
                <p>{user.email || "No email"}</p>
                {user.role && <span className={styles.roleBadge}>{user.role}</span>}
              </div>
            </div>

            {/* Komunikaty */}
            {message && (
                <div style={{ 
                    textAlign: 'center', 
                    color: message.includes("success") ? '#4ade80' : '#ff4d4d', 
                    marginBottom: '15px' 
                }}>
                    {message}
                </div>
            )}

            {/* Formularz / Szczegóły */}
            <div className={styles.detailsGrid}>
              
              {/* First Name */}
              <div className={styles.infoGroup}>
                <label className={styles.label}>First Name</label>
                {isEditing ? (
                    <input 
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={styles.editInput}
                    />
                ) : (
                    <div className={styles.valueBox}>{user.firstName || "-"}</div>
                )}
              </div>

              {/* Last Name */}
              <div className={styles.infoGroup}>
                <label className={styles.label}>Last Name</label>
                {isEditing ? (
                    <input 
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={styles.editInput}
                    />
                ) : (
                    <div className={styles.valueBox}>{user.lastName || "-"}</div>
                )}
              </div>

              {/* Username - ZABLOKOWANA EDYCJA */}
              <div className={styles.infoGroup}>
                <label className={styles.label}>Username</label>
                 {isEditing ? (
                    <input 
                        type="text"
                        name="username"
                        value={formData.username}
                        readOnly // Pole tylko do odczytu
                        disabled // Wyłączone (szare)
                        className={styles.editInput}
                        style={{ 
                            cursor: 'not-allowed', 
                            opacity: 0.6, 
                            backgroundColor: '#333', // Ciemniejsze tło sugerujące blokadę
                            border: '1px solid #444'
                        }}
                    />
                ) : (
                    <div className={styles.valueBox}>{user.username}</div>
                )}
              </div>

              {/* Email */}
              <div className={styles.infoGroup}>
                <label className={styles.label}>Email Address</label>
                 {isEditing ? (
                    <input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={styles.editInput}
                    />
                ) : (
                    <div className={styles.valueBox}>{user.email}</div>
                )}
              </div>
            </div>

            {/* Przyciski Akcji */}
            <div className={styles.actionButtonsContainer} style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                {isEditing ? (
                    <>
                        <button className={styles.saveButton} onClick={handleSave} style={{ backgroundColor: '#4ade80', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Save Changes
                        </button>
                        <button className={styles.cancelButton} onClick={handleCancel} style={{ backgroundColor: '#ff4d4d', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Cancel
                        </button>
                    </>
                ) : (
                    <button
                        className={styles.actionButton}
                        onClick={() => setIsEditing(true)}
                    >
                        Edit Profile
                    </button>
                )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;