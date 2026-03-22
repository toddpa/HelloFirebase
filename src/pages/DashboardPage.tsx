import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import NotesList from "../components/notes/NotesList";
import {
  listPublishedDashboardNotes,
  toDashboardNotesErrorMessage,
  type DashboardNote,
} from "../features/notes";

export default function DashboardPage() {
  const { accessState, user } = useAuth();
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesErrorMessage, setNotesErrorMessage] = useState<string | null>(null);

  const roleLabel = accessState === "admin" ? "Administrator" : "Approved user";
  const isAdmin = accessState === "admin";

  async function loadNotes() {
    setNotesLoading(true);
    setNotesErrorMessage(null);

    try {
      const nextNotes = await listPublishedDashboardNotes();
      setNotes(nextNotes);
    } catch (error: unknown) {
      setNotes([]);
      setNotesErrorMessage(toDashboardNotesErrorMessage(error));
    } finally {
      setNotesLoading(false);
    }
  }

  useEffect(() => {
    if (accessState !== "approved" && accessState !== "admin") {
      setNotes([]);
      setNotesLoading(false);
      setNotesErrorMessage(null);
      return;
    }

    void loadNotes();
  }, [accessState]);

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

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Notes</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadNotes()}
            disabled={notesLoading}
          >
            Refresh
          </button>
        </div>

        {notesErrorMessage ? (
          <p className="auth-error" role="alert">
            {notesErrorMessage}
          </p>
        ) : null}

        {notesLoading ? <p>Loading dashboard notes...</p> : null}

        {!notesLoading && !notesErrorMessage ? (
          <NotesList
            notes={notes}
            ariaLabel="Dashboard notes"
            emptyTitle="No notes available yet."
            showAuthorEmail={isAdmin}
          />
        ) : null}
      </section>
    </div>
  );
}
