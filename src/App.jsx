import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import MainPage from "./pages/mainPage";
import LogIn from "./pages/logIn.jsx";
import SignUp from "./pages/singUp.jsx";
import TeamsPage from "./pages/TeamsPage.jsx";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("jwt_token");

      if (token) {
        try {
          // Używam zmiennej środowiskowej lub stałej dla URL
          const apiUrl = "https://localhost:5001/api/Auth/me";
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
            console.log("Token expired or invalid. Clearing session.");
            localStorage.removeItem("jwt_token");
            setUser(null);
          } else {
            console.error(
              `Failed to fetch user data: ${response.status} ${response.statusText}`
            );
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
        <Route path="/" element={<MainPage user={user} />} />

        <Route path="/login" element={<LogIn setUser={setUser} />} />

        <Route path="/signup" element={<SignUp />} />

        {/* Przekazujesz user, co jest OK */}
        <Route path="/teams" element={<TeamsPage user={user} />} />
      </Routes>
    </>
  );
}

export default App;
