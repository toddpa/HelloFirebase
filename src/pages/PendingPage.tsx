import AccessStatusView from "../components/AccessStatusView";

export default function PendingPage() {
  return (
    <AccessStatusView
      eyebrow="Pending Access"
      title="Your request is pending review"
      message="Access request received. Your request is pending review."
    />
  );
}
