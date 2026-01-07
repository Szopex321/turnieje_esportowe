import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TitleBar from "../components/titleBar";
import Nav from "../components/nav";
import styles from "../styles/pages/userProfile.module.css";
import defaultAvatar from "../assets/deafultAvatar.jpg";

const UserProfile = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  // Nowy stan dla historii meczów
  const [matches, setMatches] = useState([]); 
  
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

  // --- 1. POBIERANIE DANYCH UŻYTKOWNIKA ---
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("jwt_token");
      
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("/api/Auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setFormData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            username: userData.username || "",
            email: userData.email || "",
            avatarUrl: userData.avatarUrl || userData.avatar || ""
          });

          // Po pobraniu usera, pobieramy jego mecze
          fetchUserMatches(userData.id || userData.userId, token);

        } else {
          console.error("Nie udało się pobrać profilu");
          // Fallback do localStorage
          const savedUser = localStorage.getItem("currentUser");
          if (savedUser) {
             const parsed = JSON.parse(savedUser);
             setUser(parsed);
             setFormData(parsed);
             // Próbujemy pobrać mecze używając ID z localStorage
             if(parsed.id) fetchUserMatches(parsed.id, token);
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

  // --- NOWE: POBIERANIE MECZÓW ---
  const fetchUserMatches = async (userId, token) => {
    try {
        // Zakładam endpoint: /api/matches/user/{id} lub podobny.
        // Jeśli nie masz dedykowanego, musisz pobrać wszystkie i filtrować na backendzie.
        const response = await fetch(`/api/matches/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            setMatches(data);
        }
    } catch (err) {
        console.error("Błąd pobierania historii gier:", err);
    }
  };

  // --- NOWE: LOGIKA SORTOWANIA MECZÓW ---
  const getSortedMatches = () => {
    return [...matches].sort((a, b) => {
        // Priorytety statusów (im mniejsza liczba, tym wyżej na liście)
        const priority = {
            'disputed': 1, // SPÓR - Najważniejsze
            'pending': 2,  // OCZEKUJE NA WYNIK - Ważne
            'live': 3,     // TRWA
            'ongoing': 3,
            'scheduled': 4,// ZAPLANOWANE
            'completed': 5 // ZAKOŃCZONE
        };

        const statusA = a.matchStatus?.toLowerCase() || 'completed';
        const statusB = b.matchStatus?.toLowerCase() || 'completed';

        const pA = priority[statusA] || 99;
        const pB = priority[statusB] || 99;

        // Jeśli priorytety są różne, sortuj po nich
        if (pA !== pB) return pA - pB;

        // Jeśli priorytety są takie same (np. oba completed), sortuj po dacie (nowsze wyżej)
        return new Date(b.date || 0) - new Date(a.date || 0);
    });
  };

  // Helper do kolorów statusu
  const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
          case 'disputed': return '#ef4444'; // Czerwony
          case 'pending': return '#fca311';  // Pomarańczowy
          case 'live':
          case 'ongoing': return '#3b82f6';  // Niebieski
          case 'scheduled': return '#888';   // Szary
          case 'completed': return '#10b981';// Zielony
          default: return '#555';
      }
  };
  
  // Helper do tekstu statusu (tłumaczenie/akcja)
  const getStatusLabel = (status) => {
      switch (status?.toLowerCase()) {
          case 'disputed': return '⚠️ SPÓR - WYMAGANA UWAGA';
          case 'pending': return '📝 WPROWADŹ WYNIK';
          case 'live': return 'TRWA';
          case 'scheduled': return 'ZAPLANOWANY';
          case 'completed': return 'ZAKOŃCZONY';
          default: return status;
      }
  };

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

  const sortedMatchesList = getSortedMatches();

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
              <div className={styles.infoGroup}>
                <label className={styles.label}>First Name</label>
                {isEditing ? (
                    <input 
                        type="text" name="firstName" value={formData.firstName}
                        onChange={handleInputChange} className={styles.editInput}
                    />
                ) : (
                    <div className={styles.valueBox}>{user.firstName || "-"}</div>
                )}
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.label}>Last Name</label>
                {isEditing ? (
                    <input 
                        type="text" name="lastName" value={formData.lastName}
                        onChange={handleInputChange} className={styles.editInput}
                    />
                ) : (
                    <div className={styles.valueBox}>{user.lastName || "-"}</div>
                )}
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.label}>Username</label>
                 {isEditing ? (
                    <input 
                        type="text" name="username" value={formData.username}
                        readOnly disabled className={styles.editInput}
                        style={{ cursor: 'not-allowed', opacity: 0.6, backgroundColor: '#333', border: '1px solid #444'}}
                    />
                ) : (
                    <div className={styles.valueBox}>{user.username}</div>
                )}
              </div>

              <div className={styles.infoGroup}>
                <label className={styles.label}>Email Address</label>
                 {isEditing ? (
                    <input 
                        type="email" name="email" value={formData.email}
                        onChange={handleInputChange} className={styles.editInput}
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
                    <button className={styles.actionButton} onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </button>
                )}
            </div>

            {/* --- NOWE: HISTORIA GIER (Match History) --- */}
            <div className={styles.historySection}>
                <h3 className={styles.historyTitle}>Historia Gier</h3>
                
                {sortedMatchesList.length === 0 ? (
                    <p style={{color: '#888', textAlign: 'center'}}>Brak rozegranych lub zaplanowanych meczów.</p>
                ) : (
                    <div className={styles.matchList}>
                        {sortedMatchesList.map(match => (
                            <div 
                                key={match.matchId} 
                                className={styles.matchCard}
                                style={{ borderLeft: `5px solid ${getStatusColor(match.matchStatus)}` }}
                            >
                                <div className={styles.matchInfo}>
                                    <span className={styles.matchTournament}>{match.tournamentName || "Turniej"}</span>
                                    <span className={styles.matchDate}>
                                        {match.startDate ? new Date(match.startDate).toLocaleDateString() : "Data nieznana"}
                                    </span>
                                </div>
                                
                                <div className={styles.matchVersus}>
                                    <span className={match.winnerId === match.teamAId ? styles.winnerName : ''}>
                                        {match.teamAName || "Ty"}
                                    </span>
                                    <span className={styles.vsBadge}>vs</span>
                                    <span className={match.winnerId === match.teamBId ? styles.winnerName : ''}>
                                        {match.teamBName || "Przeciwnik"}
                                    </span>
                                </div>

                                <div className={styles.matchStatusBadge} style={{ color: getStatusColor(match.matchStatus) }}>
                                    {getStatusLabel(match.matchStatus)}
                                </div>
                                
                                {/* Przycisk akcji jeśli trzeba wpisać wynik */}
                                {(match.matchStatus === 'pending' || match.matchStatus === 'disputed') && (
                                    <button 
                                        className={styles.actionBtn}
                                        onClick={() => navigate(`/match/${match.matchId}`)} // Przekierowanie do detali meczu
                                    >
                                        Zarządzaj
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default UserProfile;