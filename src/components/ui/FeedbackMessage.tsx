type FeedbackMessageProps = {
  kind: "error" | "success";
  message: string | null;
  id?: string;
};

export default function FeedbackMessage({ kind, message, id }: FeedbackMessageProps) {
  if (!message) {
    return null;
  }

  if (kind === "error") {
    return (
      <p id={id} className="auth-error" role="alert">
        {message}
      </p>
    );
  }

  return (
    <p id={id} className="success-copy">
      {message}
    </p>
  );
}

