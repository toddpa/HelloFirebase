import AccessStatusView from "../components/AccessStatusView";

export default function DeniedPage() {
  return (
    <AccessStatusView
      eyebrow="Denied Access"
      title="Access has not been granted"
      message="Access has not been granted for this account."
    />
  );
}
