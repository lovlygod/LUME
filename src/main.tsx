import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryProvider } from "./lib/queryClient.tsx";
import { LanguageProvider } from "./contexts/LanguageContext";

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <AuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </QueryProvider>
);
