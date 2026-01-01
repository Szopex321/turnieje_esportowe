import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import MainPage from "./pages/mainPage";
import LogIn from "./pages/logIn.jsx";
import SignUp from "./pages/singUp.jsx";
import UserProfile from "./pages/userProfile.jsx";
import TeamsPage from "./pages/TeamsPage.jsx";
import AdminPanel from "./pages/AdminPanel";

const API_BASE_URL = "https://projektturniej.onrender.com/api";

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("jwt_token");

      if (token) {
        try {
          const apiUrl = `${API_BASE_URL}/Auth/me`;
          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else if (response.status === 401) {
            localStorage.removeItem("jwt_token");
            setUser(null);
          } else {
            localStorage.removeItem("jwt_token");
            setUser(null);
          }
        } catch (error) {
          console.error("Network or fetch error:", error);
        }
      }
    };

    fetchUser();
  }, []);

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={<MainPage user={user} handleLogout={handleLogout} />}
        />
        <Route path="/login" element={<LogIn setUser={setUser} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/teams" element={<TeamsPage user={user} />} />

        <Route path="/profile" element={<UserProfile />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </>
  );
}

export default App;
