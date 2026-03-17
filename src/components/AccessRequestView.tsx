import { useState } from "react";
import { submitAccessRequest } from "../access/service";
import { useAuth } from "../auth/useAuth";

export default function AccessRequestView() {
  const { refreshAccessState, signOut, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!user) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await submitAccessRequest(user);
      setFeedbackMessage("Access request received. Your request is pending review.");
      await refreshAccessState();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit access request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="app-shell" className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Access Request</p>
        <h1 id="app-title">Request dashboard access</h1>
        <p>
          Google sign-in is complete, but this account is not on the approved subscriber
          allow list yet.
        </p>
        {user?.email ? (
          <div className="info-card">
            <span className="info-label">Signed in email</span>
            <strong>{user.email}</strong>
          </div>
        ) : null}
        <div className="button-row">
          <button type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Submitting request..." : "Request access"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void signOut()}
            disabled={isSubmitting}
          >
            Cancel and sign out
          </button>
        </div>
        {feedbackMessage ? <p className="success-copy">{feedbackMessage}</p> : null}
        {errorMessage ? (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
