import { useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { NoteEditor, NoteList, type NoteDraft } from "../components/notes";
import { SectionPanel } from "../components/ui";
import { useModuleANotes } from "../moduleA/useModuleANotes";

export default function ModuleAPage() {
  const { accessState, user } = useAuth();
  const { notes, loading, isSubmitting, errorMessage, successMessage, refresh, createNote } =
    useModuleANotes();

  useEffect(() => {
    if ((accessState !== "approved" && accessState !== "admin") || !user) {
      return;
    }

    void refresh(user);
  }, [accessState, refresh, user]);

  return (
    <SectionPanel
      title="Private notes"
      eyebrow="My Notes"
      action={
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            if (!user) {
              return;
            }

            void refresh(user);
          }}
          disabled={loading || isSubmitting}
        >
          Refresh
        </button>
      }
    >
      <NoteEditor
        mode="create"
        initialValue={{ title: "", body: "" }}
        titleFieldId="module-a-title"
        bodyFieldId="module-a-body"
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        successMessage={successMessage}
        placeholders={{
          title: "Personal follow-up",
          body: "Capture the note only you should see.",
        }}
        labels={{
          createSubmitLabel: "Save note",
          savingLabel: "Saving...",
        }}
        onSubmit={async (draft: NoteDraft) => {
          if (!user) {
            throw new Error("You must be signed in before saving a note.");
          }

          await createNote(user, draft);
        }}
      />

      {loading ? <p>Loading your notes...</p> : null}

      {!loading ? (
        <NoteList
          notes={notes}
          ariaLabel="My notes"
          emptyTitle="No notes yet."
          displayOptions={{ showUpdatedAt: true }}
        />
      ) : null}
    </SectionPanel>
  );
}
