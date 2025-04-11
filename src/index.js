import React from "react";
import ReactDOM from "react-dom/client";
import { Worker } from '@react-pdf-viewer/core';
import "./App.css";
import "./tailwind.css"; // Import Tailwind CSS
import PDFReaderApp from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
      <PDFReaderApp />
    </Worker>
  </React.StrictMode>
);

