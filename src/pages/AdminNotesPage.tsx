import { useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { NoteEditor, NoteList, type NoteDraft } from "../components/notes";
import { SectionPanel } from "../components/ui";
import { useDashboardNotes } from "../features/notes";

export default function AdminNotesPage() {
  const { accessState, user } = useAuth();
  const { notes, loading, isSubmitting, errorMessage, successMessage, refresh, createNote } =
    useDashboardNotes({ includeUnpublished: true });

  useEffect(() => {
    if (accessState !== "admin") {
      return;
    }

    void refresh();
  }, [accessState, refresh]);

  if (accessState !== "admin") {
    return (
      <section className="panel">
        <h2>This page is restricted to administrators</h2>
        <p>You do not have administrator access for this project.</p>
      </section>
    );
  }

  return (
    <SectionPanel
      title="Dashboard notes"
      action={
        <button
          type="button"
          className="secondary-button"
          onClick={() => void refresh()}
          disabled={loading || isSubmitting}
        >
          Refresh
        </button>
      }
    >
      <div className="section-heading admin-subsection">
        <div>
          <h3>Create note</h3>
        </div>
      </div>

      <NoteEditor
        mode="create"
        initialValue={{ title: "", body: "", published: true }}
        titleFieldId="dashboard-note-title"
        bodyFieldId="dashboard-note-body"
        publishedFieldId="dashboard-note-published"
        showPublishedToggle
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        successMessage={successMessage}
        placeholders={{
          title: "Weekly dashboard briefing",
          body: "Share the update approved users should see on the dashboard.",
        }}
        labels={{
          createSubmitLabel: "Publish note",
          unpublishedSubmitLabel: "Save draft",
          savingLabel: "Saving...",
        }}
        onSubmit={async (draft: NoteDraft) => {
          if (!user) {
            throw new Error("You must be signed in as an administrator before saving.");
          }

          await createNote(user, draft);
        }}
      />

      <div className="section-heading admin-subsection">
        <div>
          <h3>Recent notes</h3>
        </div>
      </div>

      {loading ? <p>Loading dashboard notes...</p> : null}

      {!loading ? (
        <NoteList
          notes={notes}
          ariaLabel="Recent dashboard notes"
          emptyTitle="No dashboard notes yet."
          emptyMessage="Create the first note above to populate the shared dashboard feed."
          displayOptions={{ showAuthorEmail: true, showPublicationStatus: true }}
        />
      ) : null}
    </SectionPanel>
  );
}
