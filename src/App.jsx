import { useState } from "react";

export default function App() {
  const [message, setMessage] = useState("");

  const handleClick = () => {
    setMessage("Hello from your Firebase-hosted iPad app.");
  };

  return (
    <main className="container">
      <h1>Hello World</h1>
      <p>This app was built entirely from an iPad.</p>
      <p>This project was built with Vite.</p>
      <p>Now building form MacBook</p>
      <p>Implemented using react</p>
      <button type="button" onClick={handleClick}>
        Tap me
      </button>
      <p id="output">{message}</p>
    </main>
  );
}
