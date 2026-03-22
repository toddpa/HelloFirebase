import { useState, type FormEvent } from "react";
import { useAuth } from "../../auth/useAuth";
import { createDashboardNote, type DashboardNoteFormState } from "../../features/notes";

const INITIAL_FORM_STATE: DashboardNoteFormState = {
  title: "",
  body: "",
  published: true,
};

type AdminNoteFormProps = {
  onCreated?: () => Promise<void> | void;
};

export default function AdminNoteForm({ onCreated }: AdminNoteFormProps) {
  const { user } = useAuth();
  const [formState, setFormState] = useState<DashboardNoteFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("You must be signed in as an administrator before saving.");
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const documentId = await createDashboardNote(user, formState);
      setFormState(INITIAL_FORM_STATE);
      setSuccessMessage(`Dashboard note saved to Firestore. Document ID: ${documentId}`);

      if (onCreated) {
        await onCreated();
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the dashboard note.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="stacked-form" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <label className="field-label" htmlFor="dashboard-note-title">
          Title
        </label>
        <input
          id="dashboard-note-title"
          type="text"
          value={formState.title}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              title: event.target.value,
            }))
          }
          placeholder="Weekly dashboard briefing"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="dashboard-note-body">
          Body
        </label>
        <textarea
          id="dashboard-note-body"
          value={formState.body}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              body: event.target.value,
            }))
          }
          placeholder="Share the update approved users should see on the dashboard."
          rows={5}
          disabled={isSubmitting}
        />
      </div>

      <label className="checkbox-row" htmlFor="dashboard-note-published">
        <input
          id="dashboard-note-published"
          type="checkbox"
          checked={formState.published}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              published: event.target.checked,
            }))
          }
          disabled={isSubmitting}
        />
        Publish immediately
      </label>

      <div className="button-row">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : formState.published ? "Publish note" : "Save draft"}
        </button>
      </div>

      {successMessage ? <p className="success-copy">{successMessage}</p> : null}
      {errorMessage ? (
        <p className="auth-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
