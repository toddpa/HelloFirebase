import { useEffect, useState } from "react";
import { runAccessDiagnostics, type AccessDiagnostics } from "../access/service";
import { useAuth } from "../auth/useAuth";

function shouldShowAccessDebugPanel() {
  const envDebugEnabled = import.meta.env.VITE_SHOW_ACCESS_DEBUG === "true";

  if (envDebugEnabled) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("debugAuth") === "1";
}

export default function AccessDebugPanel() {
  const { accessState, isAuthenticated, normalizedEmail, user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<AccessDiagnostics | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);

  if (!shouldShowAccessDebugPanel()) {
    return null;
  }

  async function loadDiagnostics() {
    if (!user) {
      setDiagnostics(null);
      setDiagnosticsError(null);
      return;
    }

    setIsLoadingDiagnostics(true);
    setDiagnosticsError(null);

    try {
      const nextDiagnostics = await runAccessDiagnostics(user);
      setDiagnostics(nextDiagnostics);
    } catch (error: unknown) {
      setDiagnostics(null);
      setDiagnosticsError(error instanceof Error ? error.message : "Unable to run access diagnostics.");
    } finally {
      setIsLoadingDiagnostics(false);
    }
  }

  useEffect(() => {
    void loadDiagnostics();
  }, [user?.uid, user?.email]);

  return (
    <section className="panel access-debug-panel" aria-label="Access debug information">
      <p className="eyebrow">Access Debug</p>
      <h2>Authentication and access snapshot</h2>
      <dl className="debug-grid">
        <dt>Firebase project</dt>
        <dd>{import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "Not configured"}</dd>
        <dt>Using emulators</dt>
        <dd>{import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" ? "true" : "false"}</dd>
        <dt>Is authenticated</dt>
        <dd>{isAuthenticated ? "true" : "false"}</dd>
        <dt>Auth email</dt>
        <dd>{user?.email ?? "Unavailable"}</dd>
        <dt>Normalized email</dt>
        <dd>{normalizedEmail ?? "Unavailable"}</dd>
        <dt>UID</dt>
        <dd>{user?.uid ?? "Unavailable"}</dd>
        <dt>Access state</dt>
        <dd>{accessState ?? "Unavailable"}</dd>
      </dl>
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={() => void loadDiagnostics()} disabled={isLoadingDiagnostics}>
          {isLoadingDiagnostics ? "Refreshing debug..." : "Refresh debug"}
        </button>
      </div>
      {diagnosticsError ? (
        <p className="auth-error" role="alert">
          {diagnosticsError}
        </p>
      ) : null}
      {diagnostics ? (
        <dl className="debug-grid">
          <dt>Admin marker read</dt>
          <dd>{diagnostics.adminMarker}</dd>
          <dt>Access request read</dt>
          <dd>{diagnostics.accessRequest}</dd>
          <dt>Access request status</dt>
          <dd>{diagnostics.accessRequestStatus}</dd>
          <dt>Subscriber probe read</dt>
          <dd>{diagnostics.subscriberProbe}</dd>
          <dt>Diagnostic normalized email</dt>
          <dd>{diagnostics.normalizedEmail ?? "Unavailable"}</dd>
        </dl>
      ) : null}
      <p className="muted-copy">
        Enable this panel with <code>?debugAuth=1</code> or set <code>VITE_SHOW_ACCESS_DEBUG=true</code>.
      </p>
    </section>
  );
}
