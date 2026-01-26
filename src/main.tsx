import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";
import "./i18n";

// Suppress known Radix UI Portal errors in development
// This error occurs due to HMR or Chrome translation and doesn't affect functionality
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    const errorMessage = args[0]?.toString?.() || '';
    if (
      errorMessage.includes('removeChild') ||
      errorMessage.includes('NotFoundError') ||
      (typeof args[0] === 'object' && args[0]?.name === 'NotFoundError')
    ) {
      // Silently ignore these known DOM mutation errors
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
