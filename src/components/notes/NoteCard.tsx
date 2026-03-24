import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { NoteDisplayOptions, NoteRecord } from "./types";
import styles from "./NoteCard.module.css";

type NoteCardProps = {
  note: NoteRecord;
  displayOptions?: NoteDisplayOptions;
  actions?: ReactNode;
  to?: string;
};

function formatTimestampLabel(label: string, value: NoteRecord["createdAt" | "updatedAt"]) {
  if (!value) {
    return `${label}: Not available`;
  }

  return `${label}: ${value.toDate().toLocaleString()}`;
}

export default function NoteCard({ note, displayOptions, actions, to }: NoteCardProps) {
  const showCreatedAt = displayOptions?.showCreatedAt ?? true;
  const showUpdatedAt = displayOptions?.showUpdatedAt ?? true;
  const showAuthorEmail = displayOptions?.showAuthorEmail ?? false;
  const showPublicationStatus = displayOptions?.showPublicationStatus ?? false;
  const content = (
    <article className={`record-card ${styles.card}`}>
      <div className={styles.header}>
        <div>
          <strong>{note.title}</strong>
          {showCreatedAt ? <p className="muted-copy">{formatTimestampLabel("Created", note.createdAt)}</p> : null}
          {showUpdatedAt ? <p className="muted-copy">{formatTimestampLabel("Updated", note.updatedAt ?? null)}</p> : null}
        </div>
        <div className="button-row">
          {showPublicationStatus ? (
            <span className="status-pill">{note.published ? "Published" : "Draft"}</span>
          ) : null}
          {actions}
        </div>
      </div>
      <p className={styles.body}>{note.body}</p>
      {showAuthorEmail && note.createdByEmail ? <p className="muted-copy">Posted by {note.createdByEmail}</p> : null}
    </article>
  );

  if (!to) {
    return content;
  }

  return (
    <Link to={to} className={styles.cardLink}>
      {content}
    </Link>
  );
}
