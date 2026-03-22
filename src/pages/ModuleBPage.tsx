import { Navigate } from "react-router-dom";
import { ROUTES } from "../access/routes";
import { useAuth } from "../auth/useAuth";

export default function ModuleBPage() {
  const { accessState } = useAuth();

  if (accessState !== "admin") {
    return (
      <section className="panel">
        <p className="eyebrow">Module B</p>
        <h2>Admin access required</h2>
        <p>This module can only be used by administrators with write permission.</p>
      </section>
    );
  }

  return <Navigate to={ROUTES.adminNotes} replace />;
}
