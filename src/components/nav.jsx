import styles from "../styles/components/nav.module.css";
import NavButton from "./navButton";

function Nav() {
  return (
    <aside className={styles.sidebar}>
      <h2>Menu</h2>
      <ul>
        <li>
          <NavButton name="Tournaments" path="/" />
        </li>
        <li>
          <NavButton name="Teams" path="/teams" />
        </li>
        <li>
          <NavButton name="Top Players/Teams" />
        </li>
      </ul>
    </aside>
  );
}

export default Nav;
