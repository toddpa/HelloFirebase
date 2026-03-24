import type { ReactNode } from "react";
import { EmptyState } from "../ui";
import NoteCard from "./NoteCard";
import type { NoteDisplayOptions, NoteRecord } from "./types";
import styles from "./NoteList.module.css";

type NoteListProps = {
  notes: NoteRecord[];
  emptyTitle: string;
  emptyMessage?: string;
  ariaLabel: string;
  displayOptions?: NoteDisplayOptions;
  renderActions?: (note: NoteRecord) => ReactNode;
  itemTo?: (note: NoteRecord) => string;
};

export default function NoteList({
  notes,
  emptyTitle,
  emptyMessage,
  ariaLabel,
  displayOptions,
  renderActions,
  itemTo,
}: NoteListProps) {
  if (notes.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className={styles.list} aria-label={ariaLabel}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          displayOptions={displayOptions}
          actions={renderActions ? renderActions(note) : null}
          to={itemTo ? itemTo(note) : undefined}
        />
      ))}
    </div>
  );
}
