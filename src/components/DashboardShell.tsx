import { useState } from "react";
import { useAuth } from "../auth/useAuth";

export default function DashboardShell() {
  const { user, signOut, errorMessage } = useAuth();
  const [showDevelopmentLog, setShowDevelopmentLog] = useState(false);

  const developmentLog = [
    "This app was built entirely from an iPad.",
    "This project was built with Vite.",
    "Now building form MacBook",
    "Implemented using react",
    "We are now using TypeScript to implement this project.",
  ];

  const displayName = user?.displayName ?? "Welcome";

  return (
    <main id="app-shell" className="container">
      <div className="dashboard-header">
        <div>
          <h1 id="app-title">Dashboard</h1>
          <p className="user-greeting">Hello, {displayName}.</p>
          {user?.email ? <p className="user-email">{user.email}</p> : null}
        </div>
        <button id="sign-out" type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>

      <button
        id="primary-action"
        type="button"
        onClick={() => setShowDevelopmentLog((currentValue) => !currentValue)}
      >
        {showDevelopmentLog ? "Hide Development Log" : "Show Development Log"}
      </button>

      <div id="status-message">
        {showDevelopmentLog
          ? developmentLog.map((entry) => <p key={entry}>{entry}</p>)
          : null}
      </div>

      {errorMessage ? (
        <p className="auth-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </main>
  );
}
