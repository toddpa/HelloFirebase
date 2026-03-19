type AccessResolvingViewProps = {
  title?: string;
  message?: string;
};

export default function AccessResolvingView({
  title = "Resolving dashboard access",
  message = "Checking your sign-in and authorization state...",
}: AccessResolvingViewProps) {
  return (
    <main id="app-shell" className="page-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Stage 3 Dashboard</p>
        <h1 id="app-title">{title}</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
