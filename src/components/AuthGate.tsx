import { useAuth } from "../auth/useAuth";
import DashboardShell from "./DashboardShell";
import SignInView from "./SignInView";

export default function AuthGate() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <main id="app-shell" className="container">
        <h1 id="app-title">Dashboard</h1>
        <p>Checking your sign-in status...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <SignInView />;
  }

  return <DashboardShell />;
}
