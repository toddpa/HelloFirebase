import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  title: string;
  message?: string;
};

export default function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className={styles.root}>
      <p className={styles.title}>{title}</p>
      {message ? <p className="muted-copy">{message}</p> : null}
    </div>
  );
}
