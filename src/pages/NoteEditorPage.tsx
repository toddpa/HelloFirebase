import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../access/routes";
import { useAuth } from "../auth/useAuth";
import { NoteEditor, type NoteDraft } from "../components/notes";
import { SectionPanel } from "../components/ui";
import {
  deleteNote,
  NOTE_STATUS,
  NOTE_VISIBILITY,
  createNote,
  getNoteById,
  toPrivateNoteWriteErrorMessage,
  toPrivateNotesErrorMessage,
  updateNote,
  type NoteRecord,
} from "../features/notes";

function getRedirectPath(status: typeof NOTE_STATUS.draft | typeof NOTE_STATUS.published) {
  return status === NOTE_STATUS.published ? ROUTES.notesPublished : ROUTES.notesDrafts;
}

function toEditorDraft(note: NoteRecord): NoteDraft {
  return {
    title: note.title,
    body: note.body,
    published: note.status === NOTE_STATUS.published,
  };
}

export default function NoteEditorPage() {
  const navigate = useNavigate();
  const { noteId } = useParams();
  const { user } = useAuth();
  const isEditMode = typeof noteId === "string";
  const [initialValue, setInitialValue] = useState<NoteDraft>({ title: "", body: "" });
  const [loadedNote, setLoadedNote] = useState<NoteRecord | null>(null);
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const currentStatus = loadedNote?.status ?? NOTE_STATUS.draft;
  const isPublishedNote = isEditMode && currentStatus === NOTE_STATUS.published;
  const primaryStatus = isEditMode ? currentStatus : NOTE_STATUS.published;
  const secondaryStatus = isEditMode
    ? currentStatus === NOTE_STATUS.published
      ? NOTE_STATUS.draft
      : NOTE_STATUS.published
    : NOTE_STATUS.draft;

  useEffect(() => {
    let isActive = true;

    async function loadNote() {
      if (!isEditMode || !noteId) {
        setInitialValue({ title: "", body: "" });
        setLoadedNote(null);
        setErrorMessage(null);
        setIsConfirmingDelete(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const note = await getNoteById(noteId);

        if (!isActive) {
          return;
        }

        if (!note) {
          setLoadedNote(null);
          setErrorMessage("The requested note could not be found.");
          return;
        }

        if (note.visibility !== NOTE_VISIBILITY.private || note.authorId !== user?.uid) {
          setLoadedNote(null);
          setErrorMessage("You do not have permission to edit this note.");
          return;
        }

        setLoadedNote(note);
        setInitialValue(toEditorDraft(note));
        setIsConfirmingDelete(false);
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        setLoadedNote(null);
        setErrorMessage(toPrivateNotesErrorMessage(error));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadNote();

    return () => {
      isActive = false;
    };
  }, [isEditMode, noteId, user?.uid]);

  async function saveNote(status: typeof NOTE_STATUS.draft | typeof NOTE_STATUS.published, draft: NoteDraft) {
    if (!user) {
      setErrorMessage("You must be signed in before saving a note.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEditMode && noteId) {
        await updateNote(noteId, {
          title: draft.title,
          body: draft.body,
          status,
          visibility: NOTE_VISIBILITY.private,
        });
      } else {
        await createNote(user, {
          title: draft.title,
          body: draft.body,
          status,
          visibility: NOTE_VISIBILITY.private,
        });
      }

      navigate(getRedirectPath(status));
    } catch (error: unknown) {
      setErrorMessage(toPrivateNoteWriteErrorMessage(error));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!noteId) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await deleteNote(noteId);
      navigate(getRedirectPath(currentStatus));
    } catch (error: unknown) {
      setErrorMessage(toPrivateNoteWriteErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setIsConfirmingDelete(false);
    }
  }

  if (loading) {
    return (
      <SectionPanel title="Edit note" eyebrow="Notes">
        <p>Loading note...</p>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={isEditMode ? "Edit note" : "Create note"} eyebrow="Notes">
      <NoteEditor
        mode={isEditMode ? "edit" : "create"}
        initialValue={initialValue}
        titleFieldId="note-editor-title"
        bodyFieldId="note-editor-body"
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        labels={{
          createSubmitLabel: "Publish",
          editSubmitLabel: "Save",
          secondarySubmitLabel: isEditMode
            ? isPublishedNote
              ? "Move to Draft"
              : "Publish"
            : "Save Draft",
          savingLabel: "Saving...",
        }}
        placeholders={{
          title: "Planning note",
          body: "Capture the details you want to keep with this note.",
        }}
        onSubmit={async (draft) => {
          await saveNote(primaryStatus, draft);
        }}
        onSecondarySubmit={async (draft) => {
          await saveNote(secondaryStatus, draft);
        }}
        onCancel={isEditMode ? () => navigate(getRedirectPath(loadedNote?.status ?? NOTE_STATUS.draft)) : undefined}
      />
      {isEditMode ? (
        <div className="button-row">
          {!isConfirmingDelete ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={isSubmitting}
            >
              Delete
            </button>
          ) : (
            <>
              <button type="button" onClick={() => void handleDelete()} disabled={isSubmitting}>
                Confirm Delete
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isSubmitting}
              >
                Cancel Delete
              </button>
            </>
          )}
        </div>
      ) : null}
    </SectionPanel>
  );
}
