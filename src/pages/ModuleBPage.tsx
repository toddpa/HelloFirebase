import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { createModuleBRecord, toModuleBWriteErrorMessage } from "../moduleB/service";
import type { ModuleBFormState } from "../moduleB/types";

const INITIAL_FORM_STATE: ModuleBFormState = {
  title: "",
  details: "",
};

export default function ModuleBPage() {
  const { accessState, user } = useAuth();
  const [formState, setFormState] = useState<ModuleBFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (accessState !== "admin") {
    return (
      <section className="panel">
        <p className="eyebrow">Module B</p>
        <h2>Admin access required</h2>
        <p>This module can only be used by administrators with write permission.</p>
      </section>
    );
  }

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
      const documentId = await createModuleBRecord(user, formState);
      setFormState(INITIAL_FORM_STATE);
      setSuccessMessage(`Admin update saved to Firestore. Document ID: ${documentId}`);
    } catch (error: unknown) {
      setErrorMessage(toModuleBWriteErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Module B</p>
          <h2>Admin-only Firestore write</h2>
          <p>Use this small form to create a restricted admin update and verify write permissions end to end.</p>
        </div>
        <span className="status-pill">Admin write</span>
      </div>

      <form className="stacked-form" onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <label className="field-label" htmlFor="module-b-title">
            Title
          </label>
          <input
            id="module-b-title"
            type="text"
            value={formState.title}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                title: event.target.value,
              }))
            }
            placeholder="Quarterly launch note"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="module-b-details">
            Details
          </label>
          <textarea
            id="module-b-details"
            value={formState.details}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                details: event.target.value,
              }))
            }
            placeholder="Summarize the admin-only update you want to store."
            rows={5}
            disabled={isSubmitting}
          />
        </div>

        <div className="button-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save admin update"}
          </button>
          <p className="muted-copy">Writes are allowed only when both the route guard and Firestore rules recognize this account as an admin.</p>
        </div>
      </form>

      {successMessage ? <p className="success-copy">{successMessage}</p> : null}
      {errorMessage ? (
        <p className="auth-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
