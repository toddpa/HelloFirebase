import { useAuth } from "../auth/useAuth";

export default function SignInView() {
  const { signIn, errorMessage } = useAuth();

  return (
    <main id="app-shell" className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Stage 2B Access Control</p>
        <h1 id="app-title">Dashboard sign-in required</h1>
        <p>
          Every user authenticates with Google first. After sign-in, Firestore authorization
          decides whether this account is an admin, approved subscriber, pending request, denied
          user, or still unknown.
        </p>
        <div className="button-row">
          <button id="google-sign-in" type="button" onClick={() => void signIn()}>
            Sign in with Google
          </button>
        </div>
        {errorMessage ? (
          <p className="auth-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
