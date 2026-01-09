import styles from "../styles/components/navButton.module.css";
import { Link } from "react-router-dom";

function NavButton(props) {
  return (
    <Link to={props.path} className={styles.button}>
      <img src={props.icon} className={styles.icon} alt={props.name} />
      <span>{props.name}</span>
    </Link>
  );
}

export default NavButton;