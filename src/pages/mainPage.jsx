import React from "react";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import styles from "../styles/pages/mainPage.module.css";
import TournamentList from "../components/TournamentList";
import Footer from "../components/Footer";

function MainPage() {
    return (
        <>
            <TitleBar />
            <div className={styles.mainContent}>
                <Nav />
                <div className={styles.container}> 
                    <TournamentList />

                    <Footer /> 
                </div>
            </div>
        </>
    );
}

export default MainPage;