type ProfilePageProps = {
  eyebrow: string;
  title: string;
  message: string;
};

export default function ProfilePage({ eyebrow, title, message }: ProfilePageProps) {
  return (
    <section className="panel">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}
