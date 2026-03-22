import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES, getDashboardNavItems } from "../access/routes";
import { useAuth } from "../auth/useAuth";
import NotesList from "../components/notes/NotesList";
import {
  subscribeToAdminAnnouncements,
  toAdminAnnouncementsErrorMessage,
  type AdminAnnouncement,
} from "../features/adminAnnouncements";
import {
  listPublishedDashboardNotes,
  toDashboardNotesErrorMessage,
  type DashboardNote,
} from "../features/notes";

const MODULE_SUMMARY_COPY: Record<string, string> = {
  [ROUTES.dashboard]: "Shared home surface for status and the modules available to your role.",
  [ROUTES.admin]: "Approve access requests and manage the subscriber allow list.",
  [ROUTES.adminNotes]: "Create and review the shared dashboard notes reserved for administrators.",
  [ROUTES.moduleA]: "Read shared subscriber content pulled from Firestore.",
  [ROUTES.moduleB]: "Run the admin-only Firestore write flow for restricted announcements.",
};

const QUICK_LINK_DESCRIPTIONS: Record<string, string> = {
  [ROUTES.admin]: "Review access requests and maintain the approved subscriber list.",
  [ROUTES.adminNotes]: "Publish shared notes and review recent note history in one admin-only place.",
  [ROUTES.moduleA]: "Open the shared module available to every approved dashboard user.",
  [ROUTES.moduleB]: "Jump into the admin-only write flow for restricted operational updates.",
};

export default function DashboardPage() {
  const { accessState, normalizedEmail, user } = useAuth();
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsErrorMessage, setAnnouncementsErrorMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesErrorMessage, setNotesErrorMessage] = useState<string | null>(null);

  const navItems = getDashboardNavItems(accessState);
  const roleLabel = accessState === "admin" ? "Administrator" : "Approved user";
  const quickLinks = navItems.filter((item) => item.to !== ROUTES.dashboard);
  const welcomeName = user?.displayName ?? user?.email ?? "there";
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
      setAnnouncements([]);
      setAnnouncementsLoading(false);
      setAnnouncementsErrorMessage(null);
      return;
    }

    setAnnouncementsLoading(true);
    setAnnouncementsErrorMessage(null);

    const unsubscribe = subscribeToAdminAnnouncements({
      onAnnouncements: (nextAnnouncements) => {
        setAnnouncements(nextAnnouncements);
        setAnnouncementsLoading(false);
      },
      onError: (error) => {
        setAnnouncements([]);
        setAnnouncementsLoading(false);
        setAnnouncementsErrorMessage(toAdminAnnouncementsErrorMessage(error));
      },
    });

    return unsubscribe;
  }, [accessState]);

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
        <p className="eyebrow">Dashboard Home</p>
        <h2>Welcome back, {welcomeName}</h2>
        <p>
          This landing page gives approved users and administrators one place to confirm their
          access, review their signed-in identity, and jump into the modules available to them.
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
            <p className="eyebrow">Workspace Overview</p>
            <h2>What you can access</h2>
            <p>
              {isAdmin
                ? "Your administrator access unlocks every dashboard area, including the admin-only tools."
                : "Your approved access unlocks the shared dashboard experience and Module A."}
            </p>
          </div>
        </div>

        <div className="dashboard-module-grid">
          {quickLinks.map((item) => (
            <article key={item.to} className="summary-card">
              <strong>{item.label}</strong>
              <p className="muted-copy">
                {QUICK_LINK_DESCRIPTIONS[item.to] ?? MODULE_SUMMARY_COPY[item.to] ?? "Dashboard route available to your role."}
              </p>
              <Link className="dashboard-inline-link" to={item.to}>
                Open {item.label}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Next Steps</p>
            <h2>Start from the right place</h2>
            <p>
              Use the sidebar or the quick links above to move through the dashboard. Access rules stay
              enforced on every route, so you will only see and open the areas available to your role.
            </p>
          </div>
        </div>
        <div className="dashboard-summary-grid" aria-label="Dashboard next steps">
          <article className="summary-card">
            <p className="eyebrow">Dashboard</p>
            <strong>Use this as your landing surface</strong>
            <p className="muted-copy">
              Return here any time you need a quick view of your account, access level, and available modules.
            </p>
          </article>
          <article className="summary-card">
            <p className="eyebrow">Protection</p>
            <strong>Route guards remain active</strong>
            <p className="muted-copy">
              If you try to open something outside your permissions, the app redirects you to the correct home route.
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Announcements</p>
            <h2>Admin announcements</h2>
            <p>Shared operational announcements appear here for approved users and administrators.</p>
          </div>
        </div>

        {announcementsErrorMessage ? (
          <p className="auth-error" role="alert">
            {announcementsErrorMessage}
          </p>
        ) : null}

        {announcementsLoading ? <p>Loading announcements...</p> : null}

        {!announcementsLoading && !announcementsErrorMessage && announcements.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No announcements yet.</p>
            <p className="muted-copy">Announcements created by admins will appear here automatically.</p>
          </div>
        ) : null}

        {!announcementsLoading && announcements.length > 0 ? (
          <div className="record-list" aria-label="Admin announcements">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="record-card">
                <div>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.description}</p>
                  <p className="muted-copy">
                    {announcement.createdAt
                      ? `Posted ${announcement.createdAt.toDate().toLocaleString()}`
                      : "Posted time not available"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Dashboard Notes</p>
            <h2>Latest shared notes</h2>
            <p>
              Published dashboard notes appear here for every approved dashboard user, while admin
              creation stays on the admin page.
            </p>
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
            emptyMessage="Published dashboard notes will appear here once an admin adds one."
            showAuthorEmail={isAdmin}
          />
        ) : null}
      </section>
    </div>
  );
}
