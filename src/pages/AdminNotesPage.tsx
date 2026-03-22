import { useEffect, useState } from "react";
import AdminNoteForm from "../components/notes/AdminNoteForm";
import NotesList from "../components/notes/NotesList";
import { useAuth } from "../auth/useAuth";
import { listRecentDashboardNotes, type DashboardNote } from "../features/notes";

export default function AdminNotesPage() {
  const { accessState } = useAuth();
  const [recentNotes, setRecentNotes] = useState<DashboardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadRecentNotes() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const noteRecords = await listRecentDashboardNotes();
      setRecentNotes(noteRecords);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load the dashboard notes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessState !== "admin") {
      return;
    }

    void loadRecentNotes();
  }, [accessState]);

  if (accessState !== "admin") {
    return (
      <section className="panel">
        <h2>This page is restricted to administrators</h2>
        <p>You do not have administrator access for this project.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Dashboard notes</h2>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void loadRecentNotes()}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {errorMessage ? (
        <p className="auth-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="section-heading admin-subsection">
        <div>
          <h3>Create note</h3>
        </div>
      </div>

      <AdminNoteForm onCreated={loadRecentNotes} />

      <div className="section-heading admin-subsection">
        <div>
          <h3>Recent notes</h3>
        </div>
      </div>

      {loading ? <p>Loading dashboard notes...</p> : null}

      {!loading ? (
        <NotesList
          notes={recentNotes}
          ariaLabel="Recent dashboard notes"
          emptyTitle="No dashboard notes yet."
          emptyMessage="Create the first note above to populate the shared dashboard feed."
          showAuthorEmail
          showPublicationStatus
        />
      ) : null}
    </section>
  );
}
