import { useEffect, useState, type FormEvent } from "react";
import type { Timestamp } from "firebase/firestore";
import { useAuth } from "../auth/useAuth";
import {
  createModuleAItem,
  listModuleAItems,
  toModuleAErrorMessage,
} from "../moduleA/service";
import type { ModuleAFormState, ModuleAItem } from "../moduleA/types";

const INITIAL_FORM_STATE: ModuleAFormState = {
  title: "",
  body: "",
};

function formatTimestamp(value: Timestamp | null) {
  if (!value) {
    return "Created time not available";
  }

  return value.toDate().toLocaleString();
}

export default function ModuleAPage() {
  const { accessState, user } = useAuth();
  const [items, setItems] = useState<ModuleAItem[]>([]);
  const [formState, setFormState] = useState<ModuleAFormState>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadItems() {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextItems = await listModuleAItems(user);
      setItems(nextItems);
    } catch (error: unknown) {
      setItems([]);
      setErrorMessage(toModuleAErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("You must be signed in before saving a note.");
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const documentId = await createModuleAItem(user, formState);
      setFormState(INITIAL_FORM_STATE);
      setSuccessMessage(`Note saved. Document ID: ${documentId}`);
      await loadItems();
    } catch (error: unknown) {
      setErrorMessage(toModuleAErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (accessState !== "approved" && accessState !== "admin") {
      return;
    }

    void loadItems();
  }, [accessState, user]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">My Notes</p>
          <h2>Private notes</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => void loadItems()} disabled={loading}>
          Refresh
        </button>
      </div>

      <form className="stacked-form" onSubmit={(event) => void handleSubmit(event)}>
        <div>
          <label className="field-label" htmlFor="module-a-title">
            Title
          </label>
          <input
            id="module-a-title"
            type="text"
            value={formState.title}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                title: event.target.value,
              }))
            }
            placeholder="Personal follow-up"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="module-a-body">
            Body
          </label>
          <textarea
            id="module-a-body"
            value={formState.body}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                body: event.target.value,
              }))
            }
            placeholder="Capture the note only you should see."
            rows={5}
            disabled={isSubmitting}
          />
        </div>

        <div className="button-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save note"}
          </button>
        </div>
      </form>

      {successMessage ? <p className="success-copy">{successMessage}</p> : null}
      {errorMessage ? (
        <p className="auth-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {loading ? <p>Loading your notes...</p> : null}

      {!loading && !errorMessage && items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No notes yet.</p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="record-list" aria-label="My notes">
          {items.map((item) => (
            <article key={item.id} className="record-card note-card">
              <div className="note-card-header">
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted-copy">{formatTimestamp(item.createdAt)}</p>
                </div>
              </div>
              <p className="note-body">{item.body}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
