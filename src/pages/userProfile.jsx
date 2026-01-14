import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import styles from "../styles/pages/userProfile.module.css";
import defaultAvatar from "../assets/deafultAvatar.jpg";

const UserProfile = () => {
  const navigate = useNavigate();
  const API_BASE_URL = "https://projektturniej.onrender.com/api";

  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    avatarUrl: "" 
  });

  const [availableAvatars, setAvailableAvatars] = useState([]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Pobieranie danych użytkownika i dostępnych avatarów przy załadowaniu komponentu
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const userRes = await fetch(`${API_BASE_URL}/users/profile`, { 
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          setFormData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            username: userData.username || "",
            email: userData.email || "",
            avatarUrl: userData.avatarUrl || "" 
          });
        } else {
            console.error("Błąd pobierania profilu. Status:", userRes.status);
        }

        const avatarsRes = await fetch(`${API_BASE_URL}/avatars`);
        if (avatarsRes.ok) {
            const avatarsData = await avatarsRes.json();
            setAvailableAvatars(avatarsData);
        }

      } catch (err) {
        console.error("Błąd sieci:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (url) => {
      setFormData(prev => ({ ...prev, avatarUrl: url }));
      setShowAvatarModal(false); 
  };

  // Obsługa zapisu zaktualizowanych danych profilu
  const handleSave = async () => {
    setMessage("");
    try {
      const token = localStorage.getItem("jwt_token");
      
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage("Profil zaktualizowany!");
        setIsEditing(false);
        const updatedUser = { ...user, ...formData };
        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify({
           ...updatedUser,
           isLoggedIn: true
        }));
        window.dispatchEvent(new Event("storage"));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Błąd zapisu:", errorData);
        setMessage("Błąd aktualizacji profilu.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Błąd sieci.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowAvatarModal(false);
    setMessage("");
    if (user) {
        setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            username: user.username || "",
            email: user.email || "",
            avatarUrl: user.avatarUrl || ""
        });
    }
  };

  const displayAvatarSrc = formData.avatarUrl || defaultAvatar;

  if (loading) return <div className={styles.loadingMessage}>Ładowanie...</div>;
  
  if (!user) return <div className={styles.loadingMessage}>Nie udało się pobrać danych użytkownika. Sprawdź konsolę (F12).</div>;

  return (
    <div className={styles.pageWrapper}>
      <TitleBar />
      <div className={styles.contentContainer}>
        <Nav />
        <main className={styles.mainContent}>
          <div className={styles.profileCard}>
            
            <div className={styles.cardHeader}>
              <div className={styles.avatarContainer}>
                <img
                  src={displayAvatarSrc}
                  alt="Avatar"
                  className={`${styles.largeAvatar} ${isEditing ? styles.avatarEditable : ''}`}
                  onClick={() => isEditing && setShowAvatarModal(true)}
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
                
                {isEditing && (
                    <div className={styles.avatarEditHint}>
                        Kliknij, aby wybrać
                    </div>
                )}
              </div>

              <div className={styles.headerInfo}>
                <h2>{user.username}</h2>
                <p>{user.email}</p>
                {user.role && <span className={styles.roleBadge}>{user.role}</span>}
              </div>
            </div>

            {showAvatarModal && (
                <div className={styles.avatarModal}>
                    <h4 className={styles.avatarModalTitle}>Wybierz avatara:</h4>
                    <div className={styles.avatarsGrid}>
                        {availableAvatars.length > 0 ? (
                            availableAvatars.map((avatarObj) => (
                                <img 
                                    key={avatarObj.id} 
                                    src={avatarObj.url} 
                                    alt={avatarObj.name || "Avatar"}
                                    onClick={() => handleAvatarSelect(avatarObj.url)}
                                    className={`${styles.avatarItem} ${formData.avatarUrl === avatarObj.url ? styles.avatarItemSelected : ''}`}
                                />
                            ))
                        ) : (
                            <p className={styles.loadingText}>Ładowanie avatarów...</p>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowAvatarModal(false)}
                        className={styles.modalCloseBtn}
                    >
                        Zamknij listę
                    </button>
                </div>
            )}

            {message && (
                <div className={`${styles.messageBox} ${message.includes("Profil") ? styles.messageSuccess : styles.messageError}`}>
                    {message}
                </div>
            )}

            <div className={styles.detailsGrid}>
              <div className={styles.infoGroup}>
                <label className={styles.label}>Imię</label>
                {isEditing ? (
                    <input 
                        type="text" name="firstName" value={formData.firstName}
                        onChange={handleInputChange} className={styles.editInput}
                    />
                ) : <div className={styles.valueBox}>{user.firstName || "-"}</div>}
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.label}>Nazwisko</label>
                {isEditing ? (
                    <input 
                        type="text" name="lastName" value={formData.lastName}
                        onChange={handleInputChange} className={styles.editInput}
                    />
                ) : <div className={styles.valueBox}>{user.lastName || "-"}</div>}
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.label}>Username</label>
                {isEditing ? (
                    <input 
                        type="text" name="username" value={formData.username} readOnly disabled 
                        className={`${styles.editInput} ${styles.inputDisabled}`}
                    />
                ) : <div className={styles.valueBox}>{user.username}</div>}
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.label}>Email</label>
                {isEditing ? (
                    <input 
                        type="email" name="email" value={formData.email}
                        onChange={handleInputChange} className={styles.editInput}
                    />
                ) : <div className={styles.valueBox}>{user.email}</div>}
              </div>
            </div>

            <div className={styles.actionButtonsContainer}>
                {isEditing ? (
                    <>
                        <button className={styles.saveButton} onClick={handleSave}>
                            Zapisz
                        </button>
                        <button className={styles.cancelButton} onClick={handleCancel}>
                            Anuluj
                        </button>
                    </>
                ) : (
                    <button className={styles.actionButton} onClick={() => setIsEditing(true)}>
                        Edytuj profil
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