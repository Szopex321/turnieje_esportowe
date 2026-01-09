import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import styles from "../styles/pages/userProfile.module.css";
import defaultAvatar from "../assets/deafultAvatar.jpg";

const UserProfile = () => {
  const navigate = useNavigate();

  // Upewnij się, że ten adres nie ma ukośnika na końcu
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

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // POPRAWKA: Zmiana /User/profile na /user/profile (małe litery)
        // Spróbuj też /users/profile jeśli to nie zadziała
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
            // Logowanie błędu w konsoli, żebyś widział co jest nie tak
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

  const handleSave = async () => {
    setMessage("");
    try {
      const token = localStorage.getItem("jwt_token");
      
      // POPRAWKA: Tutaj też małe litery /user/profile
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
    // Reset formularza
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

  if (loading) return <div style={{ color: "white", padding: 20 }}>Ładowanie...</div>;
  
  // Zabezpieczenie: jeśli user się nie załadował, nie renderuj reszty
  if (!user) return <div style={{ color: "white", padding: 20 }}>Nie udało się pobrać danych użytkownika. Sprawdź konsolę (F12).</div>;

  return (
    <div className={styles.pageWrapper}>
      <TitleBar />
      <div className={styles.contentContainer}>
        <Nav />
        <main className={styles.mainContent}>
          <div className={styles.profileCard}>
            
            <div className={styles.cardHeader}>
              <div 
                className={styles.avatarContainer} 
                style={{ position: 'relative', display: 'inline-block' }}
              >
                <img
                  src={displayAvatarSrc}
                  alt="Avatar"
                  className={styles.largeAvatar}
                  style={{ 
                    objectFit: 'cover',
                    opacity: isEditing ? 0.8 : 1,
                    cursor: isEditing ? 'pointer' : 'default',
                    border: isEditing ? '2px dashed #4ade80' : 'none'
                  }}
                  onClick={() => isEditing && setShowAvatarModal(true)}
                  onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                />
                
                {isEditing && (
                    <div style={{
                        position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)',
                        fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap'
                    }}>
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
                <div style={{
                    marginBottom: '20px', padding: '15px', background: '#222', borderRadius: '8px', border: '1px solid #444'
                }}>
                    <h4 style={{marginTop: 0, color: '#fff'}}>Wybierz avatara:</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                        {availableAvatars.length > 0 ? (
                            availableAvatars.map((avatarObj) => (
                                <img 
                                    key={avatarObj.id} 
                                    src={avatarObj.url} 
                                    alt={avatarObj.name || "Avatar"}
                                    onClick={() => handleAvatarSelect(avatarObj.url)}
                                    style={{
                                        width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer',
                                        border: formData.avatarUrl === avatarObj.url ? '3px solid #4ade80' : '2px solid transparent',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                                    onMouseOut={(e) => e.target.style.transform = 'scale(1.0)'}
                                />
                            ))
                        ) : (
                            <p style={{color: '#888'}}>Ładowanie avatarów...</p>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowAvatarModal(false)}
                        style={{marginTop: '10px', padding: '5px 10px', background: 'transparent', border: '1px solid #666', color: '#ccc', borderRadius: '4px', cursor: 'pointer'}}
                    >
                        Zamknij listę
                    </button>
                </div>
            )}

            {message && (
                <div style={{ textAlign: 'center', color: message.includes("Profil") ? '#4ade80' : '#ff4d4d', margin: '10px 0' }}>
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
                        className={styles.editInput} style={{ opacity: 0.5, cursor: 'not-allowed' }}
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

            <div className={styles.actionButtonsContainer} style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                {isEditing ? (
                    <>
                        <button className={styles.saveButton} onClick={handleSave} 
                            style={{ backgroundColor: '#4ade80', color: '#000', padding: '10px 25px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Zapisz
                        </button>
                        <button className={styles.cancelButton} onClick={handleCancel} 
                            style={{ backgroundColor: '#ff4d4d', color: '#fff', padding: '10px 25px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
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