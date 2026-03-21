import { useEffect, useState } from "react";
import { ROUTES, getDashboardNavItems } from "../access/routes";
import { useAuth } from "../auth/useAuth";
import NotesList from "../components/notes/NotesList";
import {
  listPublishedDashboardNotes,
  toDashboardNotesErrorMessage,
  type DashboardNote,
} from "../features/notes";

const MODULE_SUMMARY_COPY: Record<string, string> = {
  [ROUTES.dashboard]: "Shared home surface for status, notes, and the modules available to your role.",
  [ROUTES.admin]: "Access management and note publishing tools reserved for administrators.",
  [ROUTES.moduleA]: "Read shared subscriber content pulled from Firestore.",
  [ROUTES.moduleB]: "Run the admin-only Firestore write flow for restricted announcements.",
};

export default function DashboardPage() {
  const { accessState, normalizedEmail, user } = useAuth();
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);

  const navItems = getDashboardNavItems(accessState);
  const roleLabel = accessState === "admin" ? "Administrator" : "Approved user";

  async function loadNotes() {
    setLoadingNotes(true);
    setNotesError(null);

    try {
      const nextNotes = await listPublishedDashboardNotes();
      setNotes(nextNotes);
    } catch (error: unknown) {
      setNotes([]);
      setNotesError(toDashboardNotesErrorMessage(error));
    } finally {
      setLoadingNotes(false);
    }
  }

  useEffect(() => {
    if (accessState !== "approved" && accessState !== "admin") {
      return;
    }

    void loadNotes();
  }, [accessState]);

  return (
    <div className="dashboard-home-grid">
      <section className="panel dashboard-hero-panel">
        <p className="eyebrow">Dashboard Home</p>
        <h2>Welcome back{user?.displayName ? `, ${user.displayName}` : ""}</h2>
        <p>
          This shared workspace keeps the current access model intact while giving approved users
          and admins one place to orient themselves, read published notes, and jump into the right modules.
        </p>

        <div className="dashboard-summary-grid" aria-label="Dashboard summary">
          <article className="summary-card">
            <p className="eyebrow">Role</p>
            <strong>{roleLabel}</strong>
            <p className="muted-copy">Your current access controls which routes and tools are available.</p>
          </article>
          <article className="summary-card">
            <p className="eyebrow">Email</p>
            <strong>{user?.email ?? "No email available"}</strong>
            <p className="muted-copy">Normalized key: {normalizedEmail ?? "Unavailable"}</p>
          </article>
          <article className="summary-card">
            <p className="eyebrow">Available Modules</p>
            <strong>{navItems.length}</strong>
            <p className="muted-copy">Your navigation only shows routes your access state can open.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Workspace Map</p>
            <h2>Available areas</h2>
            <p>Use these shortcuts to move between the modules already wired into this dashboard shell.</p>
          </div>
        </div>

        <div className="dashboard-module-grid">
          {navItems.map((item) => (
            <article key={item.to} className="summary-card">
              <p className="eyebrow">{item.label}</p>
              <strong>{item.to}</strong>
              <p className="muted-copy">
                {MODULE_SUMMARY_COPY[item.to] ?? "Dashboard route available to your role."}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Dashboard Notes</p>
            <h2>Published updates</h2>
            <p>Approved users and admins can read the latest published notes here, newest first.</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => void loadNotes()} disabled={loadingNotes}>
            Refresh
          </button>
        </div>

        {notesError ? (
          <p className="auth-error" role="alert">
            {notesError}
          </p>
        ) : null}

        {loadingNotes ? <p>Loading dashboard notes...</p> : null}

        {!loadingNotes && !notesError ? (
          <NotesList
            notes={notes}
            ariaLabel="Published dashboard notes"
            emptyTitle="No dashboard notes yet."
            emptyMessage="Published updates from administrators will appear here."
          />
        ) : null}
      </section>
    </div>
  );
}
