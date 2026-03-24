import { useEffect, useState, type FormEvent } from "react";
import { FeedbackMessage } from "../ui";
import type {
  NoteDraft,
  NoteEditorLabels,
  NoteEditorMode,
  NoteEditorPlaceholders,
} from "./types";
import styles from "./NoteEditor.module.css";

const DEFAULT_DRAFT: Required<NoteDraft> = {
  title: "",
  body: "",
  published: true,
};

type NoteEditorProps = {
  mode: NoteEditorMode;
  initialValue?: NoteDraft;
  labels?: NoteEditorLabels;
  placeholders?: NoteEditorPlaceholders;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  showPublishedToggle?: boolean;
  titleFieldId: string;
  bodyFieldId: string;
  publishedFieldId?: string;
  onSubmit: (draft: NoteDraft) => Promise<void> | void;
  onSecondarySubmit?: (draft: NoteDraft) => Promise<void> | void;
  onCancel?: () => void;
};

function normalizeDraft(value?: NoteDraft): Required<NoteDraft> {
  return {
    title: value?.title ?? DEFAULT_DRAFT.title,
    body: value?.body ?? DEFAULT_DRAFT.body,
    published: value?.published ?? DEFAULT_DRAFT.published,
  };
}

export default function NoteEditor({
  mode,
  initialValue,
  labels,
  placeholders,
  isSubmitting = false,
  errorMessage = null,
  successMessage = null,
  showPublishedToggle = false,
  titleFieldId,
  bodyFieldId,
  publishedFieldId,
  onSubmit,
  onSecondarySubmit,
  onCancel,
}: NoteEditorProps) {
  const [draft, setDraft] = useState<Required<NoteDraft>>(() => normalizeDraft(initialValue));

  useEffect(() => {
    setDraft(normalizeDraft(initialValue));
  }, [initialValue]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await handleSubmission(onSubmit);
  }

  async function handleSubmission(submitHandler: (draft: NoteDraft) => Promise<void> | void) {
    try {
      await submitHandler(draft);
    } catch {
      return;
    }

    if (mode === "create") {
      setDraft(normalizeDraft(initialValue));
    }
  }

  const createSubmitLabel = labels?.createSubmitLabel ?? "Create note";
  const unpublishedSubmitLabel = labels?.unpublishedSubmitLabel ?? createSubmitLabel;
  const editSubmitLabel = labels?.editSubmitLabel ?? "Save changes";
  const secondarySubmitLabel = labels?.secondarySubmitLabel ?? "Save draft";
  const savingLabel = labels?.savingLabel ?? "Saving...";
  const submitLabel =
    mode === "edit" ? editSubmitLabel : showPublishedToggle && !draft.published ? unpublishedSubmitLabel : createSubmitLabel;

  return (
    <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <label className="field-label" htmlFor={titleFieldId}>
          {labels?.titleLabel ?? "Title"}
        </label>
        <input
          id={titleFieldId}
          type="text"
          value={draft.title}
          onChange={(event) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              title: event.target.value,
            }))
          }
          placeholder={placeholders?.title}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="field-label" htmlFor={bodyFieldId}>
          {labels?.bodyLabel ?? "Body"}
        </label>
        <textarea
          id={bodyFieldId}
          value={draft.body}
          onChange={(event) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              body: event.target.value,
            }))
          }
          placeholder={placeholders?.body}
          rows={5}
          disabled={isSubmitting}
        />
      </div>

      {showPublishedToggle && publishedFieldId ? (
        <label className={styles.checkboxRow} htmlFor={publishedFieldId}>
          <input
            id={publishedFieldId}
            type="checkbox"
            checked={draft.published}
            onChange={(event) =>
              setDraft((currentDraft) => ({
                ...currentDraft,
                published: event.target.checked,
              }))
            }
            disabled={isSubmitting}
          />
          {labels?.publishedLabel ?? "Publish immediately"}
        </label>
      ) : null}

      <div className="button-row">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? savingLabel : submitLabel}
        </button>
        {onSecondarySubmit ? (
          <button
            type="button"
            className="secondary-button"
            onClick={() => void handleSubmission(onSecondarySubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? savingLabel : secondarySubmitLabel}
          </button>
        ) : null}
        {mode === "edit" && onCancel ? (
          <button type="button" className="secondary-button" onClick={onCancel} disabled={isSubmitting}>
            {labels?.cancelLabel ?? "Cancel"}
          </button>
        ) : null}
      </div>

      <FeedbackMessage kind="success" message={successMessage} />
      <FeedbackMessage kind="error" message={errorMessage} />
    </form>
  );
}
