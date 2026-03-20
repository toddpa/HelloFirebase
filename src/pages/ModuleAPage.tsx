import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";
import { useAuth } from "../auth/useAuth";
import { listModuleAItems, toModuleAErrorMessage } from "../moduleA/service";
import type { ModuleAItem } from "../moduleA/types";

type ModuleAListItemProps = {
  item: ModuleAItem;
};

function formatTimestamp(value: Timestamp | null) {
  if (!value) {
    return "Updated time not available";
  }

  return value.toDate().toLocaleString();
}

function ModuleAListItem({ item }: ModuleAListItemProps) {
  return (
    <article className="record-card">
      <div>
        <strong>{item.title}</strong>
        {item.summary ? <p>{item.summary}</p> : null}
        <p className="muted-copy">Document ID: {item.id}</p>
        <p className="muted-copy">{formatTimestamp(item.updatedAt)}</p>
      </div>
      {item.status ? <span className="status-pill">{item.status}</span> : null}
    </article>
  );
}

export default function ModuleAPage() {
  const { accessState } = useAuth();
  const [items, setItems] = useState<ModuleAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const nextItems = await listModuleAItems();
      setItems(nextItems);
    } catch (error: unknown) {
      setItems([]);
      setErrorMessage(toModuleAErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessState !== "approved" && accessState !== "admin") {
      return;
    }

    void loadItems();
  }, [accessState]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Module A</p>
          <h2>Shared subscriber updates</h2>
          <p>Authenticated dashboard users can read the shared Firestore content in this module.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => void loadItems()} disabled={loading}>
          Refresh
        </button>
      </div>

      {errorMessage ? (
        <p className="auth-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {loading ? <p>Loading shared updates...</p> : null}

      {!loading && !errorMessage && items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No shared updates yet.</p>
          <p className="muted-copy">Add documents to the subscriber content collection to populate Module A.</p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="record-list" aria-label="Shared subscriber updates">
          {items.map((item) => (
            <ModuleAListItem key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
