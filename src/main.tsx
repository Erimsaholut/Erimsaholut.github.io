import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

console.log(
  "%cHi there 👋%c\nThis site hides a few secrets. Start with the key above Tab — or the last letter of my name.",
  "font: 600 14px system-ui; color: #FFB547",
  "font: 12px system-ui; color: #A2A499"
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
