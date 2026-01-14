import React from "react";
import Nav from "../components/nav";
import TitleBar from "../components/titleBar";
import TournamentList from "../components/TournamentList";
import Footer from "../components/Footer";
import styles from "../styles/pages/mainPage.module.css";

function MainPage() {
    return (
        <div className={styles.pageWrapper}>
            <TitleBar />
            <div className={styles.mainContent}>
                <Nav />
                <main className={styles.container}> 
                    <TournamentList />
                    <Footer /> 
                </main>
            </div>
        </div>
    );
}

export default MainPage;