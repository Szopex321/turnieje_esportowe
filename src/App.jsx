// import React, { useEffect, useState } from "react";
import TournamentList from "./components/TournamentList";
import MainPage from "./pages/mainPage";
import LogIn from "./pages/logIn.jsx";
import SignUp from "./pages/singUp.jsx";
import { Routes, Route } from "react-router-dom";
import TeamsPage from "./pages/TeamsPage.jsx";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainPage />} />

        <Route path="/login" element={<LogIn />} />

        <Route path="/signup" element={<SignUp />} />

        {/* NOWA TRASA */}
        {/* <Route path="/profile" element={<UserProfile />} /> */}

        <Route path="/teams" element={<TeamsPage />} />
      </Routes>
    </>
  );
}

export default App;
