import "./style.css";

document.getElementById("helloBtn").addEventListener("click", () => {
  document.getElementById("output").textContent =
    "Hello from your Firebase-hosted iPad app.";
});
