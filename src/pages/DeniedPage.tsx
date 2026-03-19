import { useLocation } from "react-router-dom";
import AccessStatusView from "../components/AccessStatusView";

export default function DeniedPage() {
  const location = useLocation();
  const unauthorizedFrom =
    typeof location.state === "object" &&
    location.state !== null &&
    "unauthorizedFrom" in location.state &&
    typeof location.state.unauthorizedFrom === "string"
      ? location.state.unauthorizedFrom
      : null;

  return (
    <AccessStatusView
      eyebrow="Denied Access"
      title="Access has not been granted"
      message={
        unauthorizedFrom
          ? `You do not have access to ${unauthorizedFrom}. Access has not been granted for this account.`
          : "Access has not been granted for this account."
      }
    />
  );
}
