import type { DashboardNote } from "../../features/notes";

type NoteCardProps = {
  note: DashboardNote;
};

function formatTimestampLabel(dateLabel: string, value: DashboardNote["createdAt" | "updatedAt"]) {
  if (!value) {
    return `${dateLabel}: Not available`;
  }

  return `${dateLabel}: ${value.toDate().toLocaleString()}`;
}

export default function NoteCard({ note }: NoteCardProps) {
  return (
    <article className="record-card note-card">
      <div className="note-card-header">
        <div>
          <strong>{note.title}</strong>
          <p className="muted-copy">{formatTimestampLabel("Created", note.createdAt)}</p>
          {note.updatedAt ? <p className="muted-copy">{formatTimestampLabel("Updated", note.updatedAt)}</p> : null}
        </div>
        <span className="status-pill">{note.published ? "Published" : "Draft"}</span>
      </div>
      <p className="note-body">{note.body}</p>
      <p className="muted-copy">Posted by {note.createdByEmail}</p>
    </article>
  );
}
