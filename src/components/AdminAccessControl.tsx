import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";
import {
  allowSubscriberEmail,
  listAccessRequests,
  listAllowedEmails,
  removeSubscriberEmail,
  reviewAccessRequest,
} from "../access/service";
import type { AccessRequestRecord, AllowedEmailRecord } from "../access/types";
import { useAuth } from "../auth/useAuth";

function formatTimestamp(value?: Timestamp | null) {
  if (!value) {
    return "Not available";
  }

  return value.toDate().toLocaleString();
}

export default function AdminAccessControl() {
  const { user } = useAuth();
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmailRecord[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestRecord[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  async function loadAdminData() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [nextAllowedEmails, nextAccessRequests] = await Promise.all([
        listAllowedEmails(),
        listAccessRequests(),
      ]);

      setAllowedEmails(nextAllowedEmails);
      setAccessRequests(nextAccessRequests);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load access control data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function handleAllowEmail() {
    if (!user) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await allowSubscriberEmail(user, newEmail);
      setNewEmail("");
      setFeedbackMessage("Approved email saved.");
      await loadAdminData();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save approved email.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveEmail(normalizedEmail: string) {
    setSubmitting(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await removeSubscriberEmail(normalizedEmail);
      setFeedbackMessage("Approved email removed.");
      await loadAdminData();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to remove approved email.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(requestRecord: AccessRequestRecord, nextStatus: "approved" | "denied") {
    if (!user) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await reviewAccessRequest(user, requestRecord, nextStatus);
      setFeedbackMessage(
        nextStatus === "approved" ? "Access request approved." : "Access request denied."
      );
      await loadAdminData();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to review access request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Admin Tools</p>
            <h2>Approved subscriber allow list</h2>
          </div>
          <button type="button" className="secondary-button" onClick={() => void loadAdminData()}>
            Refresh
          </button>
        </div>
        <div className="inline-form">
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="subscriber@example.com"
            aria-label="Approved email address"
          />
          <button type="button" onClick={() => void handleAllowEmail()} disabled={submitting}>
            Add approved email
          </button>
        </div>
        {loading ? <p>Loading approved emails...</p> : null}
        {!loading && allowedEmails.length === 0 ? (
          <p className="muted-copy">No subscriber emails have been approved yet.</p>
        ) : null}
        {!loading && allowedEmails.length > 0 ? (
          <div className="record-list">
            {allowedEmails.map((record) => (
              <article key={record.normalizedEmail} className="record-card">
                <div>
                  <strong>{record.normalizedEmail}</strong>
                  <p className="muted-copy">
                    Added {formatTimestamp(record.createdAt)} by {record.createdBy}
                  </p>
                </div>
                <button
                  type="button"
                  className="secondary-button danger-button"
                  onClick={() => void handleRemoveEmail(record.normalizedEmail)}
                  disabled={submitting}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Review Queue</p>
            <h2>Access requests</h2>
          </div>
        </div>
        {loading ? <p>Loading access requests...</p> : null}
        {!loading && accessRequests.length === 0 ? (
          <p className="muted-copy">No access requests have been submitted yet.</p>
        ) : null}
        {!loading && accessRequests.length > 0 ? (
          <div className="record-list">
            {accessRequests.map((requestRecord) => (
              <article key={requestRecord.normalizedEmail} className="record-card">
                <div>
                  <strong>{requestRecord.normalizedEmail}</strong>
                  <p className="muted-copy">
                    Status: {requestRecord.status} | Requested {formatTimestamp(requestRecord.requestedAt)}
                  </p>
                  {requestRecord.reviewedAt ? (
                    <p className="muted-copy">
                      Reviewed {formatTimestamp(requestRecord.reviewedAt)} by {requestRecord.reviewedBy}
                    </p>
                  ) : null}
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    onClick={() => void handleReview(requestRecord, "approved")}
                    disabled={submitting}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="secondary-button danger-button"
                    onClick={() => void handleReview(requestRecord, "denied")}
                    disabled={submitting}
                  >
                    Deny
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {feedbackMessage ? <p className="success-copy">{feedbackMessage}</p> : null}
        {errorMessage ? (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </section>
  );
}
