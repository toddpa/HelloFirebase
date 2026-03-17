import { useAuth } from "../auth/useAuth";

type AccessStatusViewProps = {
  title: string;
  message: string;
  eyebrow?: string;
};

export default function AccessStatusView({
  title,
  message,
  eyebrow = "Access Status",
}: AccessStatusViewProps) {
  const { signOut, user } = useAuth();

  return (
    <main id="app-shell" className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="app-title">{title}</h1>
        <p>{message}</p>
        {user?.email ? <p className="muted-copy">Signed in as {user.email}</p> : null}
        <div className="button-row">
          <button type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
