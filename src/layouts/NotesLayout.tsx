import { NavLink, Outlet } from "react-router-dom";
import { ROUTES } from "../access/routes";
import styles from "./NotesLayout.module.css";

export default function NotesLayout() {
  return (
    <section className={styles.shell}>
      <header className="panel">
        <div className={styles.header}>
          <div>
            <p className="eyebrow">Workspace</p>
            <h2 className={styles.title}>Notes</h2>
          </div>
          <NavLink to={ROUTES.notesNew} className="primary-button">
            Create Note
          </NavLink>
        </div>
      </header>

      <nav className={styles.subnav} aria-label="Notes sections">
        <NavLink
          to={ROUTES.notesDrafts}
          className={({ isActive }) =>
            isActive ? `${styles.subnavLink} ${styles.subnavLinkActive}` : styles.subnavLink
          }
        >
          Drafts
        </NavLink>
        <NavLink
          to={ROUTES.notesPublished}
          className={({ isActive }) =>
            isActive ? `${styles.subnavLink} ${styles.subnavLinkActive}` : styles.subnavLink
          }
        >
          Published
        </NavLink>
      </nav>

      <Outlet />
    </section>
  );
}
