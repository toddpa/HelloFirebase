import { useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { NoteList } from "../components/notes";
import { FeedbackMessage, SectionPanel } from "../components/ui";
import { useDashboardNotes } from "../features/notes";

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
    <div className="dashboard-home-grid">
      <section className="panel dashboard-hero-panel">
        <h2>Signed-in summary</h2>
        <div className="summary-card dashboard-meta" aria-label="Dashboard summary">
          <p>
            <strong>Role:</strong> <span className="summary-value">{roleLabel}</span>
          </p>
          <p>
            <strong>Email:</strong> <span className="summary-value">{user?.email ?? "No email available"}</span>
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
