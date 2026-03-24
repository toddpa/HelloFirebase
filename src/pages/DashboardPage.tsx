import { useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { NoteList } from "../components/notes";
import { FeedbackMessage, SectionPanel } from "../components/ui";
import { useDashboardNotes } from "../features/notes";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  const { accessState, user } = useAuth();
  const { notes, loading, errorMessage, refresh } = useDashboardNotes();

  const roleLabel = accessState === "admin" ? "Administrator" : "Approved user";
  const isAdmin = accessState === "admin";

  useEffect(() => {
    if (accessState !== "approved" && accessState !== "admin") {
      return;
    }

    void refresh();
  }, [accessState, refresh]);

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
        title="Notes"
        action={
          <button
            type="button"
            className="secondary-button"
            onClick={() => void refresh()}
            disabled={loading}
          >
            Refresh
          </button>
        }
      >
        <FeedbackMessage kind="error" message={errorMessage} />
        {loading ? <p>Loading dashboard notes...</p> : null}

        {!loading && !errorMessage ? (
          <NoteList
            notes={notes}
            ariaLabel="Dashboard notes"
            emptyTitle="No notes available yet."
            displayOptions={{ showAuthorEmail: isAdmin }}
          />
        ) : null}
      </SectionPanel>
    </div>
  );
}
