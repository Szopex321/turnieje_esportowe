import React from "react";
import styles from "../styles/components/footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} eSports Tournament Organizer. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;