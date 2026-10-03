import "@fontsource-variable/inter";
import "./global.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./app/providers/AppProviders";
import { AppRouter } from "./app/router";

/**
 * Componente raíz de KIPU'S ERP.
 * Conecta los proveedores globales y el enrutador centralizado.
 */
export const App: React.FC = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProviders>
  );
};

// Montaje en el DOM
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

export default App;
