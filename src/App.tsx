import { useState } from "react";

export default function App() {
  const [showDevelopmentLog, setShowDevelopmentLog] = useState(false);

  const developmentLog = [
    "This app was built entirely from an iPad.",
    "This project was built with Vite.",
    "Now building form MacBook",
    "Implemented using react",
    "We are now using TypeScript to implement this project.",
  ];

  const handleClick = () => {
    setShowDevelopmentLog((currentValue) => !currentValue);
  };

  return (
    <main id="app-shell" className="container">
      <h1 id="app-title">Dashboard</h1>
      <button id="primary-action" type="button" onClick={handleClick}>
        {showDevelopmentLog ? "Hide Development Log" : "Show Development Log"}
      </button>
      <div id="status-message">
        {showDevelopmentLog &&
          developmentLog.map((entry) => <p key={entry}>{entry}</p>)}
      </div>
    </main>
  );
}
