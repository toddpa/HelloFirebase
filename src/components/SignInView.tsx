import { useAuth } from "../auth/useAuth";

export default function SignInView() {
  const { signIn, errorMessage } = useAuth();

  return (
    <main id="app-shell" className="container">
      <h1 id="app-title">Dashboard</h1>
      <p>Sign in is required to access the dashboard.</p>
      <button id="google-sign-in" type="button" onClick={() => void signIn()}>
        Sign in with Google
      </button>
      {errorMessage ? (
        <p className="auth-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </main>
  );
}
