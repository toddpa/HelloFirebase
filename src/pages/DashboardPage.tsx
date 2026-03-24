import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ROUTES } from "../access/routes";
import { SectionPanel } from "../components/ui";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  const { accessState, user } = useAuth();
  const roleLabel = accessState === "admin" ? "Administrator" : "Approved user";

  return (
    <div className={styles.homeGrid}>
      <section className={`panel ${styles.heroPanel}`}>
        <h2>Signed-in summary</h2>
        <div className={`${styles.summaryCard} ${styles.meta}`} aria-label="Dashboard summary">
          <p>
            <strong>Role:</strong> <span className={styles.summaryValue}>{roleLabel}</span>
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <span className={styles.summaryValue}>{user?.email ?? "No email available"}</span>
          </p>
        </div>
      </section>

      <SectionPanel
        title="Notes workspace"
        action={
          <Link to={ROUTES.notesDrafts} className="secondary-button">
            Open Notes
          </Link>
        }
      >
        <p className="muted-copy">
          Create, edit, publish, and manage notes from the dedicated workspace.
        </p>
        <div className="button-row">
          <Link to={ROUTES.notesDrafts} className="secondary-button">
            View drafts
          </Link>
          <Link to={ROUTES.notesPublished} className="secondary-button">
            View published
          </Link>
          <Link to={ROUTES.notesNew} className="secondary-button">
            Create note
          </Link>
        </div>
      </SectionPanel>
    </div>
  );
}
