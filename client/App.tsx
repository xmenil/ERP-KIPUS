import "@fontsource-variable/inter";
import "./global.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./app/providers/AppProviders";
import { AppRouter } from "./app/router";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Parche de protección DOM: evita que extensiones de navegador o Google Translate
// causen el fallo fatal 'NotFoundError: Failed to execute removeChild on Node' al mutar nodos de texto.
if (typeof window !== "undefined" && typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("DOM: Se evitó fallo al intentar remover un nodo que fue modificado externamente.", child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("DOM: Se evitó fallo al intentar insertar antes de un nodo modificado externamente.", referenceNode);
      }
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

/**
 * Componente raíz de KIPU'S ERP.
 * Conecta los proveedores globales y el enrutador centralizado.
 */
export const App: React.FC = () => {
  return (
    <ErrorBoundary moduleName="KIPU'S ERP">
      <AppProviders>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppProviders>
    </ErrorBoundary>
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
