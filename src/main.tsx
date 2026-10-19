import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

console.log(
  "%cHi there 👋%c\nCurious? Tap the last letter of my name three times.",
  "font: 600 14px system-ui; color: #FFB547",
  "font: 12px system-ui; color: #A2A499"
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
