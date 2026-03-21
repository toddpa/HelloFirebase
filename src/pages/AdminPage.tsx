import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";
import {
  allowSubscriberEmail,
  listPendingAccessRequests,
  listAllowedEmails,
  removeSubscriberEmail,
  reviewAccessRequest,
} from "../access/service";
import type { AccessRequestRecord, AllowedEmailRecord } from "../access/types";
import { isValidEmail, normalizeEmail } from "../access/helpers";
import { useAuth } from "../auth/useAuth";
import AdminNoteForm from "../components/notes/AdminNoteForm";
import NotesList from "../components/notes/NotesList";
import {
  listRecentDashboardNotes,
  type DashboardNote,
} from "../features/notes";

function formatTimestamp(value?: Timestamp | null) {
  if (!value) {
    return "Not available";
  }

  return value.toDate().toLocaleString();
}

export default function AdminPage() {
  const { accessState, user } = useAuth();
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmailRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequestRecord[]>([]);
  const [recentNotes, setRecentNotes] = useState<DashboardNote[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  async function loadAllowedEmails() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [allowedEmailRecords, pendingAccessRequests, noteRecords] = await Promise.all([
        listAllowedEmails(),
        listPendingAccessRequests(),
        listRecentDashboardNotes(),
      ]);
      setAllowedEmails(allowedEmailRecords);
      setPendingRequests(pendingAccessRequests);
      setRecentNotes(noteRecords);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load the access control data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessState !== "admin") {
      return;
    }

    void loadAllowedEmails();
  }, [accessState]);

  if (accessState !== "admin") {
    return (
      <section className="panel">
        <p className="eyebrow">Admin</p>
        <h2>This page is restricted to administrators</h2>
        <p>You do not have administrator access for this project.</p>
      </section>
    );
  }

  async function handleAddEmail() {
    if (!user) {
      return;
    }

    const normalizedEmail = normalizeEmail(newEmail);

    setFormError(null);
    setErrorMessage(null);
    setFeedbackMessage(null);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await allowSubscriberEmail(user, normalizedEmail);
      setNewEmail("");
      setFeedbackMessage("Approved email added.");
      await loadAllowedEmails();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Unable to add the approved email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveEmail(normalizedEmail: string) {
    const shouldDelete = window.confirm(
      `Remove ${normalizedEmail} from the approved subscriber allow list?`
    );

    if (!shouldDelete) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await removeSubscriberEmail(normalizedEmail);
      setFeedbackMessage("Approved email removed.");
      await loadAllowedEmails();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to remove the approved email."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReviewRequest(
    requestRecord: AccessRequestRecord,
    nextStatus: "approved" | "denied"
  ) {
    if (!user) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await reviewAccessRequest(user, requestRecord, nextStatus);
      setFeedbackMessage(
        nextStatus === "approved" ? "Access request approved." : "Access request denied."
      );
      await loadAllowedEmails();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to review the access request."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Approved subscriber allow list</h2>
          <p>Manage which email addresses can enter the subscriber application.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void loadAllowedEmails()}
          disabled={loading || isSubmitting}
        >
          Refresh
        </button>
      </div>

      <div className="inline-form">
        <label className="field-label" htmlFor="allow-list-email">
          Email
        </label>
        <input
          id="allow-list-email"
          type="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          placeholder="subscriber@example.com"
          aria-describedby={formError ? "allow-list-form-error" : undefined}
        />
        <button type="button" onClick={() => void handleAddEmail()} disabled={isSubmitting}>
          Add approved email
        </button>
      </div>

      {formError ? (
        <p id="allow-list-form-error" className="auth-error" role="alert">
          {formError}
        </p>
      ) : null}

      {feedbackMessage ? <p className="success-copy">{feedbackMessage}</p> : null}
      {errorMessage ? (
        <p className="auth-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {loading ? <p>Loading approved emails...</p> : null}

      {!loading && allowedEmails.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No approved emails yet.</p>
          <p className="muted-copy">Add the first subscriber email to start granting access.</p>
        </div>
      ) : null}

      {!loading && allowedEmails.length > 0 ? (
        <div className="record-list" aria-label="Approved subscriber emails">
          {allowedEmails.map((record) => (
            <article key={record.normalizedEmail} className="record-card">
              <div>
                <strong>{record.email || record.normalizedEmail}</strong>
                <p className="muted-copy">Normalized: {record.normalizedEmail}</p>
                <p className="muted-copy">Added {formatTimestamp(record.createdAt)}</p>
              </div>
              <button
                type="button"
                className="secondary-button danger-button"
                onClick={() => void handleRemoveEmail(record.normalizedEmail)}
                disabled={isSubmitting}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      ) : null}

      <div className="section-heading admin-subsection">
        <div>
          <p className="eyebrow">Review Queue</p>
          <h2>Pending access requests</h2>
          <p>Approve or deny requests from signed-in users who are not yet on the allow list.</p>
        </div>
      </div>

      {loading ? <p>Loading pending requests...</p> : null}

      {!loading && pendingRequests.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No pending access requests.</p>
          <p className="muted-copy">New subscriber requests will appear here for review.</p>
        </div>
      ) : null}

      {!loading && pendingRequests.length > 0 ? (
        <div className="record-list" aria-label="Pending access requests">
          {pendingRequests.map((requestRecord) => (
            <article key={requestRecord.normalizedEmail} className="record-card">
              <div>
                <strong>{requestRecord.email}</strong>
                <p className="muted-copy">Normalized: {requestRecord.normalizedEmail}</p>
                <p className="muted-copy">Requested {formatTimestamp(requestRecord.requestedAt)}</p>
              </div>
              <div className="button-row">
                <button
                  type="button"
                  onClick={() => void handleReviewRequest(requestRecord, "approved")}
                  disabled={isSubmitting}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="secondary-button danger-button"
                  onClick={() => void handleReviewRequest(requestRecord, "denied")}
                  disabled={isSubmitting}
                >
                  Deny
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="section-heading admin-subsection">
        <div>
          <p className="eyebrow">Dashboard Notes</p>
          <h2>Publish a shared dashboard note</h2>
          <p>Create a note that approved users and admins can read from the shared dashboard home.</p>
        </div>
      </div>

      <AdminNoteForm onCreated={loadAllowedEmails} />

      <div className="section-heading admin-subsection">
        <div>
          <p className="eyebrow">Recent Notes</p>
          <h2>Recent dashboard notes</h2>
          <p>Admins can review the latest saved notes here, including unpublished drafts.</p>
        </div>
      </div>

      {!loading ? (
        <NotesList
          notes={recentNotes}
          ariaLabel="Recent dashboard notes"
          emptyTitle="No dashboard notes yet."
          emptyMessage="Create the first note above to populate the shared dashboard feed."
        />
      ) : null}
    </section>
  );
}
