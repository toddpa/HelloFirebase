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

function formatTimestamp(value?: Timestamp | null) {
  if (!value) {
    return "--";
  }

  return value.toDate().toLocaleString();
}

export default function AdminPage() {
  const { accessState, user } = useAuth();
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmailRecord[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequestRecord[]>([]);
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
      const [allowedEmailRecords, pendingAccessRequests] = await Promise.all([
        listAllowedEmails(),
        listPendingAccessRequests(),
      ]);
      setAllowedEmails(allowedEmailRecords);
      setPendingRequests(pendingAccessRequests);
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

  async function handleAllowedEmailAction(
    normalizedEmail: string,
    nextAction: string
  ) {
    if (!nextAction) {
      return;
    }

    if (nextAction === "remove") {
      await handleRemoveEmail(normalizedEmail);
    }
  }

  async function handlePendingRequestAction(
    requestRecord: AccessRequestRecord,
    nextAction: string
  ) {
    if (!nextAction) {
      return;
    }

    if (nextAction === "approve" || nextAction === "denied") {
      await handleReviewRequest(requestRecord, nextAction === "approve" ? "approved" : "denied");
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Access management</h2>
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

      <div className="section-heading admin-subsection">
        <div>
          <h3>Approved subscriber emails</h3>
        </div>
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
        <div className="admin-table-shell">
          <table className="admin-table" aria-label="Approved subscriber emails">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Created At</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allowedEmails.map((record) => (
                <tr key={record.normalizedEmail}>
                  <td>{record.email || record.normalizedEmail}</td>
                  <td>Approved</td>
                  <td>{formatTimestamp(record.createdAt)}</td>
                  <td>
                    <select
                      className="admin-action-select"
                      aria-label={`Actions for ${record.email || record.normalizedEmail}`}
                      defaultValue=""
                      onChange={(event) => {
                        void handleAllowedEmailAction(record.normalizedEmail, event.target.value);
                        event.target.value = "";
                      }}
                      disabled={isSubmitting}
                    >
                      <option value="" disabled>
                        Actions
                      </option>
                      <option value="remove">Remove</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="section-heading admin-subsection">
        <div>
          <h3>Pending access requests</h3>
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
        <div className="admin-table-shell">
          <table className="admin-table" aria-label="Pending access requests">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Status</th>
                <th scope="col">Requested At</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((requestRecord) => (
                <tr key={requestRecord.normalizedEmail}>
                  <td>{requestRecord.email || requestRecord.normalizedEmail}</td>
                  <td>{requestRecord.status || "--"}</td>
                  <td>{formatTimestamp(requestRecord.requestedAt)}</td>
                  <td>
                    <select
                      className="admin-action-select"
                      aria-label={`Actions for ${requestRecord.email || requestRecord.normalizedEmail}`}
                      defaultValue=""
                      onChange={(event) => {
                        void handlePendingRequestAction(requestRecord, event.target.value);
                        event.target.value = "";
                      }}
                      disabled={isSubmitting}
                    >
                      <option value="" disabled>
                        Actions
                      </option>
                      <option value="approve">Approve</option>
                      <option value="denied">Deny</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
